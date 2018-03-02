package cache

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/BiffJutsu/docket/server/model"
	"github.com/pkg/errors"
)

// JobCacher ...
// Implements server-side control over database access.
type JobCacher interface {
	All() ([]*model.Job, time.Time)
	Get(guid string) *model.Job
	PauseUntilAtLeast(t time.Time)
	Expires() time.Time
}

// JobService ...
// Implements whatever it takes to get new jobs.
type JobService interface {
	GetJobs() ([]*model.Job, error)
}

// JobMap ...
// Map of guids to job pointers.
type JobMap map[string]*model.Job

// New ...
// Makes a new cache.
func New(c context.Context, db JobService) (JobCacher, error) {
	ctx, cf := context.WithCancel(context.Background()) // initial maintenance context
	j := &jobCache{
		ctx:     c,
		m:       new(sync.RWMutex),
		db:      db,
		store:   make(JobMap),
		pauseFn: cf,
		expires: time.Now().Add(5 * time.Minute),
	}
	err := j.refreshStore()
	if err != nil {
		return nil, errors.Wrap(err, "could not fetch state from database")
	}
	go j.maintain(ctx)
	return j, nil
}

// jobCache ...
// Database backed job cache.
type jobCache struct {
	ctx     context.Context
	m       *sync.RWMutex
	db      JobService
	store   JobMap
	pauseFn context.CancelFunc
	expires time.Time
}

// All...
// Dumps all jobs from the cache.
func (j *jobCache) All() ([]*model.Job, time.Time) {
	j.m.RLock()
	defer j.m.RUnlock()
	jobs := make([]*model.Job, 0)

	for _, job := range j.store {
		jobs = append(jobs, job)
	}
	return jobs, j.expires
}

// Get...
// Get a specific job.
func (j *jobCache) Get(guid string) *model.Job {
	j.m.RLock()
	defer j.m.RUnlock()

	job, ok := j.store[guid]
	if ok {
		return job
	}
	return nil
}

// PauseUntilAtLeast ...
// Used to control background cache maintainenance goroutines.
func (j *jobCache) PauseUntilAtLeast(t time.Time) {
	j.pauseFn() //cancel the context
	j.expires = t
	go func() {
		dur := t.Sub(time.Now())
		for {
			select {
			case <-time.After(dur):
				err := j.refreshStore()
				if err == nil {
					ctx, cf := context.WithCancel(context.Background())
					j.pauseFn = cf
					go j.maintain(ctx)
					return
				}
			case <-j.ctx.Done():
				return
			}
		}
	}()
}

func (j *jobCache) calculateExpiration() time.Time {
	j.m.RLock()
	defer j.m.RUnlock()
	now := time.Now()

	var next *model.Job
	var nextCheck time.Time
	for _, job := range j.store {
		// first time through, pick first acceptable
		check := job.NextCheck()
		if next == nil && check.After(now) {
			next = job
			nextCheck = check
			continue
		}
		// subsequent iteration, refine pick
		if check.After(now) && check.Before(nextCheck) {
			next = job
			nextCheck = check
		}
	}

	if nextCheck.Before(now) {
		return now.Add(15 * time.Minute)
	}
	return nextCheck
}

// Expires ...
// Exposes the cache expiration.
func (j *jobCache) Expires() time.Time {
	j.m.RLock()
	defer j.m.RUnlock()
	return j.expires
}

func (j *jobCache) refreshStore() error {
	log.Println("refreshing cache from database")
	jobs, err := j.db.GetJobs()
	if err != nil {
		log.Printf("could not refresh from database, %s", err.Error())
		return err
	}

	j.m.Lock()
	defer j.m.Unlock()

	store := make(JobMap)
	for _, job := range jobs {
		store[job.ID] = job
	}
	j.store = store

	return nil
}

func (j *jobCache) maintain(ctx context.Context) {
	for {
		next := j.calculateExpiration()
		j.expires = next
		log.Printf("next refresh at: %v", next)

		select {
		case <-time.After(time.Until(next)):
			err := j.refreshStore()
			if err != nil {
				<-time.After(15 * time.Minute) // lol wtf
				continue
			}
		case <-ctx.Done():
			break
		}
	}
}
