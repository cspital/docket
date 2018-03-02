package api

import (
	"log"
	"net/http"
)

func apiHeaders(h http.Header) {
	h.Add("Content-Type", "application/json")
}

func failWith(w http.ResponseWriter, code int, msg string, err error) {
	log.Printf(msg+": %s", err.Error())
	http.Error(w, msg, code)
}
