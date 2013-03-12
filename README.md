# Nodejs Streaming JSON Parsers & UTF8 Multibyte Characters

this repo demos a subtle utf8 bug I found in 2 popular nodejs streaming json parsers, and I
recently found may be an issue with mikeal/request (still investigating a solution)

## Reproduce it

To see this bug in action, clone out this repo, run the server in the background, and run the client scripts

```
  git clone git@github.com:jlank/streaming-jsonparsers-utf8-bug-demo.git
  npm install
  ./server_fake_couch.js &
  ./client_compare_json.js http <-- works fine (if encoding is set, otherwise it errors)
  ./client_compare_json.js file <-- works fine (if encoding is set, otherwise it errors)
  ./client_compare_json.js request <-- should error here
  ./client_compare_json.js request-patched <-- should not error here
```

* The first client invocation will run a query against the `http` streaming server (which responds with a fake couchdb view)
and returns 40k rows.
* The second client invocation does the same thing but with a `file` system stream.
* The third client invocation does the same thing but with an `http` stream returned from the mikea/request module.
* The fourth client invocation does the same thing but with an `http` stream returned from the mikea/request module with my tiny patch

In the case that you don't specify an encoding, the stream chunks at some random point in the buffer,
and cause a json object to be chunked in the middle of a string, if this occurs on a utf8 character with
multiple bytes (they can have up to 4), in this demo you will see a � character
and an error will print to the screen.  It isn't always exact or consistent so if you don't see it on the first run, try again.

The client/server demo replicates what I was experiencing, if you want to just test the bug directly
by chopping up a buffer and writing it to each parser, run `parser_tests.js`

```
  ./parser_tests.js jsonparse
  ./parser_tests.js clarinet
```

and if you want to test how it works with my proposed patch which checks for broken chunks of utf8

```
  ./parser_tests.js jsonparse-patched
  ./parser_tests.js clarinet-patched (not implemented yet)
```

## The Story

I came across this bug when I was transferring utf8 encoded json in and out of couchdb, using some
scripts written with nodejs.  I used the awesome [JSONStream](https://github.com/dominictarr/JSONStream) module
written by [@dominictarr](https://twitter.com/dominictarr) to do the deed with the greatest of ease.
Upon a QA check of the resulting data set I noticed that somehow the "replacement character" (U+FFFD)
had been littered randomly throughout my data set.
The only pattern I could see initially was that the affected items were all in language (russian, arabic, chinese, etc..).
At this point, I began investigating...  was it my script? was it nano? was it request? was it JSONStream?

It turned out to be [jsonparse](https://github.com/creationix/jsonparse) by the talented [@creationix](http://twitter.com/creationix)
(which JSONStream depends on). This discovery lead me on a little journey to fix a bug, learn more about utf8, and afterwards,
use my newfound knowledge to identify the same issue in [@dscape](http://twitter.com/dscape)'s [clarinet](https://github.com/dscape/clarinet) module.
This bug may be lurking in other streaming json modules too, so if you know of one, let me know or check it out yourself.


## Fix it

The fix for this bug is to be a little smarter about how stream chunks are handled when strings
and characters are flying through in buffers. My solution was to have 3 tiny temp buffers, detect
if a character is multi-byte, and reconstruct the full characters across `stream.write(chunk)` events before
calling `.toString()`; aka when they should _actually_ be converted to a string by the parser.
I wrote pull requests for both of these modules to fix this, I know streams2 just landed so maybe
there is a better way to leverage the read() method to pull smaller chunks.

Additionally for mikeal/request I propose the ability to specify the encoding of a request, even if it is being
streamed.  IMO if a developer specifies the encoding of a stream, the onus is on them to make sure every
pipe downstream handles the buffer or string correctly, since they made a deliberate (and necessary choice) to do so.

In summation, I'm guiding my fix based on the Unix Philosophy (Rule of Repair)[http://www.faqs.org/docs/artu/ch01s06.html#id2878538]
> Postel's Prescription:[10] “Be liberal in what you accept, and conservative in what you send”.
> Postel was speaking of network service programs, but the underlying idea is more general.
> Well-designed programs cooperate with other programs by making as much sense as they can from
> ill-formed inputs; they either fail noisily or pass strictly clean and correct data to the next program in the chain.

In my case, I found a small bug that "quietly cause[d] corruption that [didn't] show up until much later." which sucked.  I think
the fix is to be cognizant of the potential breakage at the source of a stream, and for anyone handling it downstream.

## TODO
This repo is part of a blog post I wrote up on the issue, if you want the full scoop, go read it: http://jlank.com/...not done

I also (want to write) a module to do this automatically so it can be a drop in to a module if someone needed it...