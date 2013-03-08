# Nodejs Streaming JSON Parsers & UTF8 Multibyte Characters

this repo demos a subtle utf8 bug I found in 2 popular nodejs streaming json parsers.

## Background

I came across this bug when I was transferring utf8 encoded json in couchdb, using
scripts written with nodejs.  I used the awesome `JSONStream` module by @dominictarr to
chunk & stream a couch response with the greatest of ease.  After doing a QA check,
I noticed some objects having strings in language (russian, arabic, chinese, etc..)
somehow now had the "replacement character" (U+FFFD) better known as � the Riddler's calling card.
At this point, I began investigating... was it my script? was it nano? was it request? was it JSONStream?

Nope, it was `jsonparse`. (which JSONStream depends on)  This lead me on a little journey
to discover a bug, and afterwards, I used my new found knowledge of utf8 multi-byte characters to
identify the same issue in @dscape's `clarinet` module.  It may be lurking in others too, if you
know of one, let me know or check it out yourself.

I have a full write up on this on my blog, this repo is part of that, if you want the full scoop,
go read it: http://jlank.com/post

## Reproduction

To see this bug in action, clone out this repo and run the server, and run the client script.

```
  git clone git@github.com/jlank/....
  ./server_fake_couch.js
  ./client_compare_json.js http
  ./client_compare_json.js file
```

* The first client invocation will run a query against the `http` streaming server (which responds with a fake couchdb view)
and returns 10k rows.
* The second client invocation does the same thing but with a `file` system stream.

In both cases, the stream chunks at some point buffer slightly, and cause a json object to be partially sent,
if this occurs on a utf8 character with multiple bytes (they can have up to 4), you will soon see a � character
and an error will print to the screen.  It isn't always exact so if you don't see it on the first run, try again.

The client/server demo replicates what I was experiencing, if you want to just test the bug directly
by chopping up a buffer and writing it to each parser, run `parser_tests.js`

```
  ./parser_tests.js jsonparse
  ./parser_tests.js clarinet
```

## Fix

The fix for this bug is to be a little smarter about how stream chunks are handled when strings
and characters are flying through in buffers. My solution was to have 3 tiny temp buffers, detect
if a character is multi-byte, and reconstruct the full characters across `stream.write(chunk)` events before
calling `.toString()`; aka when they should _actually_ be converted to a string by the parser.
I wrote pull requests for both of these modules to fix this, I know streams2 just landed so maybe
there is a better way to leverage the read() method to pull smaller chunks.

## TODO
I also wrote a module to do this automatically...