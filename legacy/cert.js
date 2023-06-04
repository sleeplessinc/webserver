
'use strict';

const sleepless = require( "sleepless" );

let DS = new require( "ds" ).DS;	// simple disk based JSON datastore

let config = new DS( "config.json" );		// load the config file
let domains = config.acme.domains;
let maintainerEmail = config.acme.maintainerEmail;
let subscriberEmail = config.acme.subscriberEmail;

let ds = new DS( "acme.json" );
if( ! ds.accounts ) {
	ds.accounts = {};
	ds.challenges = {};
}

async function get_cert() {

	log( "Getting SSL certificate(s) for: "+domains );

	let pkg = require('./package.json');
	let packageAgent = pkg.name + '/' + pkg.version;

	// Choose either the production or staging URL for LE
	let directoryUrl = 'https://acme-staging-v02.api.letsencrypt.org/directory';
	//let directoryUrl = 'https://acme-v02.api.letsencrypt.org/directory'

	function notify(ev, msg) {
		log( "NOTIFY " + ev );
		//log( o2j( msg ) );
	}

	const Keypairs = require('@root/keypairs');

	const ACME = require( "@root/acme" );
	let acme = ACME.create( {
		maintainerEmail,
		packageAgent,
		notify,
		debug: true,
	} );

	await acme.init( directoryUrl );

	let accountKeypair = ds.accountKeypair;
	if( ! accountKeypair ) {
		// create new keypair for account
		accountKeypair = await Keypairs.generate({ kty: 'EC', format: 'jwk' });
		ds.accountKeypair = accountKeypair;
		ds.save();
		log( "Created account keypair" );
	}
	//log( "account keypair:" );
	//log( accountKeypair );

	let accountKey = accountKeypair.private;

	let account = ds.accounts[ accountKey.kid ];
	if( ! account ) {
		// create new account with private key
		account = await acme.accounts.create( {
			subscriberEmail,
			agreeToTerms: true,	// can be a function that returns true
			accountKey,
		} );
		ds.accounts[ accountKey.kid ] = account;
		ds.save();
		log("Created ACME account: " + account.key.kid.split( "/" ).pop());
	}
	//log( "account:" );
	//log( account );

	let serverKeypair = ds.serverKeypair;
	if( ! serverKeypair ) {
		serverKeypair = await Keypairs.generate({ kty: 'RSA', format: 'jwk' });
		ds.serverKeypair = serverKeypair;
		ds.privkey = await Keypairs.export({ jwk: serverKeypair.private });
		ds.save();
		log( "Created server keypair" );
	}
	//log( "serverKeypair:" );
	//log( serverKeypair );

	let serverKey = serverKeypair.private;

	const CSR = require('@root/csr');
	const PEM = require('@root/pem');
	let typ = 'CERTIFICATE REQUEST';
	let encoding = "der";

	let csrDer = await CSR.csr({ jwk: serverKey, domains, encoding });
	let csr = PEM.packBlock({ type: 'CERTIFICATE REQUEST', bytes: csrDer });
	log( "created CSR:" );
	//log( csr );

	let challenges = {
		'http-01': {
			set: function(data) {
				return Promise.resolve().then(function() {
					let ch = data.challenge;
					let key = ch.identifier.value + '#' + ch.token;
					log("CHALLENGE set "+key);
					ds.challenges[key] = ch.keyAuthorization;
					ds.save();
					return null;
				});
			},
			get: function(data) {
				return Promise.resolve().then(function() {
					let ch = data.challenge;
					//console.log(ch);
					let key = ch.identifier.value + '#' + ch.token;
					log("CHALLENGE get "+key);
					if (ds.challenges[key]) {
						return { keyAuthorization: ds.challenges[key] };
					}
					return null;
				});
			},
			remove: function(data) {
				return Promise.resolve().then(function() {
					let ch = data.challenge;
					//console.log(ch);
					let key = ch.identifier.value + '#' + ch.token;
					log("CHALLENGE remove "+key);
					delete ds.challenges[key];
					ds.save();
					return null;
				});
			}
		},
	};

	let httpd = require("http").createServer( ( req, res ) => {
		//log( "------ HTTP: "+req.method+" "+req.url );
		let a = req.url.split( "/" );
		let tk = a.pop();
		let key = domains[ 0 ] + "#" + tk;
		let d = ds.challenges[ key ];
		//log( "   <---<< "+d );
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		res.end( d );
	} );

	httpd.listen( 80, async function() {
		log("HTTP listening for challenges" );
		try {

			log('requesting SSL cert: ' + domains.join(' '));
			let pems = await acme.certificates.create({
				account,
				accountKey,
				csr,
				domains,
				challenges
			});
			//log( "pems: " );
			log( pems );
			ds.pems = pems;
			ds.save();
			//log('stored pems');

			let fullchain = pems.cert + '\n' + pems.chain + '\n';
			//log( "fullchain: " );
			log( fullchain );
			ds.fullchain = fullchain;
			ds.save();
			//log('stored fullchain');

			log("SSL certificate renewed");

		} catch( err ) {
			log( "Certificate creation failed" );
			log( err );
		}

		httpd.close();
		httpd;

	});
}


let need_cert = function() {
	let pems = ds.pems;
	if( pems ) {
		if( pems.expires ) {
			let exp = new Date( pems.expires );
			log( "Existing certificate expires "+exp.toString() );
			if( exp.getTime() > Date.now() ) {
				log( "Not yet time to renew SSL certificate" );
				return false;
			}
		}
	}
	return true;
};


if( need_cert() ) {
	get_cert();
}



