import { Path, AbsolutePath, RelativePath } from './Path.ts';
import { Directory } from './Directory.ts';
import { File } from './File.ts';

import { test, expect, describe, beforeAll, beforeEach } from 'bun:test';

import * as fs from 'node:fs/promises';

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

describe('AbsolutePath filesystem operations', () => {
  beforeAll(async () => {
    await fs.rm('build/test', { recursive: true, force: true });
    await fs.mkdir('build/test', { recursive: true });
  });

  test('File exists', async () => {
    const not = new RelativePath('build/test/notexists').absolute();
    expect(not.existsSync()).toBe(false);
    expect(await not.exists()).toBe(false);

    await fs.writeFile('build/test/exists', '');

    const path = new RelativePath('build/test/exists').absolute();
    expect(path.existsSync()).toBe(true);
    expect(await path.exists()).toBe(true);
  });

  describe('Path node retrieval', async () => {
    beforeEach(async () => {
      await fs.rm('build/test/retrieve', { recursive: true, force: true });
      await fs.mkdir('build/test/retrieve', { recursive: true });
    });
    test('stat file async', async () => {
      await fs.writeFile('build/test/retrieve/file', '');
      const path = new RelativePath('build/test/retrieve/file').absolute();
      const node = await path.stat();
      expect(node.constructor).toEqual(File);
    });
    test('stat file sync', async () => {
      await fs.writeFile('build/test/retrieve/file', '');
      const path = new RelativePath('build/test/retrieve/file').absolute();
      const node = path.statSync();
      expect(node.constructor).toEqual(File);
    });
    test('stat dir async', async () => {
      const path = new RelativePath('build/test/retrieve').absolute();
      const node = await path.stat();
      expect(node.constructor).toEqual(Directory);
    });
    test('stat dir sync', async () => {
      const path = new RelativePath('build/test/retrieve').absolute();
      const node = path.statSync();
      expect(node.constructor).toEqual(Directory);
    });
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
});

