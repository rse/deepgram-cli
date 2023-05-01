
# deepgram(1) -- CLI for converting Voice to Text with Deepgram API (and DeepL API)

## SYNOPSIS

`deepgram`
\[`-e`|`--execute` *rule*\]
*program*
\[*argument* ...\]

## DESCRIPTION

`deepgram`(1) is a small Command-Line Interface (CLI) for converting
Voice to Text (VTT) with the excellent AI-based **Deepgram** API. It can
be used to generate plain text output or WebVTT/SRT caption/subtitle
outputs. The sentences in the output can be optionally translated to a
different language with the awesome AI-based **DeepL** API.

## OPTIONS

The following command-line options and arguments exist:

- \[`-h`|`--help`*\]:
  Display usage information on `stdout`.

- \[`-v`|`--verbose`\]:
  Display verbose processing information on `stderr`.

- \[`-o`|`--output` *output-file*\]:
  Set output file for plain text or WebVTT/SR caption/subtitle outputs.

- \[`-f`|`--format` *output-format*\]:
  Set output format: either `txt` for plain text output, `vtt+` for a
  custom *WebVTT* output where each word is highlighted, `vtt` for a
  regular *WebVTT* output, or `srt` for a *SubRip* output. The *WebVTT*
  variants are intended to be used with Web media players while *SubRip*
  is intended to be used with *Adobe Premiere* or *YouTube Studio*.

- \[`-l`|`--language` *input-language*\]:
  Set the language of voice in the *input-file*.
  When not set, **Deepgram** perhaps a reasonable auto-detection.
  See https://developers.deepgram.com/documentation/features/language/
  for more details on supported languages.

  Notice: Some languages need special model and/or tier companion
  options. For instance, for English input, just use `-l en-US -M
  general -T nova`, while for German input use `-l de -M general -T
  enhanced` instead.

- \[`-t`|`--translate` *output-language*\]:
  Set the language of the text in the *output-file*. When not set,
  **DeepL** is not used at all and a plain Voice to Text (VTT)
  conversion is performed. See https://www.deepl.com/docs-api/translate-text/markup/
  for details.

  Notice: For translating to English, use `-t en-US` or `-t en-GB`.
  For translating to German, use `-t de` instead.

- \[`-M`|`--model` *deepgram-model*\]:
  Set the **Deepgram** model to be used.
  See https://developers.deepgram.com/documentation/features/model/ for details.
  Usually, you want to use `general` as it is a decent model.

- \[`-T`|`--tier` *deepgram-tier*\]:
  Set the **Deepgram** tier to be used.
  See https://developers.deepgram.com/documentation/features/tier/ for details.
  Usually, `nova` is the best tier, but not available for all languages.
  Then there is a variant of OpenAI's Whisper under the names
  `whisper-medium` or `whisper-large`. Finally, there
  is the good `enhanced` and decent `base`, the older tiers.

- \[`-O`|`--options` *deepgram-options*\]:
  Set arbitrary **Deepgram** API options.
  See https://developers.deepgram.com/documentation/ for details.
  For instance, you can use `-O version=beta` to select a beta version of the model.

- *input-file*:
  Input audio or video file or URL.

## EXAMPLES

First, ensure the `deepgram`(1) CLI has access to your **Deepgram** API key
and optionally also to your **DeepL** API key:

```
$ export DEEPGRAM_API_KEY="[...]" # mandatory
$ export DEEPL_API_KEY="[...]"    # optional
```

Then generate english subtitles in SRT format for a remotely available
demonstraton WAV file (containing english voice):

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

Then generate german subtitles in WebVTT format for a locally available
Ogg file (containing german voice):

```
$ deepgram -f vtt -l de -T enhanced sample.ogg
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

Then generate english subtitles in WebVTT format for a locally available
Ogg file (containing german voice):

```
$ deepgram -f vtt -l de -T enhanced -t en-US sample.ogg
WEBVTT

1
00:00:00.999 --> 00:00:05.937
Welcome to a recording of my presentation on the occasion of the Software Engineering Conference two thousand and three

2
00:00:06.756 --> 00:00:07.536
in Paderborn.

3
00:00:08.184 --> 00:00:09.364
The topic of multimedia

4
00:00:09.784 --> 00:00:17.451
Didactics for Software Engineering. So how can you teach software engineering on the didactic side of multimedia.

5
00:00:18.550 --> 00:00:19.050
benefit.
```

## HISTORY

The `deepgram`(1) utility was developed in April 2023 as a simple
Command-Line Interface (CLI) to the **Deepgram** API (and companion
**DeepL** API) to allow the author to create SRT/VTT subtitles for his
videos, containing either german and english voice.

## AUTHOR

Dr. Ralf S. Engelschall <rse@engelschall.com>

