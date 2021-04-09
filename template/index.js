delete require.cache[module.filename];	// force module reload on every request
'use strict'

const L = require( "log5" ).mkLog( "router: " )( 5 );
let router = function( req, res, cb ) {
	if( req?.url != "/reload.js" ) { L.V( req.url ); }

	if ( req.url.startsWith("/api") || req.url.startsWith("/api/") ) {
		let body = req?.body || null;
		if( ! body ) {
			res.end();
			return;
		}
		let mod = mod_load( __dirname + "/api" );
		if( mod ) {
			L.D("api module loaded ");
		   	mod( req, res );
		} else {
			L.I("mod not found");
		}
		res.end();
		return;
	} else {
		req.url = `static/${req.url}`;
		cb( req, res );
	}

}

module.exports = router;
