package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/BiffJutsu/docket/server/cache"
	"github.com/BiffJutsu/docket/server/model"
	"github.com/gorilla/mux"
)

// Outcomer ...
type Outcomer interface {
	GetOutcome(q model.OutcomeQuery) ([]*model.Outcome, error)
	AllSince(dt int) ([]*model.Outcome, error)
}

// NewJobController ...
// Make a new job controller
func NewJobController(c cache.JobCacher, o Outcomer) *JobController {
	return &JobController{c, o}
}

// JobController ...
// /jobs endpoint controller.
type JobController struct {
	c        cache.JobCacher
	outcomer Outcomer
}

// All ...
// /jobs endpoint, returns entire job cache as JSON
func (j *JobController) All(w http.ResponseWriter, r *http.Request) {
	jobs, expires := j.c.All()
	payload := CachePayload{
		Expires: expires,
		Jobs:    jobs,
	}

	data, err := json.Marshal(&payload)
	if err != nil {
		failWith(w, http.StatusInternalServerError, "could not serialize jobs", err)
		return
	}
	apiHeaders(w.Header())
	w.Write(data)
}

// Since ...
// /jobs?since=20170728
func (j *JobController) Since(w http.ResponseWriter, r *http.Request) {
	since, err := strconv.Atoi(r.URL.Query().Get("since"))
	if err != nil {
		failWith(w, http.StatusBadRequest, "since param malformed", err)
		return
	}

	outcomes, err := j.outcomer.AllSince(since)
	if err != nil {
		failWith(w, http.StatusInternalServerError, fmt.Sprintf("could not get jobs since %v", since), err)
		return
	}

	payload := NewOutcomePayload(outcomes)
	data, err := json.Marshal(&payload)
	if err != nil {
		failWith(w, http.StatusInternalServerError, "could not serialize outcomes", err)
		return
	}
	apiHeaders(w.Header())
	w.Write(data)
}

// Detail ...
// /job/:id?start_dt&start_tm
func (j *JobController) Detail(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	q := r.URL.Query()
	dt, derr := strconv.Atoi(q.Get("start_dt"))
	tm, terr := strconv.Atoi(q.Get("start_tm"))
	if derr != nil {
		failWith(w, http.StatusBadRequest, "start_dt param malformed", derr)
		return
	}
	if terr != nil {
		failWith(w, http.StatusBadRequest, "start_tm param malformed", terr)
		return
	}

	oq := model.OutcomeQuery{
		JobID:        id,
		StartRunDate: dt,
		StartRunTime: tm,
	}

	outcomes, err := j.outcomer.GetOutcome(oq)
	if err != nil {
		failWith(w, http.StatusInternalServerError, fmt.Sprintf("could not get job outcome for %v", oq), err)
		return
	}

	payload := NewOutcomePayload(outcomes)
	data, err := json.Marshal(&payload)
	if err != nil {
		failWith(w, http.StatusInternalServerError, "could not serialize outcome", err)
		return
	}
	apiHeaders(w.Header())
	w.Write(data)
}
