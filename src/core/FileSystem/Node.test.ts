import { RelativePath } from './Path.ts';
import { Node, File, Directory, DirContent } from './Node.ts';
import { test, expect, describe, beforeAll } from 'bun:test';
import * as fs from 'node:fs/promises';

import { relative, join } from 'node:path';
const TR = join('build/test',
  (r => r.slice(r.indexOf('/')+1))(relative(process.cwd(), import.meta.dir)),
  import.meta.file.split('.')[0]) + '/';

console.log('TR (TestRoot) is:', TR);

await fs.rm(TR, { recursive: true, force: true });
await fs.mkdir(TR, { recursive: true });

async function cleanDir (path: string) {
  await fs.rm(path, { recursive: true, force: true });
  await fs.mkdir(path, { recursive: true });
}

describe('Node instantiation', () => {
  beforeAll(async () => {
    await fs.rm(TR + 'construct', { recursive: true, force: true });
    await fs.mkdir(TR + 'construct/dir', { recursive: true });
    await fs.writeFile(TR + 'construct/file', '');
  });
  describe('Path not present', () => {
    test('Missing dir async', async () => {
      const path = new RelativePath(TR + 'construct/missing').absolute();
      const node = await Node.fromPath(path);
      expect(node).toBeFalse();
    });
    test('Missing dir sync', async () => {
      const path = new RelativePath(TR + 'construct/missing').absolute();
      const node = Node.fromPathSync(path);
      expect(node).toBeFalse();
    });
  });
  test('Dir from path async', async () => {
    const path = new RelativePath(TR + 'construct/dir').absolute();
    const node = await Node.fromPath(path);
    expect(node).toBeTruthy();
    expect(node instanceof Node).toBeTrue();
    expect(node instanceof Directory).toBeTrue();
  });
  test('Dir from path sync', async () => {
    const path = new RelativePath(TR + 'construct/dir').absolute();
    const node = Node.fromPathSync(path);
    expect(node).toBeTruthy();
    expect(node instanceof Node).toBeTrue();
    expect(node instanceof Directory).toBeTrue();
  });
  test('File from path async', async () => {
    const path = new RelativePath(TR + 'construct/file').absolute();
    const node = await Node.fromPath(path);
    expect(node).toBeTruthy();
    expect(node instanceof Node).toBeTrue();
    expect(node instanceof File).toBeTrue();
  });
  test('Dir from path sync', async () => {
    const path = new RelativePath(TR + 'construct/file').absolute();
    const node = Node.fromPathSync(path);
    expect(node).toBeTruthy();
    expect(node instanceof Node).toBeTrue();
    expect(node instanceof File).toBeTrue();
  });
});

describe('Directory class', () => {
  beforeAll(async () => {
    await fs.rm(TR + 'dir', { recursive: true, force: true });
    await fs.mkdir(TR + 'dir', { recursive: true });
  });
  describe('Directory retrieval', () => {
    beforeAll(async () => {
      await fs.rm(TR + 'dir/ret', { recursive: true, force: true });
      await fs.mkdir(TR + 'dir/ret/sub/child', { recursive: true });
      await fs.writeFile(TR + 'dir/ret/fileone', '');
      await fs.writeFile(TR + 'dir/ret/filetwo', '');
      await fs.writeFile(TR + 'dir/ret/sub/filethree', '');
    });
    test('One directory level async memoed', async () => {
      const path = new RelativePath(TR + 'dir/ret').absolute();
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
      const path = new RelativePath(TR + 'dir/ret').absolute();
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
});
describe('File class', () => {
  beforeAll(async () => {
    await cleanDir(TR + 'File');
  });
  describe('File retrieval', () => {
    beforeAll(async () => {
      await fs.writeFile(TR + 'File/retrieve', '');
    });
    test.skip('FileContent type async', async () => {
      const path = new RelativePath(TR + 'file/retrieve').absolute();
      const file = await Node.fromPath(path);
      const content = (file as Node).retrieve()
      expect(content).toHaveProperty('text');
      expect(content).toHaveProperty('stream');
      expect(content).toHaveProperty('arrayBuffer');
      expect(content).toHaveProperty('json');
    });
    test.skip('FileContent type sync', async () => {
      const path = new RelativePath(TR + 'file/retrieve').absolute();
      const file = await Node.fromPath(path);
      const content = (file as Node).retrieveSync()
      expect(content).toHaveProperty('text');
      expect(content).toHaveProperty('stream');
      expect(content).toHaveProperty('arrayBuffer');
      expect(content).toHaveProperty('json');
    });
    test.todo('FileContent text', async () => {
      const path = new RelativePath(TR + 'file/retrieve').absolute();
      const file = await Node.fromPath(path);
      const content = (file as Node).retrieve()
      const text = content.text();
    });
  });
});
