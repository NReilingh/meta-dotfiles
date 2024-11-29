import { dirname, join, normalize } from 'node:path';
import common from 'common-path-prefix';

/**
 * Abstract class representing a path, either relative or absolute.
 *
 * Provides generic path manipulation methods and constructor shortcuts
 * for `AbsolutePath` and `RelativePath`.
 */
export abstract class Path {
  /** Create a new AbsolutePath from a string and optional relativeTo */
  static Absolute (path: string): AbsolutePath;
  static Absolute (relativePath: string, relativeTo: AbsolutePath): AbsolutePath;
  /** Create a new AbsolutePath from a string and optional relativeTo */
  static Absolute (path: string, relativeTo?: AbsolutePath) {
    return relativeTo
      ? new AbsolutePath(path, relativeTo)
      : new AbsolutePath(path);
  }

  /**
   * Create a new RelativePath from a list of path components,
   * or a single path string.
   */
  static Relative (...paths: string[]) {
    return new RelativePath(...paths);
  }

  private readonly path: string;

  /**
   * Normalize the stored path string and remove trailing slashes.
   */
  constructor (pathStr: string) {
    // All paths are to be normalized.
    if (pathStr.length === 0) {
      throw new Error('Path cannot be empty');
    }
    this.path = normalize(pathStr);
    // Remove final character if it is a slash
    if (this.path[this.path.length - 1] === '/') {
      this.path = this.path.slice(0, -1);
    }
  }

  abstract get dirname (): Path;
  abstract join (suffix: RelativePath): Path;

  /** Determine what prefix, if any, is shared by a set of Paths. */
  static commonPrefix<TPath extends Path> (...paths: TPath[]): Path | false {
    const prefix = common(paths.map(path => path.unsafeString));
    if (prefix.length === 0) {
      return false;
    }
    return Path.isAbsolute(prefix)
      ? new AbsolutePath(prefix)
      : new RelativePath(prefix);
  }
  /** Determine what prefix, if any, is shared by a set of Paths. */
  commonPrefix (...paths: Path[]): Path | false {
    return Path.commonPrefix(this, ...paths);
  }

  /** Determine if the path is prefixed by another Path */
  hasPrefix (prefix: Path): boolean {
    const thisPrefix = this.commonPrefix(prefix);
    return !!thisPrefix && thisPrefix.unsafeString === prefix.unsafeString;
  }

  /**
   * The raw string representation of the path.
   * Do not use with filesystem operations;
   * convert to `AbsolutePath` (if Relative) and use `.use()` instead.
   */
  get unsafeString (): string {
    return this.path;
  }

  /** Determine if the provided string is an absolute path or not. */
  static isAbsolute (path: string): boolean {
    return path[0] === '/';
  }

  /** The number of path components in the path. */
  get numComponents (): number {
    return this.components.length;
  }

  /** The path split into string components. */
  get components (): string[] {
    return this.path.split('/').filter(c => c.length >= 1);
  }
}

/**
 * Represents a relative filesystem path.
 */
export class RelativePath extends Path {
  /**
   * Create a new RelativePath from a list of path components,
   * or a single path string.
   */
  constructor (...paths: string[]) {
    const path = join(...paths);
    if (Path.isAbsolute(path)) {
      throw new Error('Cannot create RelativePath from absolute path');
    }
    super(path);
  }

  /** An instance of RelativePath with the last path component removed */
  get dirname (): RelativePath {
    return new RelativePath(dirname(this.unsafeString));
  }
  /** A new RelativePath with a suffix appended to this one. */
  join (suffix: RelativePath): RelativePath {
    return new RelativePath(join(this.unsafeString, suffix.unsafeString));
  }

  /**
   * Derive an absolute path relative to the current working directory.
   */
  absolute (): AbsolutePath {
    return this.resolve(new AbsolutePath(process.cwd()));
  }

  /**
   * Resolve the path relative to a provided AbsolutePath.
   */
  resolve (relativeTo: AbsolutePath): AbsolutePath {
    const relComponents = this.components;
    if (relComponents.includes('..')) {
      let parentCount = relativeTo.numComponents;
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
    return new AbsolutePath(join(relativeTo.unsafeString, this.unsafeString));
  }
}

/**
 * Represents a filesystem path with an absolute root.
 */
export class AbsolutePath extends Path {
  /**
   * Pass in an absolute or relative path string.
   * Absolute path will be resolved relative to the working directory.
   */
  constructor (path: string);
  /**
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
      super(abs.unsafeString);
    } else {
      throw new Error('Invalid arguments');
    }
  }

  /** An instance of AbsolutePath with the last path component removed. */
  get dirname (): AbsolutePath {
    return new AbsolutePath(dirname(this.unsafeString));
  }
  /** A new AbsolutePath with a suffix appended to this path. */
  join (suffix: RelativePath): AbsolutePath {
    return new AbsolutePath(join(this.unsafeString, suffix.unsafeString));
  }
  /** The string form of the AbsolutePath for use in filesystem operations. */
  get use (): string {
    return this.unsafeString;
  }
}

