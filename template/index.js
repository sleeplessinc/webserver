'use strict'
const L = require( "log5" ).mkLog( "rpc: " )( 5 );
let rpc = function( req, res, cb ) {
	if( req?.url != "/reload.js" ) { L.V( req.url ); }

	// do rpc call 
	// TODO get act from body
	let act = null;
	if( act ) {
		L.V( act );

		if( act == "log" ) {
			// get msg
			L.I("logging message");
		}
		cb();
	}

	// drop back to static, or handle it myself
	req.url = `static/${req.url}`;
	cb( req, res );
}

module.exports = rpc;
