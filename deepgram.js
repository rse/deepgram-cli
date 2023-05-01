#!/usr/bin/env node
/*!
**  deepgram-cli -- Convert Voice to Text with Deepgram API
**  Copyright (c) 2023 Dr. Ralf S. Engelschall <rse@engelschall.com>
**  Licensed under MIT Open Source license.
*/

/*  internal requirements  */
const fs            = require("node:fs")

/*  external requirements  */
const dotenv        = require("dotenv")
const yargs         = require("yargs")
const chalk         = require("chalk")
const tmp           = require("tmp")
const { Deepgram }  = require("@deepgram/sdk")
const DeepL         = require("deepl-node")
const mimeTypes     = require("mime-types")
const fileType      = require("file-type")
const getStream     = require("get-stream")

/*  act in an asynchronous context  */
;(async () => {
    /*  load environment variables  */
    dotenv.config()

    /*  command-line option parsing  */
    const argv = yargs
        /* eslint indent: off */
        .usage("Usage: $0 " +
            "[-h|--help] " +
            "[-v|--verbose] " +
            "[-o|--output <output-file>] " +
            "[-f|--format <output-format>] " +
            "[-l|--language <input-language>] " +
            "[-t|--translate <output-language>] " +
            "[-M|--model <deepgram-model>] " +
            "[-T|--tier <deepgram-tier>] " +
            "[-O|--options <deepgram-options>] " +
            "<input-file>"
        )
        .help("h").alias("h", "help").default("h", false)
            .describe("h", "show usage help")
        .boolean("v").alias("v", "verbose").default("v", false)
            .describe("v", "print verbose messages")
        .string("o").nargs("o", 1).alias("o", "output").default("o", "-")
            .describe("o", "output file")
        .string("f").nargs("f", 1).alias("f", "format").default("f", "txt")
            .describe("f", "output format (\"txt\", \"vtt+\", \"vtt\" or \"srt\")")
        .string("l").nargs("l", 1).alias("l", "language").default("l", "auto")
            .describe("l", "input language (\"auto\", \"en-US\", \"de\", etc.)")
        .string("t").nargs("t", 1).alias("t", "translate").default("t", "none")
            .describe("t", "translation language (\"none\", \"en\", \"de\", etc.)")
        .string("M").nargs("M", 1).alias("M", "model").default("M", "general")
            .describe("M", "conversion model (\"global\", etc)")
        .string("T").nargs("T", 1).alias("T", "tier").default("T", "nova")
            .describe("T", "conversion tier (\"nova\", etc)")
        .string("O").nargs("O", 1).alias("O", "options").default("O", "")
            .describe("O", "conversion options (\"sentiment=true\", etc)")
        .version(false)
        .strict()
        .showHelpOnFail(true)
        .demand(1)
        .parse(process.argv.slice(2))

    /*  verbose message printing  */
    const verbose = (msg) => {
        if (argv.verbose)
            process.stderr.write(`${msg}\n`)
    }

    /*  sanity check input  */
    if (argv._.length !== 1)
        throw new Error("require input file")

    /*  instantiate Deepgram API SDK  */
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY ?? ""
    if (deepgramApiKey === "")
        throw new Error("require Deepgram API key (via \$DEEPGRAM_API_KEY environment variable)")
    const deepgram = new Deepgram(deepgramApiKey)

    /*  instantiate DeepL API SDK (optional)  */
    let translator = null
    if (argv.translate !== "none") {
        const deeplApiKey = process.env.DEEPL_API_KEY ?? ""
        if (deeplApiKey === "")
            throw new Error("require DeepL API key (via \$DEEPL_API_KEY environment variable)")
        translator = new DeepL.Translator(deeplApiKey)
    }

    /*  determine conversion source  */
    verbose("++ reading input")
    const source = {}
    if (argv._[0].match(/^https?:\/\/.+$/)) {
        verbose(`-- remote input: URL (${chalk.blue(argv._[0])})`)
        source.url = argv._[0]
    }
    else if (argv._[0] === "-") {
        verbose(`-- local input: stdin`)
        const buffer = await getStream.buffer(process.stdin)
        const mimetype = (await fileType.fromBuffer(buffer))?.mime ?? "application/octet-stream"
        source.buffer   = buffer
        source.mimetype = mimetype
    }
    else {
        verbose(`-- local input: file (${chalk.blue(argv._[0])})`)
        const buffer = await fs.promises.readFile(argv._[0], { encoding: null })
        let mimetype = (await fileType.fromBuffer(buffer))?.mime ?? ""
        if (mimetype === "")
            mimetype = mimeTypes.lookup(argv._[0])
        source.buffer   = buffer
        source.mimetype = mimetype
    }

    /*  determine conversion options  */
    const options = {
        model:      argv.model,
        tier:       argv.tier,
        punctuate:  true,
        utterances: true
    }
    if (argv.language === "auto")
        options.detect_language = true
    else
        options.language = argv.language
    if (argv.options !== "") {
        for (const option of argv.options.split(/,/)) {
            let m
            if ((m = option.match(/^(\S+)=(\S+)$/)) === null)
                throw new Error("invalid option specification")
            let [ , key, val ] = m
            if      (val === "true")                       val = true
            else if (val === "false")                      val = false
            else if (val.match(/^\d+$/))                   val = parseInt(val)
            else if (val.match(/^(?:\d*\.\d+|\d+\.\d*)$/)) val = parseFloat(val)
            options[key] = val
        }
    }
    for (const [ key, val ] of Object.entries(options))
        verbose(`-- conversion ${key}: ${chalk.blue(val)}`)

    /*  call Deepgram API  */
    verbose(`++ calling ${chalk.bold("Deepgram API")}`)
    const response = await deepgram.transcription.preRecorded(source, options)

    /*  generate output  */
    verbose("++ writing output")
    verbose(`-- output file: ${chalk.blue(argv.output)}`)
    verbose(`-- output format: ${chalk.blue(argv.format)}`)
    let output = ""
    const makeTime = (time) =>
        new Date(time * 1000).toISOString().substr(11, 12)
    const translate = async (text) => {
        const result = await translator.translateText(text, argv.language.replace(/-.+$/, ""), argv.translate, {
            splitSentences: "off"
        })
        return (result?.text ?? text)
    }
    if (argv.format === "txt") {
        for (let i = 0; i < response.results.utterances.length; i++) {
            const utterance = response.results.utterances[i]
            let text = utterance.transcript
            if (argv.translate !== "none")
                text = await translate(text)
            output += `${text}\n`
        }
    }
    else if (argv.format === "vtt+") {
        if (argv.translate)
            throw new Error("sorry, VTT+ is not supported in combination with translation")
        output += "WEBVTT\n\n"
        let i = 1
        for (const utterance of response.results.utterances) {
            let transcript = utterance.transcript.split(/\s+/)
            let j = 0
            for (const word of utterance.words) {
                const start = makeTime(word.start)
                const end   = makeTime(word.end)
                output += `${i++}\n`
                output += `${start} --> ${end}\n`
                const text = [ ...transcript ]
                text[j] = `<b>${text[j]}</b>`
                output += `${text.join(" ")}\n\n`
                j++
            }
        }
    }
    else if (argv.format === "vtt") {
        output += "WEBVTT\n\n"
        for (let i = 0; i < response.results.utterances.length; i++) {
            const utterance = response.results.utterances[i]
            const start = makeTime(utterance.start)
            const end   = makeTime(utterance.end)
            let text = utterance.transcript
            if (argv.translate !== "none")
                text = await translate(text)
            output += `${i + 1}\n`
            output += `${start} --> ${end}\n`
            output += `${text}\n\n`
        }
    }
    else if (argv.format === "srt") {
        for (let i = 0; i < response.results.utterances.length; i++) {
            const utterance = response.results.utterances[i]
            const start = makeTime(utterance.start).replace(".", ",")
            const end   = makeTime(utterance.end).replace(".", ",")
            let text = utterance.transcript
            if (argv.translate !== "none")
                text = await translate(text)
            output += `${i + 1}\n`
            output += `${start} --> ${end}\n`
            output += `${text}\n\n`
        }
    }
    if (argv.output === "-")
        process.stdout.write(output)
    else
        await fs.promises.writeFile(argv.output, output, { encoding: "utf8" })
})().catch((err) => {
    /*  report error  */
    process.stderr.write(chalk.red(`deepgram: ERROR: ${err}\n`))
    process.exit(1)
})

