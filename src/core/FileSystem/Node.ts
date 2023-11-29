import * as fs from 'node:fs';

import { AbsolutePath, RelativePath } from './Path.ts';

type NodeContent = Promise<DirContent> | DirContent | FileContent;
export type DirContent = Array<Node>;
export type FileContent = {
  text (): string | Promise<string>,
  stream (): ReadableStream,
  arrayBuffer (): ArrayBuffer | Promise<ArrayBuffer>,
  json (): any | Promise<any>
};

export abstract class Node {
  protected constructor(path: AbsolutePath, inode?: number) {
    this.path = path;
    this.inode = inode;
  }
  public readonly path: AbsolutePath;
  public readonly inode?: number;

  abstract retrieve (): NodeContent;
  abstract retrieveSync (): NodeContent;

  protected static absPathFromDirent (node: Node, entry: fs.Dirent): AbsolutePath {
    return node.path.join(new RelativePath(entry.name));
  }

  static async fromPath (path: AbsolutePath): Promise<Node | false> {
    try {
      const stats = await fs.promises.lstat(path.toString());
      if (stats.isDirectory()) {
        return new Directory(path, stats.ino);
      } else if (stats.isFile()) {
        return new File(path, stats.ino);
      } else {
        throw new Error('Path is neither file nor directory');
      }
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return false;
      } else {
        throw e;
      }
    }
  }

  static fromPathSync (path: AbsolutePath): Node | false {
    try {
      const stats = fs.lstatSync(path.toString());
      if (stats.isDirectory()) {
        return new Directory(path, stats.ino);
      } else if (stats.isFile()) {
        return new File(path, stats.ino);
      } else {
        throw new Error('Path is neither file nor directory');
      }
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return false;
      } else {
        throw e;
      }
    }
  }

  static async exists (path: AbsolutePath): Promise<boolean> {
    try {
      await fs.promises.access(path.toString());
      return true;
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return false;
      } else {
        throw e;
      }
    }
  }

  static existsSync (path: AbsolutePath): boolean {
    try {
      fs.accessSync(path.toString());
      return true;
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return false;
      } else {
        throw e;
      }
    }
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

  retrieveSync (): FileContent {
    return this.retrieve();
  }
}
export class Directory extends Node {
  private contents?: DirContent;
  private recursiveContents?: DirContent;

  constructor (path: AbsolutePath, inode?: number) {
    super(path, inode);
  }

  private mapNonrecursiveDirContent (entries: fs.Dirent[]): DirContent {
    return entries.map(e => {
      if (e.isFile()) {
        return new File(Node.absPathFromDirent(this, e));
      } else if (e.isDirectory()) {
        return new Directory(Node.absPathFromDirent(this, e));
      }
    }).filter(e => e !== undefined) as DirContent;
  }

  private async retrieveDir (): Promise<DirContent> {
    return fs.promises.readdir(
      this.path.toString(),
      {
        withFileTypes: true,
      }
    ).then(e => {
      this.contents = this.mapNonrecursiveDirContent(e);
      return this.contents;
    }).catch(e => {
      throw new Error(e);
    });
  }
  private async recursiveRetrieveDir (): Promise<DirContent> {
  }

  retrieve (opts?: { recursive: boolean }): Promise<DirContent> | DirContent {
    if (opts?.recursive) {
      if (this.recursiveContents) {
        return this.recursiveContents;
      }
      return this.recursiveRetrieveDir();
    } else {
      if (this.contents) {
        return this.contents;
      }
      return this.retrieveDir();
    }
  }

  retrieveSync () : DirContent {
    return this.contents ??
      (() => {
        this.contents = this.mapNonrecursiveDirContent(
          fs.readdirSync(
            this.path.toString(),
            { withFileTypes: true }
          ));
        return this.contents;
      })();
  }
}

