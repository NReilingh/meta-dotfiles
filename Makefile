.PHONY: build/bin/dfi

build/bin/dfi:
	rm -rf build/bin
	mkdir -p build/bin
	dagger call release export --path=build/dagger-ci

.PHONY: test

test:
	dagger call coverage

.PHONY: ci

ci:
	dagger call run-ci

