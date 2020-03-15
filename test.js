

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
	log( "WS: connect" );
	ws.send( "ws test" );
	//ws.on( "message", function( data ) {
	//	ws.send( data );
	//});
}

let http_handler = function( req, res, next ) {
	log( "HTTP: " + req.url );
	res.end( "Hi " + time() );
}


let webserver = require( "./webserver.js" );
webserver( { http_handler, websocket_handler } );




