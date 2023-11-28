import * as fs from 'node:fs';
import { Directory } from './Directory.ts';
import { File } from './File.ts';

// Define type Node as algebraic union of File and Directory
//
import { AbsolutePath } from './Path.ts';

export abstract class Node {
  constructor(path: AbsolutePath, inode?: number) {
    this.path = path;
    this.inode = inode;
  }
  public readonly path: AbsolutePath
  public readonly inode?: number

  static async stat (path: AbsolutePath): Promise<Node | false> {
    try {
      const stats = await fs.promises.lstat(path.toString());
      if (stats.isDirectory()) {
        // return new Directory(path, stats.ino);
      } else if (stats.isFile()) {
        // return new File(path, stats.ino);
      } else {
        throw new Error('Path is neither file nor directory');
      }
      return new Directory(path);
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return false;
      } else {
        throw e;
      }
    }
  }

  static statSync (path: AbsolutePath): Node | false {
    try {
      const stats = fs.lstatSync(path.toString());
      if (stats.isDirectory()) {
        // return new Directory(path, stats.ino);
      } else if (stats.isFile()) {
        // return new File(path, stats.ino);
      } else {
        throw new Error('Path is neither file nor directory');
      }
      return false;
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
  // abstract async retrieve (): Promise<void>;
}
