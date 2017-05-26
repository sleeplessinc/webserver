
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

var clients = {};

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
xapp.user(bodyParser.urlencoded({extended:true}));

xapp.post("/API", upload.array(), function(req, res, next) {
	log("API POST");
	log(req.body);
	res.json(req.body);
});


// and off we go!
server.listen(PORT, function() {
	log("Listening on "+PORT);
});


//	-	-	-	-	-	-	-	-	-	-	-	-	-	-

var ws_connect = function(ws, req) {

	var id = "U_"+seq();
	
	var seq = 0;
	var new_msgid = function() {
		seq += 1;
		return "M_" + time() + "_" + seq;
	}


	var client = {
		id: id,
		conn: ws,
		send: function(o, replyid) {
			var jacket = { 
				msgid: new_msgid(),
				replyid: replyid,
				payload: o,
			}
			var json = o2j(jacket)
			//log("---> TO "+id+" : "+json)
			try {
				ws.send(json)
			} catch(e) {
				log("** ERR ** "+e);
			}
		},
	};

	clients[id] = client;	// add the client to the clients hash

	log(id+" connected");

	ws.on('message', function(json) {
		// incoming websocket message - arrives in json form
		//log("<--- FROM "+id+" : "+json)

		try {
			// convert json to object
			var jacket = j2o(json)
			throwIf(!jacket, "bad json: "+json)
			
			// jacket should look like this:
			//
			//		{ msgid: "123", payload: { msg: "ping", ... } }
			//
			// if a reply is sent back, a similar jacket is
			// sent back with msgid as replyid like this:
			// 
			//		{ replyid: "123", payload: { msg: "pong", ... } }

			var msgid = jacket.msgid;
			throwIf(!msgid, "bad msgid: "+msgid)

			var payload = jacket.payload;
			throwIf(!payload, "no data: "+payload)

			// jacket checks out.  now handle msg payload

			var msg = payload.msg;
			throwIf(!msg, "msg is falsey")
			throwIf(typeof msg !== "string", "msg invalid");

			// lookup handler function
			var fun = global["msg_"+msg]
			throwIf(!fun, "no handler function");

		} catch(e) {
			log("MSG ERR: "+e);
			return;
		}

		// send reply back to client as payload with a replyid jacket
		var reply = function(err, data) {
			client.send({ error: err, data: data, }, msgid)
		}

		// XXX ditch these two 
		payload.error = reply
		payload.reply = function(data) { reply(null, data) }	

		// call the handler
		fun(payload, client, reply)

	}); 

	ws.on("close", function() {
		// websocket connection lost
		log(id+" disconnected")
		delete clients[id];
	});

}

//	-	-	-	-	-	-	-	-	-	-	-	-	-	-

msg_ping = function(m, client) {
	m.reply("pong");
}


