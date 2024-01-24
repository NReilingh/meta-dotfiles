// import { type Args, dangerousCopyFileSync } from '../core.ts';
import { Args, Command } from '@effect/cli';
import { Console, Effect } from 'effect';
// import { engine } from '../wat.ts';

const path = Args.path();

export default Command.make('add', { path }, ({ path }) => Effect.sync(() => {
  console.log('this is inside an effect');
  console.log("this is also inside an effect");
}));
//   Console.log(`Hello from add command. The path is ${path}`);
//
// Console.log(`Hello from add command. The path is ${path}. Again.`);
//
// engine.subscribe({ complete: () => Console.log("something completed"),
// error: (e) => Console.log("something errored", e),
// next: (e) => Console.log("something happened", e) });
// engine.start();
// engine.send({ type: 'storeChecked'});
// export default function add (parsedArgs: Args) {
//   const { LOCAL_STORE } = globalThis;
//
//   const path = parsedArgs.shift();
//
//   if (!path) {
//     console.log("Path required");
//     Deno.exit(1);
//   }
//
//   console.log("Add command");
//   // Determine if the path is relative to the homedir or not.
//   // If it is relative to the homedir, then add it to the store,
//   // and if it is outside the homedir, add it inside the .files/rootfs dir inside the store.
//
//   // Parse path as string
//   if (typeof path !== 'string') {
//     console.log("Path must be a string");
//     Deno.exit(1);
//   }
//
//   const realPath = (function () {
//     try {
//       return Deno.realPathSync(path);
//     } catch (e) {
//       console.error("Path not found:", path);
//       console.error(e);
//       Deno.exit(1);
//     }
//   })();
//
//   const storePath = LOCAL_STORE.storeLocation(realPath);
//
//   console.log("Store path is", storePath);
//
//   dangerousCopyFileSync(realPath, storePath);
// }
