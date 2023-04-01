import { parse } from "https://deno.land/std@0.181.0/flags/mod.ts";
import { join, common, relative, dirname } from "https://deno.land/std@0.181.0/path/mod.ts";

const HOME_PATH = Deno.env.get('HOME')!;
const STORE_PATH = join(HOME_PATH, '.files', 'store');
const ROOTFS_STORE = join(STORE_PATH, '.files', 'rootfs');

const parsedArgs = parse(Deno.args);

const command = parsedArgs._.shift();

switch (command) {
  case 'sync': {
    console.log("Sync command");

    // We only mutate the store if we are merging from upstream
    // or if there are changes from the mapped filesystem.
    //
    // But we pretty much always save changes from the mapped filesystem first;
    // merging from upstream only happens after syncing from local

    const map = await generate_map();

    compare_tree(map);

    await sync_store(map);

    break;
  }

  case 'add': {
    const path = parsedArgs._.shift();

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
    
    const storePath = (function () {
      const commonPath = common([HOME_PATH, realPath]);
      if (commonPath.length >= HOME_PATH.length) {
        console.log("Path is in homedir");

        const relativePath = relative(HOME_PATH, realPath);
        return join(STORE_PATH, relativePath);
      } else {
        console.log("Path is outside homedir");

        return join(STORE_PATH, '.files', 'rootfs', realPath);
      }
    })();

    console.log("Store path is", storePath);

    // Check if the destination directory already exists in the store
    // and create it if it doesn't
    //
    // This can be a recursive function that checks from the final directory up to the root
    // And creates the child directory once it finds a parent directory that exists

    const parentDir = dirname(storePath);
    // Check to see if parentDir exists
    const dirExists = (function () {
      try {
        const dirInfo = Deno.statSync(parentDir);
        if (dirInfo.isDirectory) {
          return true;
        } else {
          throw new Error("Path component is not a directory");
        }
      } catch (_e) {
        return false;
      }
    })();

    if (!dirExists) {
      console.log("Creating parent directory");
      try {
        Deno.mkdirSync(parentDir, { recursive: true });
      } catch (e) {
        console.error("Error creating parent directory in store");
        console.error(e);
        Deno.exit(1);
      }
    }

    console.log("Copying file to store");

    try {
      Deno.copyFileSync(realPath, storePath);
    } catch (e) {
      console.error("Error copying file to store");
      console.error(e);
      Deno.exit(1);
    }

    break;
  }

  case 'doom': {
    console.log("Madvillainy");
    break;
  }

  default: {
    console.log("Unknown command", command);
  }
}

interface FileMap {
  localFile: string,
  storeFile: string
}

type Map = Array<FileMap>;


async function generate_map (): Promise<Map> {
  console.log("generating map");

  async function recurseDir (dirPath: string): Promise<Map> {
    const storePath = relative(STORE_PATH, dirPath);

    const list: Map = [];
    const recurseJobs: Array<Promise<Map>> = [];

    console.log("recursing dir", dirPath);
    for await (const dirEntry of Deno.readDir(dirPath)) {
      const storeEntry = join(storePath, dirEntry.name);
      const dirEntryPath = join(dirPath, dirEntry.name);

      console.log("processing storeEntry", storeEntry);

      const excludePathList = [
        '.git',
        '.files/README.md',
      ];

      const excludeFileList = [
        '.DS_Store',
      ];

      if (excludePathList.includes(storeEntry)) {
        continue;
      }

      if (excludeFileList.includes(dirEntry.name)) {
        continue;
      }

      const isRootfs = common([ROOTFS_STORE, dirEntryPath]).length >= ROOTFS_STORE.length;

      // Figure out the relative path from the store to the file
      if (dirEntry.isFile && !isRootfs) {
        console.log("Adding file to list", storeEntry);
        list.push({
          localFile: join(HOME_PATH, storeEntry),
          storeFile: dirEntryPath,
        });
      } else if (dirEntry.isFile && isRootfs) {
        const rootfsPath = relative(ROOTFS_STORE, dirEntryPath);
        console.log("Adding rootfs file to list", rootfsPath);
        list.push({
          localFile: join('/', rootfsPath),
          storeFile: dirEntryPath,
        });
      } else if (dirEntry.isDirectory) {
        recurseJobs.push(recurseDir(join(dirPath, dirEntry.name)));
      }
    }
    const recurseResults = await Promise.all(recurseJobs);
    return [...list, ...recurseResults.flat()];
  }

  return await recurseDir(STORE_PATH);
}

function compare_tree (map: Map) {
  console.log("comparing store tree to local");

  console.log("actually don't do this lol");
  console.dir(map);
  // Check that each file exists and compare content hashes
  //  const fsFiles: Array<Deno.FsFile> = await Promise.all(map.map(e => {
  //   return Deno.open(e.localFile);
  // }));
  // console.dir(fsFiles);
}

async function sync_store (map: Map) {
  console.log("syncing store");

  try {
    await Promise.all(map.map(e => Deno.copyFile(e.localFile, e.storeFile)));
  } catch (e) {
    console.error("Error syncing store");
    console.error(e);
  }

  console.dir(map);
}
