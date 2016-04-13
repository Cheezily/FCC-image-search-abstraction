var http = require('http');
var url = require('url');
var request = require('request');

var API_KEY = process.env.API_KEY || require('./apikey').API_KEY();
var bing = require('node-bing-api')({ accKey: API_KEY });

var server = http.createServer(function(req, res) {

  //the search term needs to be captured with url pathname now that queries
  //are being accepted
  console.log("Search Term: " + url.parse(req.url).pathname.substring(1));
  var searchTerm = url.parse(req.url).pathname.substring(1);
  var query = url.parse(req.url, true).query;

  //get the number of results to skip as a query parameter
  var offset = 0;
  if (query['offset']) {
    offset = parseInt(query['offset']);
  }

  bing.images(searchTerm, {
    top: 10 + offset,
    skip: offset,
  },
  function(err, response, body) {
    sendOut(body['d']['results']);
  })


  function sendOut(responses) {

    var output = [];

    //console.log(responses.length);
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
