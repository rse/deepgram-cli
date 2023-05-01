##
##  deepgram-cli -- Convert Voice to Text with Deepgram API
##  Copyright (c) 2023 Dr. Ralf S. Engelschall <rse@engelschall.com>
##  Licensed under MIT Open Source license.
##

all: build

bootstrap:
	@if [ ! -d node_modules ]; then npm install; fi

build: bootstrap
	linux npm run package

clean:
	npm run clean

distclean: clean

