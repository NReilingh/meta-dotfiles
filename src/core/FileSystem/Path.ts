import { Node } from './Node.ts';
import { dirname, join, normalize } from 'node:path';
import common from 'common-path-prefix';

import { MaybePromiseOf } from './index.ts';
/**
 * Abstract class representing a path, either relative or absolute.
 *
 * Provides generic path manipulation methods.
 */
export abstract class Path {
  private path: string;

  constructor (path: string) {
    // All paths are to be normalized.
    if (path.length === 0) {
      throw new Error('Path cannot be empty');
    }
    this.path = normalize(path);
    // Remove final character if it is a slash
    if (this.path[this.path.length - 1] === '/') {
      this.path = this.path.slice(0, -1);
    }
  }

  abstract dirname (): Path;
  abstract join (suffix: RelativePath): Path;

  static commonPrefix (...paths: Path[]): Path | false {
    const prefix = common(paths.map(path => path.toString()));
    if (prefix.length === 0) {
      return false;
    }
    return Path.isAbsolute(prefix)
      ? new AbsolutePath(prefix)
      : new RelativePath(prefix);
  }
  commonPrefix (...paths: Path[]): Path | false {
    return Path.commonPrefix(this, ...paths);
  }

  hasPrefix (prefix: Path): boolean {
    return this.commonPrefix(prefix).toString() === prefix.toString();
  }

  toString (): string {
    return this.path;
  }
  static isAbsolute (path: string): boolean {
    return path[0] === '/';
  }
  numComponents (): number {
    return this.components().length;
  }
  components (): string[] {
    return this.path.split('/').filter(c => c.length >= 1);
  }
}

export class RelativePath extends Path {
  constructor (...paths: string[]) {
    const path = join(...paths);
    if (Path.isAbsolute(path)) {
      throw new Error('Cannot create RelativePath from absolute path');
    }
    super(path);
  }

  dirname (): RelativePath {
    return new RelativePath(dirname(this.toString()));
  }
  join (suffix: RelativePath): RelativePath {
    return new RelativePath(join(this.toString(), suffix.toString()));
  }

  /**
   * 
   * Derive an absolute path relative to the current working directory.
   *
   */
  absolute (): AbsolutePath {
    return this.resolve(new AbsolutePath(process.cwd()));
  }
  resolve (relativeTo: AbsolutePath): AbsolutePath {
    const relComponents = this.components();
    if (relComponents.includes('..')) {
      let parentCount = relativeTo.numComponents();
      for (const component of relComponents) {
        if (component === '..') {
          parentCount--;
        } else {
          parentCount++;
        }
        if (parentCount < 0) {
          throw new Error('Cannot resolve path: too many parent directories for relativeTo path');
        }
      }
    }
    return new AbsolutePath(join(relativeTo.toString(), this.toString()));
  }
}

export class AbsolutePath extends Path {
  /*
  * Pass in an absolute or relative path string.
  * Absolute path will be resolved relative to the working directory.
  */
  constructor (path: string);
  /*
  * Pass in a relative path string, plus an AbsolutePath relative to which it is to be resolved.
  */
  constructor (relativePath: string, relativeTo: AbsolutePath);
  constructor (path: string, relativeTo?: AbsolutePath) {
    // If only path supplied, and is absolute, pass to super.
    // If relativeTo supplied and path is relative, derive the absolute path and pass to super.
    // Otherwise throw exception.
    if (Path.isAbsolute(path) && relativeTo === undefined) {
      super(path);
      return;
    } else if (!Path.isAbsolute(path) && relativeTo !== undefined) {
      const rel = new RelativePath(path);
      const abs = rel.resolve(relativeTo);
      super(abs.toString());
    } else {
      throw new Error('Invalid arguments');
    }
  }

  dirname (): AbsolutePath {
    return new AbsolutePath(dirname(this.toString()));
  }
  join (suffix: RelativePath): AbsolutePath {
    return new AbsolutePath(join(this.toString(), suffix.toString()));
  }
}

// Crazy TypeScript shit
// This does type-safe shortcutting of Node's static methods
// (which take an AbsolutePath as the first param)
// to be accessible from AbsolutePath.

// Utility type to extract valid method keys from a type T.
type MethodKeys<T> = {
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T];
// Maybe someday: filter MethodKeys to only include those with AbsolutePath first argument
// type FirstArgIsAbsolutePath<T> = T extends (arg1: infer A, ...args: any[]) => any ? A extends AbsolutePath ? true : false : false;
// type MethodKeys<T> = {
//   [K in keyof T]: FirstArgIsAbsolutePath<T[K]> extends true ? K : never
// }[keyof T];

// Select and validate subset of methods from Node.
type NodeStaticMethodKey =  MethodKeys<typeof Node> & ('exists' | 'stat' | 'fooofff');
const methods: NodeStaticMethodKey[] = [
  'exists',
  'stat',
  // 'retrieve',
  // 'content',
  // 'text',
  // 'stream',
  // 'arrayBuffer',
  // 'json',
];

// Get the actual method signatures and transform them
type NodeStaticMethods = Pick<typeof Node, NodeStaticMethodKey>;
type OmitFirstArg<Func> = Func extends (arg1: any, ...args: infer Rest) => infer Return ? (...args: Rest) => Return : never;
type TransformToInstanceMethods<T> = {
    [P in keyof T]: OmitFirstArg<T[P]>;
};
type NodeShortcutMethods = TransformToInstanceMethods<NodeStaticMethods>;

Object.assign(
  AbsolutePath.prototype,
  Object.fromEntries(
    methods.map((method): [NodeStaticMethodKey, Function] => [
      method,
      function (this: AbsolutePath, ...args: any[]) {
        return Node[method](this, ...args);
      }
    ])
  )
);

// Apply types for Node instance method shortcuts.
export interface AbsolutePath extends NodeShortcutMethods {}
