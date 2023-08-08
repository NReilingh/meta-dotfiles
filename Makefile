build/bin/mf: src/main.ts
	mkdir -p build/bin
	deno task compile
