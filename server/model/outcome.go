package model

import (
	"time"

	"github.com/BiffJutsu/docket/server/utils"

	"github.com/guregu/null"
	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"
)

// OutcomeQuery ...
// Structures data required to get an Outcome
type OutcomeQuery struct {
	JobID        string
	StartRunDate int // e.g. 20170724
	StartRunTime int // e.g. 91500 or 100500
}

// Outcome ...
// Record from:
// exec dbo.sp_help_jobhistory @job_id = <job_id>, @start_run_date = <start_dt>, @start_run_time = <start_tm>, @oldest_first = 1, @mode = 'FULL';
type Outcome struct {
	InstanceID       int         `db:"instance_id"`
	JobID            []byte      `db:"job_id"`
	JobName          string      `db:"job_name"`
	StepID           int         `db:"step_id"`
	StepName         string      `db:"step_name"`
	SQLMessageID     int         `db:"sql_message_id"`
	SQLSeverity      int         `db:"sql_severity"`
	Message          string      `db:"message"`
	RunStatus        string      `db:"run_status"`
	RunDate          time.Time   `db:"run_date"`
	RunDuration      int         `db:"run_duration"`
	OperatorEmailed  null.String `db:"operator_emailed"`
	OperatorNetsent  null.String `db:"operator_netsent"`
	OperatorPaged    null.String `db:"operator_paged"`
	RetriesAttempted int         `db:"retries_attempted"`
	Server           string      `db:"server"`
}

// NewOutcomeService ...
func NewOutcomeService(db *sqlx.DB, p string) *DBOutcomeService {
	return &DBOutcomeService{db, p}
}

// DBOutcomeService ...
type DBOutcomeService struct {
	db      *sqlx.DB
	pattern string
}

// GetOutcome ...
// Fetch job run outcome details
func (o *DBOutcomeService) GetOutcome(q OutcomeQuery) ([]*Outcome, error) {
	records := make([]*Outcome, 0)

	err := o.db.Select(&records, jobOutcomeQuery, q.JobID, q.StartRunDate, q.StartRunTime)
	if err != nil {
		return nil, err
	}
	if len(records) == 0 {
		return nil, errors.Errorf("no outcomes found for: %v", &q)
	}

	for _, oc := range records {
		oc.RunDate = utils.Localize(oc.RunDate)
	}

	return records, nil
}

// AllSince ...
// Fetch job outcomes since given date
func (o *DBOutcomeService) AllSince(dt int) ([]*Outcome, error) {
	records := make([]*Outcome, 0)

	err := o.db.Select(&records, runsSinceQuery, o.pattern, dt)
	if err != nil {
		return nil, err
	}

	for _, oc := range records {
		oc.RunDate = utils.Localize(oc.RunDate)
	}

	return records, nil
}
