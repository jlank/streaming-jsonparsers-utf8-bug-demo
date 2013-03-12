#!/usr/bin/env node
// this script compares two json objects that should always be the same

var request = require('request'),
    request_patched = require('./node_modules_patched/request/main'),
    http = require('http'),
    fs = require('fs'),
    es = require('event-stream'),
    JSONStream = require('JSONStream'), // depends on json parse
    couch_parser = JSONStream.parse(['rows', true]),
    iterations = 4000,
    json_string = '{"id":"a5cbbefae3eab6beb3e161db9305dd00","key":["multibyteutf8json"],"value":{"russian_text":"А, Б, В, Г, Д, Е, Ё, Ж, З, И, Й, К, Л, М, Н, О, П, Р, С, Т, У, Ф, Х, Ц, Ч, Ш, Щ, Ъ, Ы, Ь, Э, Ю, Я"}}';

var compare = es.map(function (data, hollaback) {
 if (json_string !== JSON.stringify(data)) {
   process.stdout.write('\033[31m☓\033[0m\n');
   return hollaback(null, JSON.stringify(data) + '\n');
 }
 process.stdout.write('\033[32m·\033[0m');
});

var args = process.argv.slice(2);
if (!args[0]) {
  console.log('pass argument \'http\' \'request\' \'request-patched\' or \'file\'');
  process.exit()
}

console.log('Using the `JSONStream` module (depends on jsonparse) to compare ' + iterations + ' lines of json strings from a ' +
             args[0] + ' stream that should be equal to:\n\n' + json_string + '\n');

process.stdout.write('\033[32m·\033[0m = success/equal, \033[31m☓\033[0m = error/not equal\n\n');

if (args[0] === 'http') { // test core http module

  http.get('http://localhost:3000?iterations=' + iterations)
    .on('response', function(body) {
      body.setEncoding('utf8');
      body
        .pipe(couch_parser)
        .pipe(compare)
        .pipe(process.stdout)
  });

} else if (args[0] === 'request') { // test @mikeal's request module

  request.get({ url: 'http://localhost:3000?iterations=' + iterations, encoding: 'utf8' })
    .pipe(couch_parser)
    .pipe(compare)
    .pipe(process.stdout)

} else if (args[0] === 'request-patched') { // test @mikeal's request module patched

  request_patched.get({ url: 'http://localhost:3000?iterations=' + iterations, encoding: 'utf8' })
    .pipe(couch_parser)
    .pipe(compare)
    .pipe(process.stdout)

} else if (args[0] === 'file') { // test core fs module

  fs.createReadStream('./10k_lines.json', { encoding: 'utf8' })
    .pipe(couch_parser)
    .pipe(compare)
    .pipe(process.stdout)

}