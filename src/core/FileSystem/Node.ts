import * as fs from 'node:fs';

// Define type Node as algebraic union of File and Directory
import { AbsolutePath } from './Path.ts';

export abstract class Node {
  constructor(path: AbsolutePath, inode?: number) {
    this.path = path;
    this.inode = inode;
  }
  public readonly path: AbsolutePath
  public readonly inode?: number

  static statSync (path: AbsolutePath): Node | false {
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
  static async stat (path: AbsolutePath): Promise<Node | false> {
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
  constructor (path: AbsolutePath, inode?: number) {
    super(path, inode);
  }
}
export class Directory extends Node {
  constructor (path: AbsolutePath, inode?: number) {
    super(path, inode);
  }
}
