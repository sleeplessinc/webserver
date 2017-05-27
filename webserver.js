
// Copyright 2017 Sleepless Software Inc.  All Rights Reserved 

if(typeof process === "object") {

	// ---------------------------------------------------
	// node.js
	// ---------------------------------------------------

	var fs = require("fs");
	var http = require("http");
	var https = require("https");
	var insp = function(o) { return require("util").inspect(o, false, 2) }

	var express = require("express");
	var bodyParser = require("body-parser");
	var multer = require("multer");
	var upload = multer();

	var sleepless = require("sleepless");

	/*var seq = function() {
		global.SEQ_NUM = toInt(global.SEQ_NUM) + 1;
		return global.SEQ_NUM;
	};*/


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
			log("redirecting to "+u);
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
		return ws_connect(ws, req)
	});

	// simple logger
	xapp.use(function (req, res, next) {
		log(req.method+" "+req.url);
		return next();
	});

	// static files
	xapp.use("/", express.static('site'));

	xapp.use(bodyParser.json());
	xapp.use(bodyParser.urlencoded({extended:true}));


	// REST interface to API
	xapp.post("/API", upload.array(), function(req, res, next) {
		log("POST <-- "+o2j(req.body));
		msg(req.body, function(r) {
			log("POST --> "+o2j(req.body));
			res.json(r);
		});
	});


	// and off we go!
	server.listen(PORT, function() {
		log("Listening on "+PORT);
	});


	var ws_connect = function(ws, req) {

		log("ws connect"); //+insp(ws.req));

		ws.on('message', function(o) {
			log("WS <-- "+o)

			msg(j2o(o), function(r) {
				r = o2j(r);
				log("WS --> "+r)
				ws.send(r);
			});

		}); 

		ws.on("close", function() {
			log("ws disconnect")
		});

	}


	// incoming messages (REST or WS)
	msg = function(o, cb) {
		o.foo += 1;
		cb(o);
	};


}
else {

	// ---------------------------------------------------
	// browser
	// ---------------------------------------------------

	var WS = function(path, onmessage, onclose, onopen, onerror) {
		var self = this;
		var connect = function() {
			var pr = document.location.protocol == "https:" ? "wss:" : "ws:";
			
			var s = new WebSocket(pr+"//"+window.location.host+path);
			s.addEventListener('close', function (err) {
				onclose(err);
				setTimeout(connect, 2 * 1000);
			});
			self.send = function(data) {
				return s.send(o2j(data))
			};
			s.addEventListener('error', onerror);
			s.addEventListener('open', onopen)
			s.addEventListener('message', function(msg) {
				var data = j2o(msg.data)
				onmessage(data, self)
			});
		}
		connect();
	};

	var send = function(o, cb) {
		var j = o2j(o);
		if(j === null) {
			// JSON.stringify failed - too big for websockets? send via REST
			$.post( "/API", o, cb, "json" )
			.fail(function(e) {
				log( "xxx post error " + e.statusText );
			})
		}
		else {
			// send via websocket
			ws.send(j, cb);
		}
	};

	var ws = new WS("/", function(o) {
		if(typeof WS_message === "function") { WS_message(o); }
	},
	function() {
		if(typeof WS_disconnect === "function") { WS_disconnect(); }
	},
	function() {
		if(typeof WS_connect === "function") { WS_connect(send); }
	},
	function(e) {
		if(typeof WS_error === "function") { WS_error(e); }
	});

}


