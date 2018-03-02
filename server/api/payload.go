package api

import (
	"time"

	"github.com/BiffJutsu/docket/server/model"
)

// CachePayload ...
// Cache DTO
type CachePayload struct {
	Expires time.Time    `json:"expires"`
	Jobs    []*model.Job `json:"jobs"`
}

// OutcomePayload ...
// Job outcome payload
type OutcomePayload struct {
	JobID    string    `json:"job_id"`
	JobName  string    `json:"name"`
	StepID   int       `json:"step_id"`
	Name     string    `json:"step_name"`
	Message  string    `json:"message"`
	RunDate  time.Time `json:"run_date"`
	Duration int       `json:"run_duration"`
	Result   string    `json:"run_result"`
}

// NewOutcomePayload ...
func NewOutcomePayload(outcomes []*model.Outcome) []*OutcomePayload {
	var payload []*OutcomePayload
	for _, o := range outcomes {
		payload = append(payload, &OutcomePayload{
			JobID:    string(o.JobID),
			JobName:  o.JobName,
			StepID:   o.StepID,
			Name:     o.StepName,
			Message:  o.Message,
			RunDate:  o.RunDate,
			Duration: o.RunDuration,
			Result:   o.RunStatus,
		})
	}
	return payload
}
