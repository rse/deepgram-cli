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
            "[-m|--mode <mode>] " +
            "[-o|--output <output-file>] " +
            "[-f|--format <output-format>] " +
            "[-l|--language <input-language>] " +
            "[-k|--key <deepgram-api-key>] " +
            "[-M|--model <deepgram-model>] " +
            "[-V|--version <deepgram-version>] " +
            "[-T|--tier <deepgram-tier>] " +
            " <input-file>"
        )
        .help("h").alias("h", "help").default("h", false)
            .describe("h", "show usage help")
        .boolean("v").alias("v", "verbose").default("v", false)
            .describe("v", "print verbose messages")
        .string("m").nargs("m", 1).alias("m", "mode").default("m", "record")
            .describe("m", "processing mode (\"record\" or \"stream\")")
        .string("o").nargs("o", 1).alias("o", "output").default("o", "-")
            .describe("o", "output file")
        .string("f").nargs("f", 1).alias("f", "format").default("f", "txt")
            .describe("f", "output format (\"txt\", \"vtt+\", \"vtt\" or \"srt\")")
        .string("l").nargs("l", 1).alias("l", "language").default("l", "auto")
            .describe("l", "input language (\"auto\", \"en-US\", \"de\", etc.)")
        .string("k").nargs("k", 1).alias("k", "api-key").default("k", "")
            .describe("k", "deepgram API key [REQUIRED]")
        .string("M").nargs("M", 1).alias("M", "model").default("M", "general")
            .describe("M", "conversion model (\"global\", etc)")
        .string("V").nargs("V", 1).alias("V", "version").default("V", "")
            .describe("V", "conversion version (\"\", etc)")
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

    /*  instantiate Deepgram SDK  */
    if (argv.apiKey === "")
        argv.apiKey = process.env.DEEPGRAM_API_KEY ?? ""
    if (argv.apiKey === "")
        throw new Error("require Deepgram API key (via \$DEEPGRAM_API_KEY env-variable or CLI-option \"-k\")")
    const deepgram = new Deepgram(argv.apiKey)

    /*  dispatch according to mode  */
    if (!argv.mode.match(/^(?:record|stream)$/))
        throw new Error("invalid processing mode")
    if (argv.mode === "record") {
        verbose(`++ calling ${chalk.bold("Deepgram API")} for (pre-)recorded media`)

        /*  determine conversion source  */
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
        if (argv.version !== "")
            options.version = argv.version
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
        const response = await deepgram.transcription.preRecorded(source, options)

        /*  generate output  */
        verbose("++ generating output")
        verbose(`-- output file: ${chalk.blue(argv.output)}`)
        verbose(`-- output format: ${chalk.blue(argv.format)}`)
        let output = ""
        const makeTime = (time) =>
            new Date(time * 1000).toISOString().substr(11, 12)
        if (argv.format === "txt") {
            for (let i = 0; i < response.results.utterances.length; i++) {
                const utterance = response.results.utterances[i]
                output += `${utterance.transcript}\n`
            }
        }
        else if (argv.format === "vtt+") {
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
                output += `${i + 1}\n`
                output += `${start} --> ${end}\n`
                output += `${utterance.transcript}\n\n`
            }
        }
        else if (argv.format === "srt") {
            for (let i = 0; i < response.results.utterances.length; i++) {
                const utterance = response.results.utterances[i]
                const start = makeTime(utterance.start).replace(".", ",")
                const end   = makeTime(utterance.end).replace(".", ",")
                output += `${i + 1}\n`
                output += `${start} --> ${end}\n`
                output += `${utterance.transcript}\n\n`
            }
        }
        if (argv.output === "-")
            process.stdout.write(output)
        else
            await fs.promises.writeFile(argv.output, output, { encoding: "utf8" })
    }
    else if (argv.mode === "stream") {
        throw new Error("TODO: streaming still not implemented")
    }
})().catch((err) => {
    /*  report error  */
    process.stderr.write(chalk.red(`deepgram: ERROR: ${err}\n`))
    process.exit(1)
})

