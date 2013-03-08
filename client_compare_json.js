#!/usr/bin/env node
// this script compares two json objects that should always be the same

var request = require('request'),
    JSONStream = require('JSONStream'), // depends on json parse
    couch_parser = JSONStream.parse(['rows', true]),
    fs = require('fs'),
    es = require('event-stream'),
    iterations = 1000,
    json_string = '{"id":"a5cbbefae3eab6beb3e161db9305dd00","key":["multibyteutf8json"],"value":{"russian_text":"А, Б, В, Г, Д, Е, Ё, Ж, З, И, Й, К, Л, М, Н, О, П, Р, С, Т, У, Ф, Х, Ц, Ч, Ш, Щ, Ъ, Ы, Ь, Э, Ю, Я"}}';

var compare = es.map(function (data, hollaback) {
  request.get('http://localhost:3000', function (err, res, body) {
    if (!err) {
      if (json_string !== JSON.stringify(data)) {
        console.log('not equal');
        hollaback(null, JSON.stringify(data) + '\n');
      }
    }
  });
});

var args = process.argv.slice(2);
if (!args[0]) {
  console.log('pass argument \'http\' or \'file\'');
  process.exit()
}

console.log('Using the `JSONStream` module (depends on jsonparse) to comparw ' + iterations + ' lines of json strings from a ' +
             args[0] + ' stream that should be equal to:\n\n' + json_string + '\n');

if (args[0] === 'http') {
  request.get('http://localhost:3000?iterations=' + iterations)
    .pipe(couch_parser)
    .pipe(compare)
    .pipe(process.stdout)
}
else if (args[0] === 'file') {
  fs.createReadStream('./10k_lines.json')
    .pipe(couch_parser)
    .pipe(compare)
    .pipe(process.stdout)
}