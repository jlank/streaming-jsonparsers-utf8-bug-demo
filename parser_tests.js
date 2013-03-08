#!/usr/bin/env node
/*
 * this script tests how the `jsonparse` and `clarinet` streaming json parsing
 * modules handle chunked json that breaks on & multibyte utf8 chars
 */

var Parser = require('jsonparse'),
    json_string = '{"id":"a5cbbefae3eab6beb3e161db9305dd00","key":["multibyteutf8json"],"value":{"russian_text":"А, Б, В, Г, Д, Е, Ё, Ж, З, И, Й, К, Л, М, Н, О, П, Р, С, Т, У, Ф, Х, Ц, Ч, Ш, Щ, Ъ, Ы, Ь, Э, Ю, Я"}}',
    stream = undefined,
    buffer = new Buffer(json_string),
    chunk1 = new Buffer(buffer.slice(0, 119)),
    chunk2 = new Buffer(buffer.slice(119));

var args = process.argv.slice(2);
if (!args[0]) {
  console.log('pass argument \'jsonparse\' or \'clarinet\'');
  process.exit()
}

console.log('testing ' + args[0] + '\'s ability to handle multibyte utf8 characters split before boundary');
console.log('**************************************************************************************\n');
console.log('full buffer:')
console.log(buffer.toString())
console.log('\nsimulated stream chunk1: ')
console.log(chunk1.toString())
console.log('\nsimulated stream chunk2: ')
console.log(chunk2.toString())


if (args[0] === 'jsonparse') {
  stream = new Parser();
  stream.onValue = function (value) {
    console.log(value);
  };
}
if (args[0] === 'clarinet') {
  stream = require("clarinet").createStream();
  stream.on("value", function (node) {
    console.log(node);
  });
}

if (stream) {
  console.log('---------\n');
  console.log('write full buffer to ' + args[0] + ':');
  stream.write(buffer);

  console.log('---------\n');
  console.log('write chunk1 to ' + args[0] +':');
  stream.write(chunk1);

  console.log('---------\n');
  console.log('write chunk2 to ' + args[0] + ':');
  stream.write(chunk2);
}
