package model

const jobOutcomeQuery = `
DECLARE @jid varchar(200) = ?;
DECLARE @srd int = ?;
DECLARE @srt int = ?;

DECLARE @contents TABLE (
	instance_id int,
	job_id uniqueidentifier,
	job_name nvarchar(128),
	step_id int,
	step_name nvarchar(128),
	sql_message_id int,
	sql_severity int,
	message nvarchar(4000) null,
	run_status varchar(50),
	run_date int,
	run_time int,
	run_duration int,
	operator_emailed nvarchar(128) null,
	operator_netsent nvarchar(128) null,
	operator_paged nvarchar(128) null,
	retries_attempted int,
	server nvarchar(128)
);

INSERT INTO @contents
exec dbo.sp_help_jobhistory @job_id = @jid, @start_run_date = @srd, @start_run_time = @srt, @oldest_first = 1, @mode = 'FULL';

WITH ubound AS (
	SELECT instance_id
	FROM @contents
	WHERE step_id = 0 AND run_date = @srd AND run_time = @srt
)
SELECT
	instance_id,
	job_id = CAST(job_id as varchar(200)),
	job_name,
	step_id,
	step_name,
	sql_message_id,
	sql_severity,
	message,
	run_status = CASE run_status
		WHEN 0 THEN 'Failed'
		WHEN 1 THEN 'Succeeded'
		WHEN 2 THEN 'Retry'
		WHEN 3 THEN 'Cancelled'
		WHEN 4 THEN 'Running'
	END,
	run_date = CONVERT(DATETIME, CONVERT(CHAR(8), [run_date], 112) + ' ' + 
			STUFF(STUFF(RIGHT('000000' + CONVERT(VARCHAR(8), [run_time]), 6), 5, 0, ':'), 3, 0, ':')),
	run_duration,
	operator_emailed,
	operator_netsent,
	operator_paged,
	retries_attempted,
	server
FROM @contents
WHERE instance_id <= (SELECT instance_id FROM ubound);
`

const runsSinceQuery = `
DECLARE @jpat varchar(200) = ?;
DECLARE @srd int = ?;

DECLARE @contents TABLE (
	instance_id int,
	job_id uniqueidentifier,
	job_name nvarchar(128),
	step_id int,
	step_name nvarchar(128),
	sql_message_id int,
	sql_severity int,
	message nvarchar(4000) null,
	run_status varchar(50),
	run_date int,
	run_time int,
	run_duration int,
	operator_emailed nvarchar(128) null,
	operator_netsent nvarchar(128) null,
	operator_paged nvarchar(128) null,
	retries_attempted int,
	server nvarchar(128)
);

INSERT INTO @contents
exec dbo.sp_help_jobhistory @start_run_date = @srd, @oldest_first = 1, @mode = 'FULL';

SELECT
	instance_id,
	job_id = CAST(job_id as varchar(200)),
	job_name,
	step_id,
	step_name,
	sql_message_id,
	sql_severity,
	message,
	run_status = CASE run_status
		WHEN 0 THEN 'Failed'
		WHEN 1 THEN 'Succeeded'
		WHEN 2 THEN 'Retry'
		WHEN 3 THEN 'Cancelled'
		WHEN 4 THEN 'Running'
	END,
	run_date = CONVERT(DATETIME, CONVERT(CHAR(8), [run_date], 112) + ' ' + 
			STUFF(STUFF(RIGHT('000000' + CONVERT(VARCHAR(8), [run_time]), 6), 5, 0, ':'), 3, 0, ':')),
	run_duration,
	operator_emailed,
	operator_netsent,
	operator_paged,
	retries_attempted,
	server
FROM @contents
WHERE
	step_id = 0
AND job_name like @jpat;
`

