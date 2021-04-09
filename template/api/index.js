delete require.cache[module.filename];	// force module reload on every request
'use strict'

require('sleepless').globalize();

const L = require( "log5" ).mkLog( "api: " )( 5 );

let api = function( req, res, cb ) {

	let body = req?.body || {};
	body = j2o(body);

	let act = body?.act || null;
	if( act ) {
		L.W( act );

		if( act == "log" ) {
			// get msg
			let msg = body?.msg || null; 
			L.I( msg );
		}

		res.end();
		return;
	} else {
		L.E( "called api without an act ");
		return;
	}

	res.end();
}

module.exports = api;
