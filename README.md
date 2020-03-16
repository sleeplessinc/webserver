
# WebServer

Copyright 2020 Sleepless Software Inc.  All Rights Reserved.


# Node.js Module

## WARNING

THIS IS A SOFTWARE DEVELOPMENT TOOL AND NOT INTENDED FOR REAL WEBSITES ON THE INTERNET.

This is a node module for development purposes or very light-duty, low-security webservice.

It lets you create a webserver with HTTPS and websockets with a minimal amount of difficulty.

	npm install webserver

	node example.js

See example.js for details on usage.

	
# Development Shell Script

## WARNING

THIS IS A SOFTWARE DEVELOPMENT TOOL AND NOT INTENDED FOR REAL WEBSITES ON THE INTERNET.

## Deprecated

This is obsolete.

It's just a Node script set up to be executed in a shell environment and provides
a plain, static file server.  Handy though.

	npm install -g webserver

	webserver 					# prints usage
	webserver 12345				# serves from current directory on port 12345
	webserver 12345 my_site		# serves from directory "./my_site"  on port 12345