const jobStateQuery = `
WITH wide AS (
	SELECT	[JobID] = CAST([jobs].[job_id] as varchar(200))
			,[JobName] = [jobs].[name]
			,[Scheduled] = CAST(CASE [schedule].[enabled] WHEN 1 THEN 1 ELSE 0 END as bit)
			,[LastRunDate] =
				CASE
					WHEN [running].[job_id] IS NOT NULL THEN [running].[start_exec_date]
					ELSE [lastrun].[run_dttm]
				END
			,[DurationInSec] =
				CASE
					WHEN [running].[job_id] IS NOT NULL THEN NULL
					ELSE CONVERT(DECIMAL(18, 2), [lastrun].[run_duration])
				END
			,[AvgDurationInSec] = CONVERT(DECIMAL(18, 2), [jobhistory].[AvgDuration])
			,[LastRunResult] =
				CASE
					WHEN [running].[job_id] IS NOT NULL THEN 'Running'
					ELSE
						CASE [lastrun].[run_status]
							WHEN 0 THEN 'Failed'
							WHEN 1 THEN 'Succeeded'
							WHEN 2 THEN 'Retry'
							WHEN 3 THEN 'Cancelled'
							WHEN 4 THEN 'Running'
						END
				END
			,[NextRunDate] = 
					CASE [jobschedule].[next_run_date]
						WHEN 0 THEN CONVERT(DATETIME, '1900/1/1')
						ELSE CONVERT(DATETIME, CONVERT(CHAR(8), [jobschedule].[next_run_date], 112) + ' ' + 
							 STUFF(STUFF(RIGHT('000000' + CONVERT(VARCHAR(8), [jobschedule].[next_run_time]), 6), 5, 0, ':'), 3, 0, ':'))
					END
	FROM	 [msdb].[dbo].[sysjobs] AS [jobs] WITH(NOLOCK) 
			 LEFT OUTER JOIN [msdb].[dbo].[sysjobschedules] AS [jobschedule] WITH(NOLOCK) 
					 ON [jobs].[job_id] = [jobschedule].[job_id] 
			 LEFT OUTER JOIN [msdb].[dbo].[sysschedules] AS [schedule] WITH(NOLOCK) 
					 ON [jobschedule].[schedule_id] = [schedule].[schedule_id] 
			 LEFT OUTER JOIN 
						(	SELECT	 [job_id]
									 , [AvgDuration] = (SUM((([run_duration] / 10000 * 3600) + 
																	(([run_duration] % 10000) / 100 * 60) + 
																	 ([run_duration] % 10000) % 100)) * 1.0) / COUNT([job_id])
							FROM	 [msdb].[dbo].[sysjobhistory] WITH(NOLOCK)
							WHERE	 [step_id] = 0 
							GROUP BY [job_id]
						 ) AS [jobhistory] 
					 ON [jobhistory].[job_id] = [jobs].[job_id]
			OUTER APPLY 
						(
							SELECT TOP 1 [job_id]
								   , [run_status]
								   , [run_dttm] = CONVERT(DATETIME, CONVERT(CHAR(8), [run_date], 112) + ' ' + 
											 STUFF(STUFF(RIGHT('000000' + CONVERT(VARCHAR(8), [run_time]), 6), 5, 0, ':'), 3, 0, ':'))
								   , [run_duration]
							FROM [msdb].[dbo].[sysjobhistory] WITH(NOLOCK)
							WHERE [job_id] = [jobs].[job_id]
							AND [step_id] = 0
							ORDER BY instance_id desc
						) AS [lastrun] (job_id, run_status, run_dttm, run_duration)
			OUTER APPLY
						(
							SELECT
								ja.job_id,
								ja.start_execution_date
							FROM msdb.dbo.sysjobactivity ja 
							LEFT JOIN msdb.dbo.sysjobhistory jh 
								ON ja.job_history_id = jh.instance_id
							WHERE ja.session_id = (SELECT TOP 1 session_id FROM msdb.dbo.syssessions ORDER BY agent_start_date DESC)
								AND start_execution_date is not null
								AND stop_execution_date is null
								AND ja.job_id = [jobs].[job_id]
						) AS [running] (job_id, start_exec_date)
	WHERE
		[jobs].[name] LIKE ?
),
filtered as (
	SELECT *
	FROM wide
	WHERE LastRunDate IS NOT NULL OR (
		NextRunDate IS NOT NULL AND
		NextRunDate > GETDATE()
	)
)
SELECT JobID, JobName, Scheduled, LastRunDate, DurationInSec, AvgDurationInSec, LastRunResult, NextRunDate = MIN(filtered.NextRunDate)
FROM filtered
GROUP BY JobID, JobName, Scheduled, LastRunDate, DurationInSec, AvgDurationInSec, LastRunResult
ORDER BY NextRunDate
;
`
