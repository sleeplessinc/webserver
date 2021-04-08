const L = require( "log5" ).mkLog( "rpc: " )( 5 );
let rpc = function( req, res, cb ) {
	L.V( req.url );

	// do rpc call 
	let act = null;
	if( act ) {
		L.I( act );
		cb();
	}

	// drop back to static, or handle it myself
	req.url = `static/${req.url}`;
	cb( req, res );
}

module.exports = rpc;
