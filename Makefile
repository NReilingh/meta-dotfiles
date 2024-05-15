.PHONY: build/dagger-ci/mf

build/dagger-ci/mf:
	dagger call run-ci --source=.:source export --path=build/dagger-ci

