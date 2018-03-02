# Docket

*Docket* is a job monitoring and schedule reviewer application for SQL Agent.  It was born from the simple question, "can we reboot the SSIS server?"

It:
* Displays recent job runs and color codes their outcome.
* Displays upcoming job schedule.
* Displays information about a specific job run.

In the future it will:
* Be able to monitor multiple servers at once.

To run:
docket.exe -db _server_ -r _optional sql regex_

* db = database server to monitor
* r = optional sql regex (e.g. SSIS-%) (default. %)

Dependencies:
* go get github.com/BiffJutsu/go-bindata -- was github.com/jteeuwen/go-bindata but it disappeared

To build:
* bump version
* python build.py
* git add .
* git commit
* python deploy.py

# TODO
* Frontend comments and refactoring.
* Add support for multiple servers.
* Add serverside outcome caching capabilities? If so, should client also cache or just rely on server cache?

Server => Go | Frontend => Typescript + React | Build => Python
