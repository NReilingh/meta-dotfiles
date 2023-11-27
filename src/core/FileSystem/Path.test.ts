import { Path, AbsolutePath, RelativePath } from './Path.ts';

import { test, expect } from 'bun:test';

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

test('RelativePath join', () => {
  const path = new RelativePath('a/b/c');
  expect(path.join(new RelativePath('d')).toString()).toBe('a/b/c/d');
  expect(path.join(new RelativePath('d/')).toString()).toBe('a/b/c/d');
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
