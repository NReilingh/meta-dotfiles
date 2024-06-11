import { generate_map, compare_tree, sync_store } from "../core.ts";
import { Command } from '@effect/cli';
import { Console } from 'effect';

export default Command.make('sync', {}, () => Console.log("Hello from sync command"));

// export default async function sync () {
//   const { LOCAL_STORE, MASTER_STORE } = globalThis;
//
//   console.log("Sync command");
//
//   // We only mutate the store if we are merging from upstream
//   // or if there are changes from the mapped filesystem.
//   //
//   // But we pretty much always save changes from the mapped filesystem first;
//   // merging from upstream only happens after syncing from local
//
//   const localMap = await generate_map(LOCAL_STORE);
//
//   compare_tree(localMap);
//
//   await sync_store(localMap);
//
//   alert("Do git commit of local worktree: pre-sync");
//
//   alert("checkout init commit on primary with git checkout tags/init");
//
//   alert("Push commit to primary and push from primary to origin");
//
//   alert("Pull master from origin to primary: git checkout master, git pull");
//
//   alert("Pull master from primary to secondary: cd master; git pull");
//
//   alert("Derive mapping from master");
//   const masterMap = await generate_map(MASTER_STORE, LOCAL_STORE);
//
//   alert("Figure out what patch from master will be applied to main mapping");
//
//   alert("Commit copies of existing files from the new mapping to the local worktree");
//
//   alert("Do dfi merge");
// }
//
