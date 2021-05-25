var request = require('request');

var base_url = 'https://api.hitbtc.com/api/2/public';

function get_summary(coin, exchange, cb) {
    var req_url = base_url + '/ticker/' + coin + exchange;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.message) {
        return cb(body.message, null)
      } else {
        //body.result[0]['last'] = body.result[0]['Last'];
        return cb (null, body);
      }
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + '/trades/' + coin + exchange + '?limit=50';
  request({uri: req_url, json: true}, function (error, response, body) {
      if (error) {
          return cb(error, null);
      } else {
          if (body.message) {
              return cb(body.message, null)
          } else {
              return cb(null, body);
          }
      }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + '/orderbook/' + coin + exchange + '?limit=50';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body) {
      var orders = body;
      var buys = [];
      var sells = [];
      if (orders['bid'].length > 0){
          for (var i = 0; i < orders['bid'].length; i++) {
            var order = {
              amount: parseFloat(orders.bid[i].size).toFixed(11),
              price: parseFloat(orders.bid[i].price).toFixed(11),
              //  total: parseFloat(orders.buy[i].Total).toFixed(11)
              // Necessary because API will return 0.00 for small volume transactions
              total: (parseFloat(orders.bid[i].size).toFixed(11) * parseFloat(orders.bid[i].price)).toFixed(8)
            }
            buys.push(order);
          }
      }
      if (orders['ask'].length > 0) {
        for (var x = 0; x < orders['ask'].length; x++) {
            var order = {
                amount: parseFloat(orders.ask[x].size).toFixed(11),
                price: parseFloat(orders.ask[x].price).toFixed(11),
                //    total: parseFloat(orders.sell[x].Total).toFixed(11)
                // Necessary because API will return 0.00 for small volume transactions
                total: (parseFloat(orders.ask[x].size).toFixed(11) * parseFloat(orders.ask[x].price)).toFixed(11)
            }
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
