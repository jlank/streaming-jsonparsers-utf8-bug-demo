// this script compares two json objects that should always be the same

var request = require('request'),
    JSONStream = require('JSONStream'), // depends on json parse
    couch_parser = JSONStream.parse(['rows', true]),
    es = require('event-stream');

var compare = es.map(function (data, hollaback) {
  request.get('http://localhost:3000', function (err, res, body) {
    if (!err) {
      var json_string = '{"id":"a5cbbefae3eab6beb3e161db9305dd00","key":["multibyteutf8json"],"value":{"russian_text":"А, Б, В, Г, Д, Е, Ё, Ж, З, И, Й, К, Л, М, Н, О, П, Р, С, Т, У, Ф, Х, Ц, Ч, Ш, Щ, Ъ, Ы, Ь, Э, Ю, Я"}}';
      if (json_string !== JSON.stringify(data)) {
        console.log('not equal');
        hollaback(null, JSON.stringify(data) + '\n');
      }
    }
  });
});

request.get('http://localhost:3000?iterations=10000')
  .pipe(couch_parser)
  .pipe(compare)
  .pipe(process.stdout)