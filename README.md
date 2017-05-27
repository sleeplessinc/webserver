

# WebServer

	npm install webserver

## Usage

Server side:

	webserver = require("./webserver.js");

	// webserver is an express app
	// webserver.use("/foo", require("express").static('foo'));

	// receives incoming messages from client (REST or WS)
	ws_api = function(o, cb) {
		...
	}

Client side uses the same webserver.js file:

	<script src="jquery.js"></script>
	<script src="webserver.js"></script>
	<script>

		WS_disconnect = function() { console.log("WS_disconnect "); };

		WS_connect = function(send) {
			console.log("WS_connect ");
			send({ msg: "hello" }, WS_message, function(err) {
				console.log("ERROR "+err);
			});
		};

		WS_message = function(o) {
			console.log("WS_message "+(typeof o)+" ... " +o2j(o));
		};

	</script>

# Legacy

	npm install paperboy
	npm install webserver
	node node_modules/webserver/webserver.js

Delivers files
with the HTTP protocol
from the current working directory
on port #8003
using Felix's paperboy module.

	http://localhost:8003/some_file_in_current_working_directory.txt

## WARNING

THIS IS A SOFTWARE DEVELOPMENT TOOL AND NOT INTENDED FOR REAL WEBSITES ON THE INTERNET.




