const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');

const handlers = require('./lib/handlers');
const confing = require('./lib/config');
const helpers = require('./lib/helpers');

const httpServer = http.createServer(function(req, res) {
  combinedServer(req, res);
});
httpServer.listen(confing.httpPort, function() {
  console.log(
    'The server is listening in Port ' +
      confing.httpPort +
      ' in ' +
      confing.envName +
      ' mode'
  );
});

var httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, function(req, res) {
  combinedServer(req, res);
});
httpsServer.listen(confing.httpsPort, function() {
  console.log(
    'The server is listening in Port ' +
      confing.httpsPort +
      ' in ' +
      confing.envName +
      ' mode'
  );
});

var combinedServer = function(req, res) {
  const parseUrl = url.parse(req.url, true);

  const path = parseUrl.pathname;
  const trimPath = path.replace(/^\/+|\/+$/g, '');
  var queryStringObject = parseUrl.query;

  const method = req.method.toLowerCase();

  const headers = req.headers;

  const decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function(data) {
    buffer += decoder.write(data);
  });
  req.on('end', function() {
    buffer += decoder.end();
    const Handler =
      typeof router[trimPath] !== 'undefined'
        ? router[trimPath]
        : handlers.NotFound;
    var data = {
      trimPath: trimPath,
      queryStringObject: queryStringObject,
      payload: helpers.parseJsonToObject(buffer),
      method: method,
      headers: headers
    };

    Handler(data, function(statusCode, payload) {
      statusCode = typeof statusCode == 'number' ? statusCode : 200;
      payload = typeof payload == 'object' ? payload : {};
      var payloadString = JSON.stringify(payload);

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log('These are the responses ', statusCode, payloadString);
    });
  });

  var router = {
    ping: handlers.ping,
    user: handlers.users
  };
};
