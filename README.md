
deepgram-cli
============

**Convert Voice to Text with Deepgram API**

<p/>
<img src="https://nodei.co/npm/deepgram-cli.png?downloads=true&stars=true" alt=""/>

<p/>
<img src="https://david-dm.org/rse/deepgram-cli.png" alt=""/>

Abstract
--------

This is a small Node.js-based Command-Line Interface (CLI) for
converting Voice to Text with the excellent Deepgram API. It can be used
to generate plain text output or WebVTT or SRT caption/subtitle outputs.

Installation
------------

```
$ npm install -g deepgram-cli
```

Usage
-----

```
# ensure the CLI has access to the Deepgram API
$ export DEEPGRAM_API_KEY="[...]"
```

```
# generate SRT captions/subtitles
$ deepgram -f srt https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav
1
00:00:05,440 --> 00:00:05,940
Yep.

2
00:00:07,095 --> 00:00:09,115
I said it before and I'll say it again.

3
00:00:09,975 --> 00:00:11,514
Life moves pretty fast.

4
00:00:11,975 --> 00:00:15,701
You don't stop and look around once in a while. You could miss it.
```

```
$ deepgram -f vtt sample.ogg
WEBVTT

1
00:00:00.999 --> 00:00:05.937
Herzlich willkommen zu einer Aufzeichnung meiner Präsentation anlässlich der Software Engineering Konferenz zweitausenddreiundzwanzig

2
00:00:06.756 --> 00:00:07.536
in Paderborn.

3
00:00:08.184 --> 00:00:09.364
Das Thema multimediale

4
00:00:09.784 --> 00:00:17.451
Didaktik für Software Engineering. Also wie kann man in der Lehre von Software Engineering auf der didaktischen Seite von Multimedia

5
00:00:18.550 --> 00:00:19.050
profitieren.
```

License
-------

Copyright (c) 2023 Dr. Ralf S. Engelschall (http://engelschall.com/)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

