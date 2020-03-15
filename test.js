

let argv = process.argv;

let domain = argv[ 2 ] || "foobar.baz";
let port = argv[ 2 ] || 80;

sleepless = require( "sleepless" );

webserver = require( "./webserver.js" );


ws_handler = function( ws_event ) {
	log( "WS: " + ws_event.msg );
	//ws_event.reply( "WS: " + ws_event.msg );
}

http_handler = function( req, res, next ) {
	log( "HTTP: " + req.url );
	res.end( "Hi." );
}


server = webserver.create( { domain, http_handler, ws_handler } );

server.listen( port, function() {
	log( "Listening" );
});



