#!/usr/bin/env node
/*
 * this script simulates a json view response from couchdb
 * you can send requests to localhost:3000 and add an optional ?iterations=[NUM] query string
 * to stream back more than 1 row back in the response
 */

var http = require('http')

http.createServer(function (req, res) {
  var params = require('url').parse(req.url);
  var iterations = require('querystring').parse(params.query).iterations || undefined;

  res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
  res.write('{"total_rows":"' + (iterations || 1) + '","offset":0,"rows":[\n');
  if (iterations) {
    for (var i = 0; i < iterations; i++) {
    res.write('{"id":"a5cbbefae3eab6beb3e161db9305dd00","key":["multibyteutf8json"],"value":{"russian_text":"А, Б, В, Г, Д, Е, Ё, Ж, З, И, Й, К, Л, М, Н, О, П, Р, С, Т, У, Ф, Х, Ц, Ч, Ш, Щ, Ъ, Ы, Ь, Э, Ю, Я"}},\n');
    }
  }
  res.write('{"id":"a5cbbefae3eab6beb3e161db9305dd00","key":["multibyteutf8json"],"value":{"russian_text":"А, Б, В, Г, Д, Е, Ё, Ж, З, И, Й, К, Л, М, Н, О, П, Р, С, Т, У, Ф, Х, Ц, Ч, Ш, Щ, Ъ, Ы, Ь, Э, Ю, Я"}}\n');
  res.write(']}\n');
  res.write('');
  res.end();

}).listen(3000, '127.0.0.1');
console.log('started on 3000');