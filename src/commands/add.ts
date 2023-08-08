import { type Args, dangerousCopyFileSync } from '../core.ts';

export default function add (parsedArgs: Args) {
  const { LOCAL_STORE } = globalThis;

  const path = parsedArgs.shift();

  if (!path) {
    console.log("Path required");
    Deno.exit(1);
  }

  console.log("Add command");
  // Determine if the path is relative to the homedir or not.
  // If it is relative to the homedir, then add it to the store,
  // and if it is outside the homedir, add it inside the .files/rootfs dir inside the store.

  // Parse path as string
  if (typeof path !== 'string') {
    console.log("Path must be a string");
    Deno.exit(1);
  }

  const realPath = (function () {
    try {
      return Deno.realPathSync(path);
    } catch (e) {
      console.error("Path not found:", path);
      console.error(e);
      Deno.exit(1);
    }
  })();

  const storePath = LOCAL_STORE.storeLocation(realPath);

  console.log("Store path is", storePath);

  dangerousCopyFileSync(realPath, storePath);
}
