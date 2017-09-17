
// Copyright 2017 Sleepless Software Inc.  All Rights Reserved 
"use strict";


const fs = require("fs");
const http = require("http");
const https = require("https");

const parseUrl = require("parseurl");
const send = require("send");

const sleepless = require("sleepless");


function r404(rsp) {
	rsp.StatusCode = 404;
	rsp.end("404: NOT FOUND\n");
}

function request(req, rsp) {

	log(req.method + " " + req.url);

	var pu = parseUrl(req);
	var path = pu.pathname;

	function error(err) {
		// send wasn't able to deliver a static file for some reason

		// try to deal with dynamic content.
		var mod_path = path + "/index.js";
		fs.stat(mod_path, (err, st) => {
			if(err) {
				log("stat error: "+err);
				r404(rsp);
			}
			else
			if(!st.isFile()) {
				log("not a file: "+mod_path);
				r404(rsp);
			}
			else {
				try {
					var mod = require(mod_path);
					log("calling module: "+mod_path);
					mod(req, rsp);
				}
				catch(e) {
					log("can't load module: "+e);
					r404(rsp);
				}
			}
		});
	};

	send(req, path, { root: "site" }).on("error", error).pipe(rsp);

};


var server = http.createServer();

server.on("request", request);

server.listen(12345, () => { log("listening"); });




