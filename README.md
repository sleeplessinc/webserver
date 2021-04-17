
# WebServer

Copyright 2020 Sleepless Software Inc.  All Rights Reserved.

A simple web server with cold reloading

## Install

	npm i -g webserver


## Usage 

	webserver create myapp

	webserver run 3000 myapp

or to cold reload:

	webserver run 3000 myapp true


Legacy Usage

You can still use webserver to simply serve up
static files this way:

	webserver port dir


