package utils

import "time"

// Localize ...
// Deep copies t to Local TZ.
func Localize(t time.Time) time.Time {
	return time.Date(
		t.Year(),
		t.Month(),
		t.Day(),
		t.Hour(),
		t.Minute(),
		t.Second(),
		t.Nanosecond(),
		time.Local)
}
