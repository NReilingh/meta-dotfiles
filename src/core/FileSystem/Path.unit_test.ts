import { Path, AbsolutePath, RelativePath } from './Path.ts';

import { test, expect, describe } from 'bun:test';

test('AbsolutePath safe string method', () => {
  const path = new AbsolutePath('/a/b/c');
  expect(path.use).toBe('/a/b/c');
});

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
  expect(absPath.numComponents).toBe(3);
  const relPath = new RelativePath('a/b/c');
  expect(relPath.numComponents).toBe(3);
  const weirdPath = new RelativePath('../../a/b');
  expect(weirdPath.numComponents).toBe(4);
});

test('RelativePath basic operations', () => {
  const path = new RelativePath('a/b/c');
  expect(path.unsafeString).toBe('a/b/c');
  const trailing = new RelativePath('a/b/c/');
  expect(trailing.unsafeString).toBe('a/b/c');
  const multipath = new RelativePath('a', 'b', 'c');
  expect(multipath.unsafeString).toBe('a/b/c');

  expect(() => new RelativePath('/a/b/c')).toThrow();
});

test('RelativePath dirname', () => {
  const path = new RelativePath('a/b/c');
  expect(path.dirname.unsafeString).toBe('a/b');
});
test('AbsolutePath dirname', () => {
  const path = new AbsolutePath('/a/b/c');
  expect(path.dirname.unsafeString).toBe('/a/b');
});

test('RelativePath join', () => {
  const path = new RelativePath('a/b/c');
  expect(path.join(new RelativePath('d')).unsafeString).toBe('a/b/c/d');
  expect(path.join(new RelativePath('d/e')).unsafeString).toBe('a/b/c/d/e');
  expect(path.join(new RelativePath('d', 'e', 'f')).unsafeString).toBe('a/b/c/d/e/f');
});

test('AbsolutePath join', () => {
  const path = new AbsolutePath('/a/b/c');
  expect(path.join(new RelativePath('d')).unsafeString).toBe('/a/b/c/d');
  expect(path.join(new RelativePath('d/e')).unsafeString).toBe('/a/b/c/d/e');
  expect(path.join(new RelativePath('d', 'e', 'f')).unsafeString).toBe('/a/b/c/d/e/f');
});

test('RelativePath resolve', () => {
  const path = new RelativePath('a/b/c');
  expect(path.resolve(new AbsolutePath('/x/y/z')).unsafeString).toBe('/x/y/z/a/b/c');
});

test('RelativePath absolute resolves to cwd', () => {
  const path = new RelativePath('a/b/c');
  expect(path.absolute.unsafeString).toBe(process.cwd() + '/a/b/c');
});

test('Complex paths are normalized', () => {
  const relPath = new RelativePath('a/b/../c//d//');
  expect(relPath.unsafeString).toBe('a/c/d');
  const grandparent = new RelativePath('../../z');
  expect(grandparent.unsafeString).toBe('../../z');
});

test('Parent directory resolution', () => {
  const relPath = new RelativePath('../../a/b/c');
  expect(relPath.resolve(new AbsolutePath('/x/y/z')).unsafeString).toBe('/x/a/b/c');
  expect(relPath.resolve(new AbsolutePath('/y/z')).unsafeString).toBe('/a/b/c');

  expect(() => {
    relPath.resolve(new AbsolutePath('/z'));
  }).toThrow();
});

test('Adversarial parent directory resolution', () => {
  const relPath = new RelativePath('a/../../../b/c/d/e/../f');
  expect(relPath.resolve(new AbsolutePath('/x/y/z')).unsafeString).toBe('/x/b/c/d/f');
  expect(relPath.resolve(new AbsolutePath('/y/z')).unsafeString).toBe('/b/c/d/f');
  expect(() => {
    relPath.resolve(new AbsolutePath('/z'));
  }).toThrow();
});

test('AbsolutePath basic operations', () => {
  const path = new AbsolutePath('/a/b/c');
  expect(path.unsafeString).toBe('/a/b/c');
  const trailing = new AbsolutePath('/a/b/c/');
  expect(trailing.unsafeString).toBe('/a/b/c');
  const relPath = new AbsolutePath('../a/b', new AbsolutePath('/x/y'));
  expect(relPath.unsafeString).toBe('/x/a/b');

  expect(() => new AbsolutePath('a/b/c')).toThrow('Invalid arguments');
  expect(() => new AbsolutePath('/a/b/c', new AbsolutePath('/x/y'))).toThrow('Invalid arguments');
});

describe('Path prefixes', () => {
  test('No common prefix', () => {
    const relPath = new RelativePath('a/b/c');
    const absPath = new AbsolutePath('/a/b/c');
    expect(Path.commonPrefix(relPath, absPath)).toBe(false);
  });
  test('Relative prefixes', () => {
    const result = Path.commonPrefix(
      new RelativePath('a/b/c'),
      new RelativePath('a/b/c/d'),
      new RelativePath('a/b'),
    ) as Path;
    expect(result).not.toBe(false);
    expect(result.unsafeString).toBe('a/b');
  });
  test('Absolute prefixes', () => {
    const result = Path.commonPrefix(
      new AbsolutePath('/a/b/c'),
      new AbsolutePath('/a/b/z/d'),
    ) as Path;
    expect(result).not.toBe(false);
    expect(result.unsafeString).toBe('/a/b');
  });
  test('Instance method', () => {
    const path = new RelativePath('a/b/c');
    expect(path.commonPrefix(new RelativePath('x/y/z'))).toBe(false);
    const result = path.commonPrefix(new RelativePath('a/g/g')) as Path;
    expect(result.unsafeString).toBe('a');
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

