delete require.cache[module.filename];	// force module reload on every request
'use strict'

const L = require( "log5" ).mkLog( "router: " )( 5 );
const colors = require( "colors" );

let router = function( req, res, cb ) {
	if( req?.url != "/reload.js" ) { L.V( `\t${req.url.green.bold}` ); }

	if ( req.url.startsWith("/api") ) {
		let mod = mod_load( __dirname + "/api" );
		if( mod ) {
			L.D("\tapi module loaded ".cyan.bold);
		   	mod( req, res );
		} else {
			L.I("\tmod not found".red.bold);
		}
		res.end();
		return;
	} else {
		req.url = `static/${req.url}`;
		cb( req, res );
	}

}

module.exports = router;
