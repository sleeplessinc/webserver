"use strict";

// Copyright 2020
// Sleepless Software Inc.
// All Rights Reserved
// sleepless.com

const sleepless = require("sleepless");

module.exports = function( opts ) {

	require("greenlock-express")
	.init({
		packageRoot: ".",
		configDir: "./greenlock.d",
		maintainerEmail: "joe@sleepless.com",	// contact for security and critical bug notices
		cluster: false			// whether or not to run at cloudscale
	})
	.ready( function( glx ) {

		let server = glx.httpServer();
		let WebSocket = require( "ws" );
		let ws = new WebSocket.Server( { server: server } );
		ws.on( "connection", opts.websocket_handler ); 
		glx.serveApp( opts.http_handler );
	});

}

