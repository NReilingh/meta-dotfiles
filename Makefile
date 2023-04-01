build/bin/mf: main.ts
	mkdir -p build/bin
	deno compile -A -o build/bin/mf main.ts
