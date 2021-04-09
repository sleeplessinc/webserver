delete require.cache[module.filename];	// force module reload on every request
'use strict'

const L = require( "log5" ).mkLog( "router: " )( 5 );
let router = function( req, res, cb ) {
	if( req?.url != "/reload.js" ) { L.V( req.url ); }

	// static serve api files?
	if( req.url.startsWith("/api/") ) {
		req.url = `static/${req.url}`;
		cb( req, res );
		return;
	}

	if ( req.url.startsWith("/api") ) {
		let mod = mod_load( __dirname + "/api" );
		if( mod ) {
			L.D("api module loaded ");
		   	mod( req, res, () => { cb( req, res ); });
		} else {
			L.I("mod not found");
		}
	} else {
		req.url = `static/${req.url}`;
		cb( req, res );
	}

}

module.exports = router;
