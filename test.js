

let sleepless = require( "sleepless" );

let argv = process.argv;

let domain = argv[ 2 ];
let email = argv[ 3 ];
let port = argv[ 4 ];

let usage = function() {
	log( "Usage: node test.js DOMAIN PORT EMAIL" );
	log( "Example: node test.js" );
	process.exit( 1 );
}

//if( argv.length != 5 )
//	usage();


let websocket_handler = function( ws, req ) {
	log( "WS: connection" );
	ws.send( "Hi client, i am server." );
	ws.on( "message", function( data ) {
		log( "msg from client reads: " + data );
		ws.send( "you said: " + data );
	});
}

app = require( "express" )();
app.use(function( req, res, next ) {
	log( "HTTP: " + req.url );
	let html = require("fs").readFileSync( "./index.html", "utf8" );
	res.setHeader( "Content-Type", "text/html; charset=utf-8" );
	res.end( html );
});


let webserver = require( "./webserver.js" );
webserver( { http_handler: app, websocket_handler } );




