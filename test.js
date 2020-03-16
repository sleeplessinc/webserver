
let argv = process.argv;

let email = argv[ 2 ];

// create a simple express app that returns index.html for all requests
express = require( "express" );
app = express();
app.use(function( req, res, next ) {
	let html = require("fs").readFileSync( "./index.html", "utf8" );
	res.setHeader( "Content-Type", "text/html; charset=utf-8" );
	res.end( html );
});


// This function handles incoming websocket connections
let ws = function( socket, req ) {
	// a websocket "connection" has come in from the client/browser.
	socket.send( "Welcome!  I'll be your server today." );		// send a websocket msg to client
	// Respond to incoming messages
	socket.on( "message", function( data ) {
		// A websocket message (data) has come in from the client/browser.
		socket.send( "I hear you!  You said: " + data );		// echo it back
	});
}


// create our cool webserver
let webserver = require( "./webserver.js" );
webserver( { http_handler: app, websocket_handler: ws, email } );


