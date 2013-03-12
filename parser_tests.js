#!/usr/bin/env node
/*
 * this script tests how the `jsonparse` and `clarinet` streaming json parsing
 * modules handle chunked json that breaks on & multibyte utf8 chars
 */

var Parser = require('jsonparse'),
    Parser_patched = require('./node_modules_patched/jsonparse/jsonparse'),
    clarinet = require('clarinet'),
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

process.stdout.write('\033[31m');
process.stdout.write('full buffer:');
process.stdout.write('\033[0m\n');
console.log(buffer.toString())

console.log('\n');
process.stdout.write('\033[31m');
process.stdout.write('simulated stream chunk1:');
process.stdout.write('\033[0m\n');
console.log(chunk1.toString())


console.log('\n');
process.stdout.write('\033[31m');
process.stdout.write('simulated stream chunk2:');
process.stdout.write('\033[0m\n');
console.log(chunk2.toString())


if (args[0] === 'jsonparse') {
  stream = new Parser();
  stream.onValue = function (value) {
    console.log(value);
  };
}
if (args[0] === 'jsonparse-patched') {
  stream = new Parser_patched();
  stream.onValue = function (value) {
    console.log(value);
  };
}

if (args[0] === 'clarinet') {
  stream = clarinet.createStream();
  stream.on('value', function (node) {
    console.log(node);
  });
}

if (stream) {
  console.log('\n');
  process.stdout.write('\033[34m');
  process.stdout.write('write full buffer to ' + args[0] + ':\n');
  process.stdout.write('\033[0m');
  stream.write(buffer);

  console.log('\n');
  process.stdout.write('\033[34m');
  process.stdout.write('write chunk1 to ' + args[0] +':\n');
  process.stdout.write('\033[0m');
  stream.write(chunk1);

  console.log('\n');
  process.stdout.write('\033[34m');
  process.stdout.write('write chunk2 to ' + args[0] + ':\n');
  process.stdout.write('\033[0m');
  stream.write(chunk2);
}
