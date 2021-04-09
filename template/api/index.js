'use strict'
const L = require( "log5" ).mkLog( "api: " )( 5 );

let api = function( req, res, cb ) {

	L.V("api called");
	let act = null;
	if( act ) {
		L.V( act );

		if( act == "log" ) {
			// get msg
			L.I("logging message");
		}
		cb();
	}

	cb( req, res );
}

module.exports = api;
