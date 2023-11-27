# meta-dotfiles

This is a dotfiles manager.

It does not work yet.

It is designed around these principles:

* No symlinks between deployment location and storage location for managed files.
* All state is stored in a git repository on (e.g.) GitHub where the root of
the repo is analogous to a user home directory.
* Each machine has a branch which tracks its own history; the repo's master
branch represents the canonical line of history.
* Configuration should be minimal, and only necessary when deviating from sane defaults.
* A machine may deploy only a subset of the canonical repository. This is to be
defined by configuration files, comments in the canonical stored representation,
or both.
* Using configuration to map between deployment and storage should be kept to a
minimum; favoring entire directory locations over single file mappings.

## Usage

`mf sync` - 
