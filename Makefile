build/bin/mf: src/main.ts
	mkdir -p build/bin
	bun run compile
