delete require.cache[module.filename];	// force module reload on every request
'use strict'

require('sleepless').globalize();

const L = require( "log5" ).mkLog( "api: " )( 5 );

let api = function( req, res ) {

	let calls = ["log", "calls"];

	let body = req.body || {};
	body = j2o(body);

	let okay = function( data = "" ) {
		L.I(o2j(data));
		res.writeHead(200, { 'Content-Type': 'application/json' });
    	res.end(o2j(data));
	}

	let fail = function( data = "" ) {
		L.E(o2j(data));
		res.writeHead(500, { 'Content-Type': 'application/json' });
		res.end(o2j(data));
	}

	let act = body?.act || null;
	if( act ) {
		L.W( act );

		if( act == "log" ) {
			// get msg
			let msg = body?.msg || null; 
			L.I( msg );
			okay();
			return;
		}

		if( act == "calls" ) {
			// get msg
			okay( calls );
			return;
		}

		fail({error: `${act} is not a valid option`});
		return;
	} else {
		fail({error: `no act`});
		return;
	}

}

module.exports = api;
