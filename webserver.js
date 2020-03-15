"use strict";

// Copyright 2020
// Sleepless Software Inc.
// All Rights Reserved
// sleepless.com



let create = function( cfg ) {

	let listen = function( port, cb ) {
		cb();
	};

	return { listen };

};


module.exports = { create };


