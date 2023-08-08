import { join, common, relative, dirname } from "std/path/mod.ts";

export class Store {
  constructor (
    public readonly path: string,
  ) {}

  get fsRoot () {
    return join(this.path, '.files', 'fsroot');
  }

  storeLocation (realPath: string) {
    const { USER_HOME } = globalThis;

    const inHomedir = common([USER_HOME, realPath]).length >= USER_HOME.length;
    if (inHomedir) {
      console.debug("Path is in homedir");

      const relativePath = relative(USER_HOME, realPath);
      return join(this.path, relativePath);
    } else {
      console.debug("Path is outside homedir");

      return join(this.fsRoot, realPath);
    }
  }
}

export class StoreFile {
  constructor (
    public readonly storePath: string,
    public readonly store: Store,
  ) {}

  get realPath () {
    return join(this.store.path, this.storePath);
  }

  get hostPath () {
    if (this.isOutsideHomedir) {
      return join('/', relative(this.store.fsRoot, this.realPath));
    } else {
      return join(globalThis.USER_HOME, this.storePath);
    }
  }

  get isOutsideHomedir () {
    return common([this.store.fsRoot, this.realPath]).length >= this.store.fsRoot.length;
  }
}

export type Args = Array<string|number>;

interface FileMap {
  localFile: string,
  storeFile: string,
}

type Map = Array<FileMap>;

export async function generate_map (fromStore: Store, relativeTo?: Store): Promise<Map> {
  const targetStore = relativeTo ?? fromStore;

  console.log("generating map from store", fromStore.path);

  async function mapFromStorePathRecursive (dirPath: string): Promise<Map> {
    const dirPathRelativeToStore = relative(fromStore.path, dirPath);

    const list: Map = [];
    const recurseJobs: Array<Promise<Map>> = [];

    console.debug("recursing dir", dirPath);

    for await (const dirEntry of Deno.readDir(dirPath)) {
      const storeEntry = join(dirPathRelativeToStore, dirEntry.name);
      const dirEntryPath = join(dirPath, dirEntry.name);

      console.debug("processing storeEntry", storeEntry);

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

      if (dirEntry.isFile) {
        const storeFile = new StoreFile(storeEntry, fromStore);

        console.debug("Adding file to list", storeEntry);
        list.push({
          localFile: storeFile.hostPath,
          storeFile: targetStore.storeLocation(storeFile.hostPath),
        });
      } else if (dirEntry.isDirectory) {
        recurseJobs.push(mapFromStorePathRecursive(dirEntryPath));
      }
    }
    const recurseResults = await Promise.all(recurseJobs);
    return [...list, ...recurseResults.flat()];
  }

  return await mapFromStorePathRecursive(fromStore.path);
}

export async function sync_store (map: Map) {
  console.log("syncing store");
  
  console.dir(map);

  try {
    await Promise.all(map.map(e => Deno.copyFile(e.localFile, e.storeFile)));
  } catch (e) {
    console.error("Error syncing store");
    console.error(e);
  }
}

export function compare_tree (_: Map) {
  console.log("comparing store tree to local");

  console.log("actually don't do this lol");
  // Check that each file exists and compare content hashes
  //  const fsFiles: Array<Deno.FsFile> = await Promise.all(map.map(e => {
  //   return Deno.open(e.localFile);
  // }));
  // console.dir(fsFiles);
}

export function dangerousCopyFileSync (fromPath: string, toPath: string) {
  // Check if the destination directory already exists
  // and create it if it doesn't
  //
  // This can be a recursive function that checks from the final directory up to the root
  // And creates the child directory once it finds a parent directory that exists

  const parentDir = dirname(toPath);
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
      console.error(`Error creating parent directory ${parentDir}.`);
      console.error(e);
      Deno.exit(1);
    }
  }

  console.log(`Copying file ${fromPath} to ${toPath}.`);

  try {
    Deno.copyFileSync(fromPath, toPath);
  } catch (e) {
    console.error("Error copying file to store");
    console.error(e);
    Deno.exit(1);
  }
}
