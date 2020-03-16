"use strict";

// Copyright 2020
// Sleepless Software Inc.
// All Rights Reserved
// sleepless.com

const sleepless = require("sleepless");

module.exports = function( opts ) {

	// add defaults for those attributes in opts that aren't provided
	let def_opts = {
		packageRoot: ".",
		configDir: "./greenlock.d",
		cluster: false,
		websocket_handler: function(){},
	}
	for( let k in def_opts ) {
		if( opts[ k ] === undefined ) {
			opts[ k ] = def_opts[ k ];
		}
	}
	opts.maintainerEmail = opts.email;

	throwIf( ! opts.email, "The 'maintainerEmail' attribute required in options" );


	require("greenlock-express")
	.init( opts )
	.ready( function( glx ) {

		let server = glx.httpsServer();

		let WebSocket = require( "ws" );
		let wss = new WebSocket.Server( { server } );
		wss.on( "connection", opts.websocket_handler ); 

		glx.serveApp( opts.http_handler );

	});
}

