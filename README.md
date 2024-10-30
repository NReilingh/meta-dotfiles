# meta-dotfiles

This is a dotfiles manager.

It does not work yet.

It is designed around these principles:

* Purity
  * No symlinks between deployment location and storage location for managed files.

* Visiblity
  * All state is stored in a git repository on (e.g.) GitHub.
  * The repo is organized so that it presents as a conventional "dotfiles" repo,
    where the root of the repo is analogous to the user's home directory.
  * Each machine has a branch which tracks its own history; the repo's master
    branch represents a canonical line of history.

* Simplicity
  * Configuration should be minimal, and only necessary when deviating from sane defaults.

* Flexibility
  * A machine may deploy only a subset of the canonical repository. This is to be
    defined by configuration files, comments in the canonical stored representation,
    or both.

* Clarity
  * Configuration should be well-organized and intuitive.

## Usage

`dfi sync` - Download, merge, and upload changes in managed files.

`dfi add` - Add a file to the list of managed files.

`dfi init` - Initialize a local dotfiles repository.

`dfi inherit` - Inherit the history of another machine. Intended for setting up
a new machine that replaces an old machine with a different hostname.

`dfi merge` - Resume a sync that requires conflict resolution.

## Development

This initial implementation is written in effect-cli for the Bun JavaScript runtime.
Bun's JavaScriptCore runtime is said to boot faster than V8,
making it a better fit for command-line tools.

I find Effect.ts compelling, and am also using this project
as an opportunity to learn TypeScript, Effect.ts, and effect-cli.

Development goals are 100% test coverage and a complete CI/CD implementation.
We are of course leveraging GitHub Actions,
but using Dagger for platform-agnosticity.

RenovateBot with automerge on passing tests
is used for keeping dependencies current.
Renovate
