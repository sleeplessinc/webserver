
// Copyright 2017 Sleepless Software Inc.  All Rights Reserved 

var fs = require("fs");
var http = require("http");
var https = require("https");

var express = require("express");
var bodyParser = require("body-parser");
var multer = require("multer");
var upload = multer();

var sleepless = require("sleepless");

// ----------------------------------------------------

var seq = function() {
	global.SEQ_NUM = toInt(global.SEQ_NUM) + 1;
	return global.SEQ_NUM;
};

//	-	-	-	-	-	-	-	-	-	-	-	-	-	-

var xapp = express();
var server = null;

var PORT = toInt(process.argv[2]) || 80;

var SSL_KEY = null;
var SSL_CERT = null;
try {

	// try to load a cert & key ...
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

xapp.use(function (req, res, next) {
	log(req.method+" "+req.url);
	return next();
});

// static files
xapp.use("/", express.static('site'));

xapp.use(bodyParser.json());
xapp.use(bodyParser.urlencoded({extended:true}));


xapp.post("/API", upload.array(), function(req, res, next) {
	log("API POST");
	msg(req.body, function(r) {
		res.json(r);
	});
});


// and off we go!
server.listen(PORT, function() {
	log("Listening on "+PORT);
});


//	-	-	-	-	-	-	-	-	-	-	-	-	-	-

var ws_connect = function(ws, req) {

	log("ws connect "+o2j(ws));

	ws.on('message', function(o) {
		log("<--- "+0+" : "+o)

		msg(j2o(o), function(r) {
			r = o2j(r);
			log("---> "+0+" : "+r)
			ws.send(r);
		});

	}); 

	ws.on("close", function() {
		log("ws disconnect")
	});

}

//	-	-	-	-	-	-	-	-	-	-	-	-	-	-

msg = function(o, cb) {
	o.foo += 1;
	cb(o);
};



