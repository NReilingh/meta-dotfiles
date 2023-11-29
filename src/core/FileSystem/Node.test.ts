import { RelativePath } from './Path.ts';
import { Node, File, Directory, DirContent } from './Node.ts';
import { test, expect, describe, beforeAll, beforeEach } from 'bun:test';
import * as fs from 'node:fs/promises';

describe('Node instantiation', () => {
  beforeAll(async () => {
    await fs.rm('build/test/fs/node/construct', { recursive: true, force: true });
    await fs.mkdir('build/test/fs/node/construct/dir', { recursive: true });
    await fs.writeFile('build/test/fs/node/construct/file', '');
  });
  describe('Path not present', () => {
    test('Missing dir async', async () => {
      const path = new RelativePath('build/test/fs/node/construct/missing').absolute();
      const node = await Node.fromPath(path);
      expect(node).toBeFalse();
    });
    test('Missing dir sync', async () => {
      const path = new RelativePath('build/test/fs/node/construct/missing').absolute();
      const node = Node.fromPathSync(path);
      expect(node).toBeFalse();
    });
  });
  test('Dir from path async', async () => {
    const path = new RelativePath('build/test/fs/node/construct/dir').absolute();
    const node = await Node.fromPath(path);
    expect(node).toBeTruthy();
    expect(node instanceof Node).toBeTrue();
    expect(node instanceof Directory).toBeTrue();
  });
  test('Dir from path sync', async () => {
    const path = new RelativePath('build/test/fs/node/construct/dir').absolute();
    const node = Node.fromPathSync(path);
    expect(node).toBeTruthy();
    expect(node instanceof Node).toBeTrue();
    expect(node instanceof Directory).toBeTrue();
  });
  test('File from path async', async () => {
    const path = new RelativePath('build/test/fs/node/construct/file').absolute();
    const node = await Node.fromPath(path);
    expect(node).toBeTruthy();
    expect(node instanceof Node).toBeTrue();
    expect(node instanceof File).toBeTrue();
  });
  test('Dir from path sync', async () => {
    const path = new RelativePath('build/test/fs/node/construct/file').absolute();
    const node = Node.fromPathSync(path);
    expect(node).toBeTruthy();
    expect(node instanceof Node).toBeTrue();
    expect(node instanceof File).toBeTrue();
  });
});

describe('Directory retrieval', () => {
  beforeAll(async () => {
    await fs.rm('build/test/fs/node/dir/ret', { recursive: true, force: true });
    await fs.mkdir('build/test/fs/node/dir/ret/sub/child', { recursive: true });
    await fs.writeFile('build/test/fs/node/dir/ret/fileone', '');
    await fs.writeFile('build/test/fs/node/dir/ret/filetwo', '');
    await fs.writeFile('build/test/fs/node/dir/ret/sub/filethree', '');
  });
  test('One directory level async memoed', async () => {
    const path = new RelativePath('build/test/fs/node/dir/ret').absolute();
    const node = await path.stat();
    expect(node instanceof Node).toBeTrue();
    expect(node instanceof Directory).toBeTrue();
    const dirContentPromise = (node as Directory).retrieve();
    expect(dirContentPromise instanceof Promise);
    const dirContent: DirContent = await dirContentPromise;
    expect(dirContent instanceof Array).toBeTrue();
    const dirContentLazy = (node as Node).retrieve();
    expect(dirContentLazy instanceof Array).toBeTrue();
    expect(dirContent).toEqual(dirContentLazy as DirContent);
    expect(dirContent).toBeArrayOfSize(3);
    const sortedDirPaths = dirContent.map(e => e.path.toString()).sort();
    expect(sortedDirPaths[0]).toContain('ret/fileone');
    expect(sortedDirPaths[1]).toContain('ret/filetwo');
    expect(sortedDirPaths[2]).toContain('ret/sub');
  });

  test('One directory level sync memoed', async () => {
    const path = new RelativePath('build/test/fs/node/dir/ret').absolute();
    const node = await path.stat();
    const dirContent = (node as Directory).retrieveSync();
    expect(dirContent instanceof Array).toBeTrue();
    const dirContentLazy = (node as Node).retrieve();
    expect(dirContentLazy instanceof Array).toBeTrue();
    expect(dirContent).toEqual(dirContentLazy as DirContent);
    expect(dirContent).toBeArrayOfSize(3);
    const sortedDirPaths = dirContent.map(e => e.path.toString()).sort();
    expect(sortedDirPaths[0]).toContain('ret/fileone');
    expect(sortedDirPaths[1]).toContain('ret/filetwo');
    expect(sortedDirPaths[2]).toContain('ret/sub');
  });
});
