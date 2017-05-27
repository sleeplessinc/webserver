

sleepless = require("sleepless")
webserver = require("./webserver.js")

// webserver.use("/butt", require("express").static('butt'));

// incoming messages (REST or WS)
ws_message = function(o, cb) {
	log("test: "+o2j(o));
	var fun = global["mh_"+o.msg];
	fun(o, cb);
}

mh_hello = function(o, cb) {
	cb({ msg: "welcome" });
}


