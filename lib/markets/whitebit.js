var request = require('request');

var base_url = 'https://whitebit.com/api/v1/public';


function get_summary(coin, exchange, cb) {
    var req_url = base_url + '/ticker?market=' + coin + '_USDT';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      console.log('ERROR')
      return cb(error, null);
    } else {
      if (body.message) {
	console.log(body.message)
        return cb(body.message, null)
      } else {
	console.log('RESULT:')
	console.log(body.result)
        return cb (null, body.result);
      }
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + '/history?market=' + coin + '_USDT' + '&lastId=1&limit=50';
  request({uri: req_url, json: true}, function (error, response, body) {
      if (error) {
          return cb(error, null);
      } else {
          if (body.message) {
              return cb(body.message, null)
          } else {
              return cb(null, body.result);
          }
      }
  });
}


function get_orders(coin, exchange, cb) {
  var req_url = base_url + '/depth/result?market=' + coin + '_USDT' + '&limit=50';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body) {
      var orders = body;
      var buys = [];
      var sells = [];
      if (orders['bids'].length > 0){
          for (var i = 0; i < orders['bids'].length; i++) {
            console.log ('amount: ' + parseFloat(orders.bids[i][1]).toFixed(8))
	    var order = {
              price: parseFloat(orders.bids[i][0]).toFixed(8),
              amount: parseFloat(orders.bids[i][1]).toFixed(8),
              total: (parseFloat(orders.bids[i][1]).toFixed(8) * parseFloat(orders.bids[i][0])).toFixed(8)
            }
            buys.push(order);
          }
      }

      if (orders['asks'].length > 0) {
        for (var x = 0; x < orders['asks'].length; x++) {
            var order = {
		price: parseFloat(orders.asks[x][0]).toFixed(8),
                amount: parseFloat(orders.asks[x][1]).toFixed(8),
                total: (parseFloat(orders.asks[x][1]).toFixed(8) * parseFloat(orders.asks[x][0])).toFixed(8)
            }
	    //console.log(order)

            sells.push(order);
        }
      }
      return cb(null, buys, sells);
    } else {
      return cb(body.message, [], []);
    }
  });
}

module.exports = {
  get_data: function(settings, cb) {
    var error = null;
    get_orders(settings.coin, settings.exchange, function(err, buys, sells) {
      if (err) { error = err; }
      get_trades(settings.coin, settings.exchange, function(err, trades) {
        if (err) { error = err; }
        get_summary(settings.coin, settings.exchange, function(err, stats) {
          if (err) { error = err; }
          return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
        });
      });
    });
  }
};
