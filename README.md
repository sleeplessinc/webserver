
# WebServer

Copyright 2020 Sleepless Software Inc.  All Rights Reserved.

A simple web server with auto reloading

## Install

	npm i -g webserver


## Usage 

Create an app dir:

	webserver create path/to/myapp

Run the app:

	webserver run 3000 path/to/myapp

To auto reload when files change (your app has to support this)

	webserver run 3000 path/to/myapp true


## Legacy Usage

You can still use to simply serve up static files this way:

	webserver port dir


