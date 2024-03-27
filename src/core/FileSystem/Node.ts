import * as fs from 'node:fs';

import { AbsolutePath, RelativePath } from './Path.ts';
import { MaybePromiseOf } from './index.ts';

type NodeContent = Promise<DirContent> | DirContent | FileContent;
export type DirContent = Array<Node>;
export type FileContent = {
  text (): string | Promise<string>,
  stream (): ReadableStream,
  arrayBuffer (): ArrayBuffer | Promise<ArrayBuffer>,
  json (): any | Promise<any>
};

export type DirRetrieveOpts = {
  sync?: boolean,
  recursive?: boolean
  excludeRelative?: RelativePath[],
  excludeAbsolute?: AbsolutePath[]
};

export type DirRetrieveParsedOpts = {
  excludeRelative: {
    path: RelativePath,
    name: RelativePath,
    parentPath: RelativePath,
  }[],
  excludeAbsolute: {
    path: AbsolutePath,
    name: RelativePath,
    parentPath: AbsolutePath,
  }[]
};

type DirContentMemo = {
  content: DirContent,
  query: DirRetrieveParsedOpts
};

export class Node {
  protected constructor(path: AbsolutePath, inode?: number) {
    this.path = path;
    this.inode = inode;
  }
  public readonly path: AbsolutePath;
  public readonly inode?: number;

  abstract retrieve (): NodeContent;

  protected static absPathFromDirent (entry: fs.Dirent): AbsolutePath {
    return new AbsolutePath(entry.parentPath).join(new RelativePath(entry.name));
  }

  static fromPath (path: AbsolutePath, opts?: { sync: boolean }): MaybePromiseOf<Node | false> {
    function filter (stats: fs.Stats): Node | false {
      if (stats.isDirectory()) {
        return new Directory(path, stats.ino);
      } else if (stats.isFile()) {
        return new File(path, stats.ino);
      } else {
        throw new Error('Path is neither file nor directory');
      }
    }
    function catchErr (e: any): false {
      if (e.code === 'ENOENT') {
        return false;
      } else {
        throw e;
      }
    }

    if (opts?.sync) {
      try {
        const stats = fs.lstatSync(path.toString());
        return filter(stats);
      } catch (e: any) {
        return catchErr(e);
      }
    }

    const stats = fs.promises.lstat(path.toString());
    return stats.then(filter).catch(catchErr);
  }

  static exists (path: AbsolutePath, opts?: { sync: boolean }): MaybePromiseOf<boolean> {
    function catchErr (e: any): false {
      if (e.code === 'ENOENT') {
        return false;
      } else {
        throw e;
      }
    }
    if (opts?.sync) {
      try {
        fs.accessSync(path.toString());
        return true;
      } catch (e: any) {
        return catchErr(e);
      }
    }
    const prom = fs.promises.access(path.toString());
    return prom.then(() => true).catch(catchErr);
  }

  static stat (path: AbsolutePath): MaybePromiseOf<Node | false> {
    return Node.fromPath(path);
  
  }

}

export class File extends Node {
  private textContent?: string;
  private arrayBufferContent?: ArrayBuffer;
  private jsonContent?: any;

  constructor (path: AbsolutePath, inode?: number) {
    super(path, inode);
  }
  retrieve (): FileContent {
    return {
      text: () => {
        if (this.textContent) {
          return this.textContent;
        }
        return Bun.file(this.path.toString()).text().then(e => {
          this.textContent = e;
          return e;
        });
      },
      stream: () => {
        return Bun.file(this.path.toString()).stream();
      },
      arrayBuffer: () => {
        if (this.arrayBufferContent) {
          return this.arrayBufferContent;
        }
        return Bun.file(this.path.toString()).arrayBuffer().then(e => {
          this.arrayBufferContent = e;
          return e;
        });
      },
      json: () => {
        if (this.jsonContent) {
          return this.jsonContent;
        }
        return Bun.file(this.path.toString()).json().then(e => {
          this.jsonContent = e;
          return e;
        });
      },
    };
  }
}

export class Directory extends Node {
  private contentMemo?: DirContentMemo;
  private contents?: DirContent;
  private recursiveContents?: DirContent;

  constructor (path: AbsolutePath, inode?: number) {
    super(path, inode);
  }

  // Defined as an arrow function so I can use it as a callback without calling `.bind()`.
  private mapNonrecursiveDirContent = (entries: fs.Dirent[]): DirContent => {
    return entries.map(e => {
      if (e.isFile()) {
        return new File(Node.absPathFromDirent(e));
      } else if (e.isDirectory()) {
        return new Directory(Node.absPathFromDirent(e));
      }
    }).filter(e => e !== undefined) as DirContent;
  }

  private async retrieveDir (): Promise<DirContent> {
    return fs.promises.readdir(
      this.path.toString(),
      {
        withFileTypes: true,
      }
    )
      .then(this.mapNonrecursiveDirContent);
  }
  private retrieveDirSync (): DirContent {
    return this.mapNonrecursiveDirContent(
      fs.readdirSync(
        this.path.toString(),
        { withFileTypes: true }
      ));
  }

  retrieve (opts?: DirRetrieveOpts): Promise<DirContent> | DirContent {
    if (opts?.sync) {
      if (opts?.recursive && this.recursiveContents) {
        return this.recursiveContents;
      }
      if (this.contents) {
        return this.contents;
      }

      return opts?.recursive
        ? never
        : this.contents = this.retrieveDirSync();
    }

    if (opts?.recursive && this.recursiveContents) {
      return this.recursiveContents;
    }
    if (this.contents) {
      return this.contents;
    }

    if (opts?.recursive) {
      return this.recursiveRetrieveDir()
        .then(dirContent => {
          return this.recursiveContents = dirContent;
        });
    }
    return this.retrieveDir()
      .then(dirContent => {
        return this.contents = dirContent;
      });
  }

  private descendantPathsFilter = (entries: fs.Dirent[], opts?: DirRetrieveOpts): AbsolutePath[] => {
    return entries.filter(e => {
      return e.isFile()
      && !opts?.excludeAbsolute?.some(ex => ex.toString() === e.name)
      && !opts?.excludeAbsolute?.some(ex => new AbsolutePath(e.name).hasPrefix(ex))
      && !opts?.excludeRelative?.some(ex => e.name.endsWith('/' + ex.toString()));
    }).map(e => Node.absPathFromDirent(e));
  }

  // descendantFilePaths
  fileDescendantPaths (opts?: DirRetrieveOpts): Promise<AbsolutePath[]> {
    if (opts?.sync) {
      const results: Array<fs.Dirent> = fs.readdirSync(this.path.toString(), { withFileTypes: true, recursive: true });
      return this.descendantPathsFilter(results, opts);
    }
    const promise: Promise<Array<fs.Dirent>> = fs.promises.readdir(this.path.toString(), { withFileTypes: true, recursive: true });
    return promise.then(d => this.descendantPathsFilter(d, opts));
  }
}

