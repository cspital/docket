package api

import (
	"log"
	"net/http"
	"net/http/httputil"
)

// LogRequest ...
// Request logging middleware.
func LogRequest(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		dump, _ := httputil.DumpRequest(r, true)
		log.Print(string(dump))
		next(w, r)
	}
}
