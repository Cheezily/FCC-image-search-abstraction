var http = require('http');

var API_KEY = process.env.API_KEY || "my key";
var bing = require('node-bing-api')({ accKey: API_KEY });

var server = http.createServer(function(req, res) {

  var searchTerm = req.url.substring(1);

  bing.images(searchTerm, {
    top: 10
  },
  function(err, response, body) {
    sendOut(body['d']['results']);
  })


  function sendOut(responses) {

    var output = [];

    console.log(responses.length);
    for (var i = 0; i < responses.length; i++) {
      var item = {};
      item.url = responses[i]['MediaUrl'];
      item.snippet = responses[i]['Title'];
      item.thumbnail = responses[i]['Thumbnail']['MediaUrl'];
      item.context = responses[i]['SourceUrl'];

      output.push(item);
    }
    res.end(JSON.stringify(output));
  }

});


var portNumber = process.env.PORT || 3000
server.listen(portNumber);
console.log("Listening on port " + portNumber.toString());
