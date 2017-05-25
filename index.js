
// Copyright 2017 Sleepless Software Inc.  All Rights Reserved 

var fs = require("fs");
var http = require("http");
var https = require("https");

var express = require("express");

var sleepless = require("sleepless");

// ----------------------------------------------------

var seq = function() {
	global.SEQ_NUM = toInt(global.SEQ_NUM) + 1;
	return global.SEQ_NUM;
};

var PORT_BASE = toInt(process.argv[2]);
var PORT = PORT_BASE + 443;
var PORT80 = PORT_BASE + 80;

var clients = {};

//	-	-	-	-	-	-	-	-	-	-	-	-	-	-

var xapp = express();
var server = null;
var SSL_KEY = null;
var SSL_CERT = null;

SSL_KEY = fs.readFileSync("ssl/privkey.pem", 'utf8');
SSL_CERT = fs.readFileSync("ssl/fullchain.pem", 'utf8');
log("SSL cert and key loaded");
server = https.createServer({key:SSL_KEY, cert:SSL_CERT}, xapp);
var xapp80 = express();
xapp80.use("/", require('express-https-redirect')());
xapp80.listen(PORT80, function() { log("HTTP redirector listening on "+PORT80); });

require('express-ws')(xapp, server);


// static files
xapp.use(express.static('site'));


// websocket connections
xapp.ws('/', function(ws, req) {
	return ws_connect(ws, req)
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


