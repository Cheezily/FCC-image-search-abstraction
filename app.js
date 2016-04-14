var http = require('http');
var url = require('url');

//var localApiKey = require('./apikey').API_KEY();
//var API_KEY = process.env.API_KEY || localApiKey;

var API_KEY = process.env.API_KEY
var bing = require('node-bing-api')({ accKey: API_KEY });

//var mongoConnection = require('./myMongoDB').connectURL();
//var MongoURL = process.env.MongoURL || mongoConnection;

var MongoURL = process.env.MongoURL
var MongoClient = require('mongodb').MongoClient;


var server = http.createServer(function(req, res) {

  //nothing should be done when the favicon is requested
  if (req.url == '/favicon.ico') {
    res.end();
    return;
  }

  //the search term needs to be captured with url pathname now that queries
  //are being accepted
  console.log("Search Term: " + url.parse(req.url).pathname.substring(1));
  var passedInfo = url.parse(req.url).pathname;
  var query = url.parse(req.url, true).query;

  if (passedInfo == '/') {
    res.writeHeader(200, {"Content-Type": "text/html"});
    res.end('<h2>Usage:</h2> ' +
      "<h4>To conduct a search, add your term to the end of the following:</h4>" +
      "<code>http://fcc-image-search-cheezily.herokuapp.com/api/imagesearch/</code>" +
      "<p>You can also add a query '?offset=xx' to skip a set number of results.</p>" +
      "<p>Example: <code>http://fcc-image-search-cheezily.herokuapp.com/api/imagesearch/puppies?offset=22</code>" +
      " to search for images of puppies and skip the first 22 results.</p>" +
      "<h4>To see the last 10 searches performed, check out the following:</h4>" +
      "<code>http://http://fcc-image-search-cheezily.herokuapp.com/api/latest</code>");


  //handles requests sent to the /api/imagesearch/ path
  } else if (passedInfo.substring(0, 17) == "/api/imagesearch/") {
    var searchTerm = passedInfo.substring(17, passedInfo.length);
    console.log("term: " + searchTerm);

    //store the search term in a database
    MongoClient.connect(MongoURL, function (err, db) {

      if (err) {console.log(err);}

      db.collection('terms').insert({'term': searchTerm, 'when': new Date()})
      console.log('connected!');
      db.close();
    });

    //get the number of results to skip as a query parameter
    var offset = 0;
    if (query['offset']) {
      offset = parseInt(query['offset']);
    }

    //sends the image search request to Bing
    bing.images(searchTerm, {
      top: 10 + offset,
      skip: offset,
    },
    function(err, response, body) {
      sendOut(body['d']['results']);
    })


    //renders the search results
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

  //handles pulling information from the database if the
  //user goes to /api/latest
  } else if (passedInfo.substring(0, 11) == "/api/latest") {

    MongoClient.connect(MongoURL, function (err, db) {

      var output = [];

      if (err) {console.log(err);}

        //returns the last 10 terms, sorted by most recent
        db.collection('terms').find({}, {_id: 0}).sort({'when': -1}).limit(10)
          .toArray(function(err, items) {
          for (item in items) {
            output.push(items[item]);
          }
        res.end(JSON.stringify(output));
      });
    });

  //handles any requests to other invalid paths
  } else {
    res.end('Invalid URL pattern entered. Please use /api/imagesearch/yourSearchTerm \n' +
      'or /api/latest to get the last 10 search terms.  Thanks!');
  }

});


var portNumber = process.env.PORT || 3000
server.listen(portNumber);
console.log("Listening on port " + portNumber.toString());
