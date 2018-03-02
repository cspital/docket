package model

import (
	"log"
	"time"

	"github.com/BiffJutsu/docket/server/utils"
	"github.com/guregu/null"
	"github.com/jmoiron/sqlx"
)

// Result constants
const (
	Failed    = "Failed"
	Succeeded = "Succeeded"
	Retry     = "Retry"
	Cancelled = "Cancelled"
	Running   = "Running"
)

// Job ...
type Job struct {
	ID              string      `db:"JobID" json:"job_id"`
	Name            string      `db:"JobName" json:"name"`
	Scheduled       bool        `db:"Scheduled" json:"scheduled"`
	Run             null.Time   `db:"LastRunDate" json:"run_date"`
	Duration        null.Float  `db:"DurationInSec" json:"run_duration"`
	AverageDuration null.Float  `db:"AvgDurationInSec" json:"avg_run_duration"`
	Result          null.String `db:"LastRunResult" json:"run_result"`
	NextRun         null.Time   `db:"NextRunDate" json:"next_run"`
}

// NextCheck ...
func (j *Job) NextCheck() time.Time {
	now := time.Now()
	// if running
	if j.Result.Valid && j.Result.String == Running {
		log.Printf("%s is running.", j.Name)

		if j.AverageDuration.Valid && j.Run.Valid {
			duration := time.Duration(j.AverageDuration.Float64+3) * time.Second
			runPlusAvg := j.Run.Time.Add(duration)

			if runPlusAvg.After(now) {
				return runPlusAvg
			}
		}
		// first run or was still running at last check
		return now.Add(30 * time.Second)
	}

	// if in process of updating, give it a healthy buffer
	if j.Run.Valid && j.NextRun.Valid && j.Run.Time == j.NextRun.Time {
		return now.Add(5 * time.Minute)
	}

	// not running
	if j.NextRun.Valid {
		if j.NextRun.Time.After(now) {
			// SQL Server sucks and doesn't actually start jobs on time
			// instead they "request" that they be started and then they start when it is
			// convenient, so we pad this with an arbitrary duration to try and hopefully query it right the first time
			return j.NextRun.Time.Add(1 * time.Second)
		}

		prev := now.Add(-1 * time.Minute)
		if j.NextRun.Time.After(prev) {
			// likely that SQL Server is just a little choked up on something, check again
			return now.Add(5 * time.Second)
		}
	}
	return now.Add(7 * 24 * time.Hour) // put it way the hell out there
}

// NewJobService ...
func NewJobService(d *sqlx.DB, p string) *DBJobService {
	return &DBJobService{
		db:      d,
		pattern: p,
	}
}

// DBJobService ...
type DBJobService struct {
	db      *sqlx.DB
	pattern string
}

// GetJobs ...
// Fetch latest job data from database.
func (s *DBJobService) GetJobs() ([]*Job, error) {
	jobs := make([]*Job, 0)
	var err error

	err = s.db.Select(&jobs, jobStateQuery, s.pattern)
	// NO TIMESTAMPS IN RESULT SET
	// CLONE TIMES TO LOCAL TZ
	for _, job := range jobs {
		if job.Run.Valid {
			job.Run.Time = utils.Localize(job.Run.Time)
		}

		if job.NextRun.Valid {
			job.NextRun.Time = utils.Localize(job.NextRun.Time)
		}
	}

	return jobs, err
}
