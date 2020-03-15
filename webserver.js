"use strict";

// Copyright 2020
// Sleepless Software Inc.
// All Rights Reserved
// sleepless.com


let Greenlock = require( "greenlock" );

let create = function( cfg, cb ) {
	//let greenlock = Greenlock.create({});
	Greenlock.create( cfg )
	.manager
	.defaults( cfg )
	.then( function( fullConfig ) {
		let listen = function( port, cb ) {
			cb();
		};
		return cb( { listen } );
	});
};


module.exports = { create };


