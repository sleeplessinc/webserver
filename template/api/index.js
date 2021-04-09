delete require.cache[module.filename];	// force module reload on every request
'use strict'

require('sleepless').globalize();

const L = require( "log5" ).mkLog( "api: " )( 5 );

let api = function( req, res ) {

	let calls = ["log", "db", "do_something"];

	let body = req?.body || {};
	body = j2o(body);

	let okay = function( data = "" ) {
		res.writeHead(200, { 'Content-Type': 'application/json' });
    	res.write(j2o(data));
		L.I(data);
		res.end();
	}

	let fail = function( data = "" ) {
		res.writeHead(500, { 'Content-Type': 'application/json' });
		res.write(o2j(data));
		L.E(data);
		res.end();
	}

	let act = body?.act || null;
	if( act ) {
		L.W( act );

		if( act == "log" ) {
			// get msg
			let msg = body?.msg || null; 
			L.I( msg );
			okay();
		}

		if( act == "calls" ) {
			// get msg
			okay( calls );
		}

		fail({error: `${act} is not a valid option`});
		return;
	} else {
		fail({error: `no act`});
		return;
	}

}

module.exports = api;
