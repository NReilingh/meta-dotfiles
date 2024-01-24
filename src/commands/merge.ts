import { Command } from '@effect/cli';
import { Console } from 'effect';

export default Command.make('merge', {}, () => Console.log("Hello from merge command"));

// export default function merge () {
//   alert("Check to see whether conflicts exist from a merge of the files on master");
//
//   alert("Resolve conflicts if there are any");
//
//   alert("Patch the local worktree with the new files from master");
//
//   alert("Commit the patched files to the local worktree");
//
//   alert("Push the updated worktree to the primary and origin");
// }
//
