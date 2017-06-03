
// Copyright 2017 Sleepless Software Inc.  All Rights Reserved 

(function() {

	if(typeof process === "object") {

		// ---------------------------------------------------
		// node.js
		// ---------------------------------------------------

		var fs = require("fs");
		var http = require("http");
		var https = require("https");

		var express = require("express");
		var bodyParser = require("body-parser");
		var multer = require("multer");
		var upload = multer();

		var sleepless = require("sleepless");


		var xapp = express();
		var server = null;

		var PORT = toInt(process.argv[2]) || 80;

		var SSL_KEY = null;
		var SSL_CERT = null;

		try {

			// try to load cert & key ...
			SSL_KEY = fs.readFileSync("ssl/privkey.pem", 'utf8');
			SSL_CERT = fs.readFileSync("ssl/fullchain.pem", 'utf8');
			log("SSL cert and key loaded");

			// Suceses - so let's be secure!
			server = https.createServer({key:SSL_KEY, cert:SSL_CERT}, xapp);

			// set up a server on port 80 that simply redirects everything to 443
			var rapp = express();
			rapp.use("/", function(req, res, next) {
				var u = 'https://' + req.hostname + req.originalUrl;
				//log("redirecting to "+u);
				res.redirect(u);
			});
			rapp.listen(PORT, function() {
				log("HTTP redirector listening on "+PORT);
			});

			PORT = 443;

		}
		catch(e) {

			server = http.createServer(xapp);

		}


		// setup for websocket connections
		require('express-ws')(xapp, server);
		xapp.ws('/', function(ws, req) {
			log("WS CONNECT");
			var client = {};
			ws.on('message', function(o) {
				log("WS <-- "+o)
				if(global["ws_api"]) {
					ws_api(j2o(o), function(r) {
						r = o2j(r);
						log("WS --> "+r)
						ws.send(r);
					}, client);
				}
			});
			ws.on("close", function() {
				log("WS DISCONNECT")
			});
		});

		// XXX dumb logger
		/*
		xapp.use(function (req, res, next) {
			log(req.method+" "+req.url);
			return next();
		});
		*/

		// static files
		xapp.use("/", express.static('site'));

		xapp.use(bodyParser.json());
		xapp.use(bodyParser.urlencoded({extended:true}));

		// REST interface to API
		xapp.post("/API", upload.array(), function(req, res, next) {
			log("POST <-- "+o2j(req.body));
			if(global["ws_api"]) {
				ws_api(req.body, function(r) {
					log("POST --> "+o2j(req.body));
					res.json(r);
				});
			}
		});


		// and off we go!
		server.listen(PORT, function() {
			log("Listening on "+PORT);
		});


		module.exports = xapp;

	}
	else {

		// ---------------------------------------------------
		// browser
		// ---------------------------------------------------

		var connect = function() {
			var pr = document.location.protocol == "https:" ? "wss:" : "ws:";
			var sock = new WebSocket(pr+"//"+window.location.host+"/");
			sock.addEventListener('close', function() {
				if(typeof WS_disconnect === "function") {
					WS_disconnect();
				}
				setTimeout(connect, 2 * 1000);		// attempt to reconnect
			});
			send = function(data, cb, err_cb) {
				var j = o2j(data);
				if(j.length > 50000) {
					// kinda big ... use REST
					$.ajax( "/API", {
						method: "POST",
						contentType: "application/json",
						data: j,
						success: function(o, s, jx) { cb(o, s, jx); },	// response, status, jqXHR
						error: function(jx, e, ex) { err_cb(e, ex); },	// err, stack (toss jqXHR)
					});
				}
				else {
					// use websocket
					sock.send(o2j(data))
				}
			};
			sock.addEventListener('error', function(err) {
				if(typeof WS_error === "function") {
					WS_error(e);
				}
			});
			sock.addEventListener('open', function() {
				if(typeof WS_connect === "function") {
					WS_connect(send);
				}
			})
			sock.addEventListener('message', function(msg) {
				var data = j2o(msg.data)
				if(typeof WS_message === "function") {
					WS_message(data);
				}
			});
		}
		connect();

	}

})();
