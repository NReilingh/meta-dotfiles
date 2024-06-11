.PHONY: build/bin/dfi

build/bin/dfi:
	rm -rf build/bin
	mkdir -p build/bin
	dagger call release --source=.:source export --path=build/dagger-ci
	ln -s ../dagger-ci/dfi-darwin-arm64 build/bin/dfi

.PHONY: test

test:
	dagger call coverage --source=.:source

