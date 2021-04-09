delete require.cache[module.filename];	// force module reload on every request
'use strict'
const L = require( "log5" ).mkLog( "api: " )( 5 );

let api = function( req, res, cb ) {

	L.V("api called");
	console.log(req.body);
	let act = null;
	if( act ) {
		L.V( act );

		if( act == "log" ) {
			// get msg
			L.I("logging message");
		}
		cb( req, res );
	}

	cb( req, res );
}

module.exports = api;
