import { Path, AbsolutePath, RelativePath } from './Path.ts';
import * as fs from 'node:fs';

import { test, expect, describe, beforeAll, afterEach } from 'bun:test';

test('Path.isAbsolute', () => {
  expect(Path.isAbsolute('/')).toBe(true);
  expect(Path.isAbsolute('/a')).toBe(true);
  expect(Path.isAbsolute('/a/b')).toBe(true);
  expect(Path.isAbsolute('a')).toBe(false);
  expect(Path.isAbsolute('a/')).toBe(false);
  expect(Path.isAbsolute('a/b')).toBe(false);
  expect(Path.isAbsolute('./foo')).toBe(false);
  expect(Path.isAbsolute('../foo')).toBe(false);
});

test('Path component count', () => {
  const absPath = new AbsolutePath('/a/b/c');
  expect(absPath.numComponents()).toBe(3);
  const relPath = new RelativePath('a/b/c');
  expect(relPath.numComponents()).toBe(3);
  const weirdPath = new RelativePath('../../a/b');
  expect(weirdPath.numComponents()).toBe(4);
});

test('RelativePath basic operations', () => {
  const path = new RelativePath('a/b/c');
  expect(path.toString()).toBe('a/b/c');
  const trailing = new RelativePath('a/b/c/');
  expect(trailing.toString()).toBe('a/b/c');
  const multipath = new RelativePath('a', 'b', 'c');
  expect(multipath.toString()).toBe('a/b/c');

  expect(() => new RelativePath('/a/b/c')).toThrow();
});

test('RelativePath dirname', () => {
  const path = new RelativePath('a/b/c');
  expect(path.dirname().toString()).toBe('a/b');
});
test('AbsolutePath dirname', () => {
  const path = new AbsolutePath('/a/b/c');
  expect(path.dirname().toString()).toBe('/a/b');
});

test('RelativePath join', () => {
  const path = new RelativePath('a/b/c');
  expect(path.join(new RelativePath('d')).toString()).toBe('a/b/c/d');
  expect(path.join(new RelativePath('d/e')).toString()).toBe('a/b/c/d/e');
  expect(path.join(new RelativePath('d', 'e', 'f')).toString()).toBe('a/b/c/d/e/f');
});

test('AbsolutePath join', () => {
  const path = new AbsolutePath('/a/b/c');
  expect(path.join(new RelativePath('d')).toString()).toBe('/a/b/c/d');
  expect(path.join(new RelativePath('d/e')).toString()).toBe('/a/b/c/d/e');
  expect(path.join(new RelativePath('d', 'e', 'f')).toString()).toBe('/a/b/c/d/e/f');
});

test('RelativePath resolve', () => {
  const path = new RelativePath('a/b/c');
  expect(path.resolve(new AbsolutePath('/x/y/z')).toString()).toBe('/x/y/z/a/b/c');
});

test('RelativePath absolute resolves to cwd', () => {
  const path = new RelativePath('a/b/c');
  expect(path.absolute().toString()).toBe(process.cwd() + '/a/b/c');
});

test('Complex paths are normalized', () => {
  const relPath = new RelativePath('a/b/../c//d//');
  expect(relPath.toString()).toBe('a/c/d');
  const grandparent = new RelativePath('../../z');
  expect(grandparent.toString()).toBe('../../z');
});

test('Parent directory resolution', () => {
  const relPath = new RelativePath('../../a/b/c');
  expect(relPath.resolve(new AbsolutePath('/x/y/z')).toString()).toBe('/x/a/b/c');
  expect(relPath.resolve(new AbsolutePath('/y/z')).toString()).toBe('/a/b/c');

  expect(() => {
    relPath.resolve(new AbsolutePath('/z'));
  }).toThrow();
});

test('Adversarial parent directory resolution', () => {
  const relPath = new RelativePath('a/../../../b/c/d/e/../f');
  expect(relPath.resolve(new AbsolutePath('/x/y/z')).toString()).toBe('/x/b/c/d/f');
  expect(relPath.resolve(new AbsolutePath('/y/z')).toString()).toBe('/b/c/d/f');
  expect(() => {
    relPath.resolve(new AbsolutePath('/z'));
  }).toThrow();
});

test('AbsolutePath basic operations', () => {
  const path = new AbsolutePath('/a/b/c');
  expect(path.toString()).toBe('/a/b/c');
  const trailing = new AbsolutePath('/a/b/c/');
  expect(trailing.toString()).toBe('/a/b/c');
  const relPath = new AbsolutePath('../a/b', new AbsolutePath('/x/y'));
  expect(relPath.toString()).toBe('/x/a/b');

  expect(() => new AbsolutePath('a/b/c')).toThrow('Invalid arguments');
  expect(() => new AbsolutePath('/a/b/c', new AbsolutePath('/x/y'))).toThrow('Invalid arguments');
});

describe('AbsolutePath BunFile abstractions', () => {
  beforeAll(() => {
    fs.mkdirSync('build/test/Path', { recursive: true });
  });

  afterEach(() => {
    // delete all files or directories in build/test/Path
    const files = fs.readdirSync('build/test/Path');
    for (const file of files) {
      fs.rmSync('build/test/Path/' + file, { recursive: true });
    }
  });

  test('BunFile returned for path', () => {
    const path = new AbsolutePath('/a/b/c');
    const bunfile = path.bunFile;
    expect(typeof bunfile).toBe('object');
    expect(bunfile.json).toBeInstanceOf(Function);
  });
  test('bunWrite called with input', () => {
    const path = new RelativePath('build/test/Path/foo').absolute();
    const input = { bar: 'baz' };
    const result = path.bunWrite(input);
    expect(result).toBeInstanceOf(Promise);
  });
});

describe('Path prefixes', () => {
  test('No common prefix', () => {
    const relPath = new RelativePath('a/b/c');
    const absPath = new AbsolutePath('/a/b/c');
    expect(Path.commonPrefix(relPath, absPath)).toBe(false);
  });
  test('Relative prefixes', () => {
    expect(Path.commonPrefix(
      new RelativePath('a/b/c'),
      new RelativePath('a/b/c/d'),
      new RelativePath('a/b'),
    ).toString()).toBe('a/b');
  });
  test('Absolute prefixes', () => {
    expect(Path.commonPrefix(
      new AbsolutePath('/a/b/c'),
      new AbsolutePath('/a/b/z/d'),
    ).toString()).toBe('/a/b');
  });
  test('Instance method', () => {
    const path = new RelativePath('a/b/c');
    expect(path.commonPrefix(new RelativePath('x/y/z'))).toBe(false);
    expect(path.commonPrefix(new RelativePath('a/g/g')).toString()).toBe('a');
  });
  test('hasPrefix', () => {
    const path = new AbsolutePath('/a/b/c');
    expect(path.hasPrefix(new AbsolutePath('/a/b/z'))).toBe(false);
    expect(path.hasPrefix(new AbsolutePath('/a/b/c'))).toBe(true);
    expect(path.hasPrefix(new AbsolutePath('/a/b'))).toBe(true);
  });
  test('Partial prefixing', () => {
    const prefix = new AbsolutePath('/a/b/c');
    expect(new AbsolutePath('/a/b/crazy').hasPrefix(prefix)).toBe(false);
    expect(new AbsolutePath('/a/b/c').hasPrefix(prefix)).toBe(true);
    expect(new AbsolutePath('/a/b/c/d').hasPrefix(prefix)).toBe(true);
  });
});

