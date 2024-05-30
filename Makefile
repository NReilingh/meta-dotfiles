.PHONY: build/dagger-ci/mf

build/dagger-ci/mf:
	dagger call release --source=.:source export --path=build/dagger-ci

.PHONY: test

test:
	dagger call coverage --source=.:source

