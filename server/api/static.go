package api

import (
	"fmt"
	"log"
	"net/http"

	"github.com/BiffJutsu/docket/server/assets"
	"github.com/gorilla/mux"
)

// Index ...
// / endpoint, serves up the HTML page
func Index(w http.ResponseWriter, r *http.Request) {
	dat, err := assets.Asset("server/static/index.html")
	if err != nil {
		http.Error(w, "index.html not found", http.StatusNotFound)
		return
	}
	w.Write(dat)
}

// CSS ...
// /static/{file}.css endpoint
func CSS(w http.ResponseWriter, r *http.Request) {
	file := mux.Vars(r)["file"]
	dat, err := assets.Asset(fmt.Sprintf("server/static/%s", file))
	if err != nil {
		msg := fmt.Sprintf("could not find css %s: %s", file, err.Error())
		log.Println(msg)
		http.Error(w, msg, http.StatusNotFound)
		return
	}
	w.Header().Add("Content-Type", "text/css")
	w.Write(dat)
}

// JS ...
// /static/{file}.js endpoint
func JS(w http.ResponseWriter, r *http.Request) {
	file := mux.Vars(r)["file"]
	dat, err := assets.Asset(fmt.Sprintf("server/static/%s", file))
	if err != nil {
		msg := fmt.Sprintf("could not find js %s: %s", file, err.Error())
		log.Println(msg)
		http.Error(w, msg, http.StatusNotFound)
		return
	}
	w.Header().Add("Content-Type", "application/javascript")
	w.Write(dat)
}
