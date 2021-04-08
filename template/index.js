let rpc = function( req, res, cb ) {
	console.log("rpc call made");

	// do rpc call 
	let act = null;
	if( act ) {

		console.log( act );
		cb();
	}

	// drop back to static, or handle it myself
	cb( req, res );
}

module.exports = rpc;
