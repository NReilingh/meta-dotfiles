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

`dfi init` - Initialize a local dotfiles repository
and optionally push it to a remote.
Conventionally this will be a git and GitHub by default,
but other repository types (pijul?) may be supported in the future.
Under usual circumstances, a user should only need to do this once, ever,
across all machines and platforms, unless a completely clean slate is desired.

`dfi join` - Join an existing dotfiles repository by cloning it from a remote.
Intended to be the standard practice for setting up a new machine.
Will deploy dotfiles (to the local filesystem) after cloning.

`dfi join --inherit` - Join an existing dotfiles repository
and inherit the history of another machine.
Intended for setting up a new machine that replaces an old machine with a different hostname.
The code repository will model this "inheritance" as establishing
the new machine's branch at the old machine's branch head,
as opposed to the canonical master branch.

`dfi add` - Add a file or folder to the list of managed files.
If file paths are specified with a wildcard pattern,
keep in mind the shell will expand these to individual files to be added.
If a folder is added, this will be saved in the store's configuration
and future files will be synced automatically.

`dfi sync` - Download, merge, and upload changes in managed files.
The repository is always fetched first if possible,
and local changes are always uploaded to the machine's tracking branch (shadow store),
even if merge conflicts prevent synchronizing the canonical branch (common store).

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
Renovate will apply updates to the `renovate` branch
to keep `master` from getting too noisy.
After merging `renovate`'s HEAD to `master`,
this HEAD should be fast-forwarded to the merge commit.

### Architecture

Effect-cli is used to define the command-line interface,
and its Effects are powered by XState actors.
The store is implemented with an abstraction,
so that all activities are agnostic as to
whether the store is implemented with git, pijul, or some other VCS.
(However, all stores must support git-like features such as branching and remotes.)

XState machine is modeled in Stately.ai as a [public project](https://stately.ai/registry/editor/260b40c1-b571-4090-9a38-342500d72cee).

### User Experience

It should be possible to initiate all commands non-interactively,
assuming no merge conflicts require resolution.
Simultaneously, initiating a command with minimal arguments
should prompt the user for any missing or ambiguous information.

