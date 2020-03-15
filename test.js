

sleepless = require( "sleepless" );

let argv = process.argv;

let domain = argv[ 2 ];
let port = argv[ 3 ];
let subscriberEmail = argv[ 4 ];

let agreeToTerms = true;

let usage = function() {
	log( "Usage: node test.js DOMAIN PORT EMAIL" );
	log( "Example: node test.js example.com 443 foo@bar.com" );
	process.exit( 1 );
}

if( argv.length != 5 )
	usage();

webserver = require( "./webserver.js" );


ws_handler = function( ws_event ) {
	log( "WS: " + ws_event.msg );
	//ws_event.reply( "WS: " + ws_event.msg );
}

http_handler = function( req, res, next ) {
	log( "HTTP: " + req.url );
	res.end( "Hi." );
}


server = webserver.create( {
		domain,
		http_handler,
		ws_handler,
		agreeToTerms,
		subscriberEmail,
	} );

server.listen( port, function() {
	log( "Listening" );
});



