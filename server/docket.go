package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"

	"flag"

	"github.com/BiffJutsu/docket/server/api"
	"github.com/BiffJutsu/docket/server/cache"
	"github.com/BiffJutsu/docket/server/model"

	"net/http"

	_ "github.com/denisenkom/go-mssqldb" // I be the driver
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/jmoiron/sqlx"
)

const port = ":5000"
const dbstring = "server=%s;database=msdb;Trusted_Connection=True;Application Name=docket"

func setupApplicationContext() (context.Context, context.CancelFunc) {
	cint := make(chan os.Signal, 1)
	signal.Notify(cint, os.Interrupt)
	ctx, cancel := context.WithCancel(context.Background())
	go func() {
		<-cint
		log.Println("SIGINT received! Shutting down...")
		cancel()
		os.Exit(2)
	}()
	return ctx, cancel
}

func makeRouter(job *api.JobController) http.Handler {
	r := mux.NewRouter()

	// index
	r.HandleFunc("/", api.LogRequest(api.Index)).Methods("GET")

	// jobs (bulk)
	r.Path("/jobs").
		Queries("since", "{since:[0-9]+}").
		HandlerFunc(api.LogRequest(job.Since)).
		Methods("GET", "OPTIONS")
	r.HandleFunc("/jobs", api.LogRequest(job.All)).Methods("GET", "OPTIONS")

	// job
	r.Path("/job/{id}").
		Queries("start_dt", "{start_dt:[0-9]+}", "start_tm", "{start_tm:[0-9]+}").
		HandlerFunc(api.LogRequest(job.Detail)).
		Methods("GET", "OPTIONS")

	// static
	r.HandleFunc("/static/css/{file:(?:main.)+[a-z0-9]+(?:.css)}", api.CSS).Methods("GET")
	r.HandleFunc("/static/js/{file:(?:main.)+[a-z0-9]+(?:.js)}", api.JS).Methods("GET")

	origins := handlers.AllowedOrigins([]string{"*"})
	methods := handlers.AllowedMethods([]string{"GET", "OPTIONS"})
	headers := handlers.AllowedHeaders([]string{"Content-Type, Accept"})

	return handlers.CORS(methods, origins, headers)(r)
}

func main() {
	// setup logging
	log.SetOutput(os.Stdout)

	// args
	dbserver := flag.String("db", "", "database server to watch")
	pattern := flag.String("r", "%", "SQL Agent job name regex (e.g SSIS-%)")
	flag.Parse()

	if *dbserver == "" {
		log.Println("db server argument is required...")
		os.Exit(1)
	}

	// setup graceful shutdown
	ctx, cancel := setupApplicationContext()

	// spin it up
	log.Println("Docket is loading...")
	db := sqlx.MustConnect("mssql", fmt.Sprintf(dbstring, *dbserver))

	cash, err := cache.New(ctx, model.NewJobService(db, *pattern))
	if err != nil {
		log.Fatalf("could not establish a cache, %s", err.Error())
		cancel()
		os.Exit(1)
	}
	job := api.NewJobController(cash, model.NewOutcomeService(db, *pattern))

	// route and roll
	r := makeRouter(job)
	log.Println("Docket is up...")
	log.Fatal(http.ListenAndServe(port, r))
}
