import { Command } from '@effect/cli';
import { Console } from 'effect';

export default Command.make('init', {}, () => Console.log("Hello from init command"));

function proceed (condition: string) {
  const result = confirm(condition);

  if (!result) {
    console.log("Aborting");
    process.exit(0);
  }
}

// export default function init () {
//   alert("Initialize a git repo at ~/.files/store/dotfiles");
//
//   proceed("Repo initialized?");
//
//   alert("Do git clone -o primary ~/.files/store/dotfiles ~/.files/store/master");
//
//   proceed("Repo cloned and on master branch?");
//
//   alert("Create init tag at initial commit");
//
//   proceed("Tag created and pushed to primary?");
//
//   alert("Create local branch with hostname");
//
//   proceed("Local branch created and pushed to primary?");
//
//   alert("In secondary, do git worktree add ../local $HOSTNAME");
//
//   proceed("Worktree created?");
//
//   alert("metafiles init complete");
// }
//
