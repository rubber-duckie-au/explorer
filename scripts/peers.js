var mongoose = require('mongoose')
  , lib = require('../lib/explorer')
  , db = require('../lib/database')
  , settings = require('../lib/settings')
  , request = require('request');

var COUNT = 5000; //number of blocks to index
if ( settings.https_site === "true" ) {
 base_uri = 	'https://' + settings.site_url;
}
else {
 base_uri = 	'http://' + settings.site_url;	
}



function exit() {
  mongoose.disconnect();
  process.exit(0);
}

var dbString = 'mongodb://' + settings.dbsettings.user;
dbString = dbString + ':' + settings.dbsettings.password;
dbString = dbString + '@' + settings.dbsettings.address;
dbString = dbString + ':' + settings.dbsettings.port;
dbString = dbString + '/' + settings.dbsettings.database;

mongoose.connect(dbString, function(err) {
  if (err) {
    console.log('Unable to connect to database: %s', dbString);
    console.log('Aborting');
    exit();
  } else {
    request({uri: base_uri + '/api/getpeerinfo', json: true}, function (error, response, body) {    
	lib.syncLoop(body.length, function (loop) {
        var i = loop.iteration();
        if (body[i].addr.indexOf("]") > -1) {
              var temp_address = body[i].addr.split(']')[0]
              var address = temp_address.replace('[', '')
              var temp_port = body[i].addr.split(']')[1]
              var port = temp_port.replace(':', '')
//console.log ('PORTv6 =' + port)
//console.log ('ADDRv6 =' + address)
        }
        else {
	var address = body[i].addr.split(':')[0];
	var port = body[i].addr.split(':')[1];
//console.log ('PORTv4 =' + port)
//console.log ('ADDRv4 =' + address)

	}
        db.find_peer(address, function(peer) {
          if (peer) {
            if (isNaN(peer['port']) || peer['port'].length < 2 || peer['country'].length < 1 || peer['country_code'].length < 1) {
              db.drop_peers(function() {
                console.log('Saved peers missing ports or country, dropping peers. Re-reun this script afterwards.');
                exit();
              });
            }
            // peer already exists
            loop.next();
          } else {
            request({uri: 'https://freegeoip.app/json/' + address, json: true}, function (error, response, geo) {
              db.create_peer({
                address: address,
                port: port,
                protocol: body[i].version,
                version: body[i].subver.replace('/', '').replace('/', ''),
                country: geo.country_name,
                country_code: geo.country_code
              }, function(){
                loop.next();
              });
            });
          }
        });
      }, function() {
        exit();
      });
    });
  }
});
