
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

		var DEBUG = process.argv[4] ? function(s){ log(s); } : function(){};

		var PORT = toInt(process.argv[2]) || 80;
		var SITE = process.argv[3] || "site";

		var SSL_KEY = null;
		var SSL_CERT = null;

		try {

			// try to load cert & key ...
			SSL_KEY = fs.readFileSync("ssl/privkey.pem", 'utf8');
			SSL_CERT = fs.readFileSync("ssl/fullchain.pem", 'utf8');
			DEBUG("SSL cert and key loaded");

			// Suceses - so let's be secure!
			server = https.createServer({key:SSL_KEY, cert:SSL_CERT}, xapp);

			// set up a server on port 80 that simply redirects everything to 443
			var rapp = express();
			rapp.use("/", function(req, res, next) {
				var u = 'https://' + req.hostname + req.originalUrl;
				DEBUG("redirecting to "+u);
				res.redirect(u);
			});
			rapp.listen(PORT, function() {
				DEBUG("HTTP redirector listening on "+PORT);
			});

			PORT = 443;

		}
		catch(e) {

			server = http.createServer(xapp);

		}


		// setup for websocket connections
		require('express-ws')(xapp, server);
		xapp.ws('/', function(ws, req) {
			// new websocket connection from browser
			DEBUG("WS CONNECT");

			// create a connection-specific object that can hold session id's or whatever
			// this gets passed into ws_api() along with each incoming message.

			ws.on('message', function(o) {
				// receive JSON encoded jacket and payload from browser
				DEBUG("WS <-- "+o.abbr(500))
				if(global["ws_api"]) {		// see if we there is a ws_api() function to call
					var jacket = j2o(o);	// decode JSON back into an object
					if(jacket) {
						ws_api(jacket.payload, function(r) {		// call the function with payload
							// send response back to browser
							jacket.payload = r;		// replace payload with response (id is same)
							r = o2j(jacket);			// JSON encode the jacket and contents
							DEBUG("WS --> "+r.abbr(500))
							if(ws.readyState == ws.OPEN) {   // XXX
								ws.send(r);				// send it back to browser
							}
						});
					}
					else {
						DEBUG("WS Unparseable or null message from browser: "+o2j(o));
					}
				}
			});
			ws.on("close", function() {
				// lost connection with browser
				DEBUG("WS DISCONNECT")
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
		xapp.use("/", express.static(SITE));

		xapp.use(bodyParser.json({limit:"50mb"}));
		xapp.use(bodyParser.urlencoded({limit:"50mb", extended:true}));

		// REST interface to API
		xapp.post("/API", upload.array(), function(req, res, next) {
			DEBUG("POST <-- "+o2j(req.body).abbr(500));
			if(global["ws_api"]) {
				ws_api(req.body.payload, function(r) {
					DEBUG("POST --> "+o2j(req.body).abbr(500));
					res.json(r);
				});
			}
		});


		// and off we go!
		server.listen(PORT, function() {
			DEBUG("Listening on "+PORT+", serving from "+SITE);
		});


		// XXX make xapp into an event emitter so that
		// all events can be listened for, and no log() calls needed.
		// Is it an event emitter already?
		module.exports = xapp;

	}
	else {

		// ---------------------------------------------------
		// browser
		// ---------------------------------------------------

		var seq = 0;

		var TimeHash = function(in_opts) {

			var opts = {
				scan_interval: 60 * 1000,
			}
			for(var k in in_opts) { if(in_opts[k]) opts[k] = in_opts[k] }

			var mstime = function() { return new Date().getTime() }


			var self = this;
			var timer = null
			var wraps = {}		// stores the msgs (inside a wrapper for tracking/expiration)
			var num = 0			// # msgs waiting

			// Remove and return a msg from the list given its id
			var remove = self.remove = function(id) {
				var p = null
				var w = wraps[id]
				if(w) {
					p = w.payload
					delete wraps[id]
					num -= 1
					if(num == 0) {
						clearInterval(timer)
						timer = null
					}
				}
				return p
			}


			// Put a msg into the list
			// ttl is in milliseconds and should not be less than 10,000 (default is 60,000 if not provided)
			var insert = self.insert = function(p, id, ttl) {
				var old = wraps[id];
				var w = {
					expire: mstime() + (ttl || (60 * 1000)),
					payload: p,
				}
				wraps[id] = w;
				if(old === undefined) {
					num += 1
				}
				if(num == 1) {
					timer = setInterval(function() {
						var t = mstime()
						for(var k in wraps) {
							var w = wraps[k];
							if(t >= w.expire) {
								// it's expired ... toss it.
								remove(k);
							}
						}
					}, opts.scan_interval);
				}
				return old;
			}

		};
		var th = new TimeHash();

		var connect = function() {
			var pr = document.location.protocol == "https:" ? "wss:" : "ws:";
			var sock = new WebSocket(pr+"//"+window.location.host+"/");
			sock.addEventListener('close', function() {
				if(typeof WS_disconnect === "function") {
					WS_disconnect();
				}
				setTimeout(connect, 2 * 1000);		// attempt to reconnect
			});
			var send = function(data, cb, err_cb) {

				// wrap the payload in a jacket that includes a unique id number
				var id = seq += 1;
				var jacket = {
					id: id,
					payload: data,
				};
				var j = o2j(jacket);		// JSON encode the jacket and contents

				if(j.length > 4000) {
					// it's kinda big ... use REST rather than websocket
					$.ajax( "/API", {
						method: "POST",
						contentType: "application/json",
						data: j,
						success: function(o, s, jx) {
							cb(o, s, jx);	// response, status, jqXHR
						},
						error: function(jx, e, ex) {
							if(err_cb) {
								err_cb(e, ex);	// err, stack (toss jqXHR)
							}
						},
					});
				}
				else {
					// use websocket
					var rcbs = { cb:cb, err_cb:err_cb };	// make obj to hold reply callbacks
					th.insert(rcbs, id, 10*1000);			// store obj in TimeHash with unique id for limited time
					sock.send(j);	// send JSON encoded jacket and contents to server via websocket
				}
			};
			sock.addEventListener('error', function(err) {
				if(typeof WS_error === "function") {
					WS_error(err);
				}
			});
			sock.addEventListener('open', function() {
				if(typeof WS_connect === "function") {
					WS_connect(send);
				}
			})
			sock.addEventListener('message', function(msg) {
				// receive JSON encoded jacket from server
				var jacket = j2o(msg.data);		// decode jacket back to object
				if(jacket) {
					if(jacket.payload === undefined) {
						jacket.payload = null;
					}
					// look for obj with jacket.id from TimeHash containing reply callbacks 
					var rcbs = jacket.id ? th.remove(jacket.id) : null;
					if(rcbs) {
						// found; this is a reply to a browser-sent message that was sent recently with jacket.id
						// pass the response payload to the callback.
						rcbs.cb(jacket.payload, null, null);
					}
					else {
						// this msg originated at server; it's not a reply to a msg sent from browser
						if(typeof WS_message === "function") {
							WS_message(jacket.payload);
							// Note: I currently don't support sending replies to server-originated msgs.
						}
					}
				} 
				else {
					// unparseable or null message
					if(typeof WS_error === "function") {
						WS_error("Unparseable or null message from server: "+o2j(msg.data));
					}
				}
			});
		};

		window.webserver = {
			connect: connect,
		};


	}

})();
