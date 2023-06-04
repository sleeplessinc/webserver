
delete require.cache[ module.filename ];	// always reload

const connect = require( "connect" );
const { o2j, } = require( "sleepless" );

const { log, error }  = console;


exports.create = function( opts ) {

    const root = opts.root || ".";

    const app = connect();

    app.use( require( "body-parser" ).json() );
    app.use( require( "compression" )() );
    app.use( require( "cors" )() );	// allow requests from other domains

    // populate req.query
    app.use( function( req, res, next ) {
        req.query = require('querystring').parse( req._parsedUrl.query );
        next();
    } );

    // logger
    app.use( function( req, res, next ) {
        let { method, url, query, body } = req;
        url = url.split( "?" ).shift();
        log( method + " " + o2j(url) + " " + o2j( query ) + "/" + o2j( body ) );
        next();
    } );

    app.use( function( req, res, next ) {

        let { method, url, query, body } = req;

        // if not an rpc request, pass on to static
        const path = url.split( "?" ).shift();
        if( path != "/rpc" && path != "/rpc/" ) {
            next();
            return
        }

        // handle rpc request

        const done = ( error, data ) => {
            let json = JSON.stringify( { error, data } );
            res.writeHead( 200, {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
            });
            res.write( json );
            res.end();
        };
        const okay = ( data ) => { done( null, data ); };
        const fail = ( error, body ) => { done( error, body ); };

        // Load api handler and pass input on to it
        // XXX shouldn't really allow GET unless we are in a dev mode or something
        const input = ( method == "POST" ) ? body : query;

        const dbg = input.dbg;
        if( dbg ) log( "----------->>> RPC "+o2j(input));

        try {

            const p = require("path").resolve( root + "/rpc" );
            const mod = require( p );
            mod( input, data => {
                if( dbg ) log( "<<<=========== RPC OKAY "+o2j(data));
                okay( data );
            }, err => {
                if( dbg ) log( "<<<!!!!!!!!!!! RPC FAIL "+o2j(err));
                fail( err );
            }, req, res );

        } catch( err ) {

            error( err.stack );
            fail( "API unavailable" );

        }

    } );

    app.use( require( "serve-static" )( root + "/static" ) );

    return app;
    
}


