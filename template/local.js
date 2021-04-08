document.addEventListener( "DOMContentLoaded", dcl => {
	checkReload();
	document.querySelector( "#okay" ).addEventListener( "click", e => {
		let ok = confirm("Okay?");
		if( ok ) alert("Okay. Okay. Okay.");
	});
});

let old_reload = null, reload_script = null;
function checkReload( cb ) {
	if( reload_script ) reload_script.remove();
    reload_script = document.createElement( "script" );
    if ( cb ) reload_script.onload = cb( reload_script );
    reload_script.src = "reload.js";
    document.body.appendChild( reload_script );
	setTimeout( () => {
		checkReload( s => {
			if( !old_reload ) old_reload = globalThis.needs_reload;
			if( old_reload != globalThis.needs_reload ) { window.location.reload(); }
			old_reload = globalThis.needs_reload;
		});
	}, 1000);
}
