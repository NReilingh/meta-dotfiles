import { AbsolutePath, RelativePath } from './Path.ts';
import { Node, File, Directory, DirContent, DirRetrieveOpts } from './Node.ts';
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
      const node = Node.fromPath(path, { sync: true });
      expect(node).toBeFalse();
    });
  });
  test('Dir from path async', async () => {
    const path = new RelativePath(TR + 'construct/dir').absolute();
    const node = await Node.fromPath(path);
    expect(node).toBeTruthy();
    expect(node).toBeInstanceOf(Node);
    expect(node).toBeInstanceOf(Directory);
  });
  test('Dir from path sync', async () => {
    const path = new RelativePath(TR + 'construct/dir').absolute();
    const node = Node.fromPath(path, { sync: true });
    expect(node).toBeTruthy();
    expect(node).toBeInstanceOf(Node);
    expect(node).toBeInstanceOf(Directory);
  });
  test('File from path async', async () => {
    const path = new RelativePath(TR + 'construct/file').absolute();
    const node = await Node.fromPath(path);
    expect(node).toBeTruthy();
    expect(node).toBeInstanceOf(Node);
    expect(node).toBeInstanceOf(File);
  });
  test('Dir from path sync', async () => {
    const path = new RelativePath(TR + 'construct/file').absolute();
    const node = Node.fromPath(path, { sync: true });
    expect(node).toBeTruthy();
    expect(node).toBeInstanceOf(Node);
    expect(node).toBeInstanceOf(File);
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
      expect(node).toBeInstanceOf(Node);
      expect(node).toBeInstanceOf(Directory);
      const dirContentPromise = (node as Directory).retrieve();
      expect(dirContentPromise).toBeInstanceOf(Promise);
      const dirContent: DirContent = await dirContentPromise;
      expect(dirContent).toBeInstanceOf(Array);
      const dirContentLazy = (node as Node).retrieve();
      expect(dirContentLazy).toBeInstanceOf(Array);
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
      const dirContent = (node as Directory).retrieve({ sync: true });
      expect(dirContent).toBeInstanceOf(Array);
      const dirContentLazy = (node as Node).retrieve({ sync: true });
      expect(dirContentLazy).toBeInstanceOf(Array);
      expect(dirContent).toEqual(dirContentLazy as DirContent);
      expect(dirContent).toBeArrayOfSize(3);
      const sortedDirPaths = dirContent.map(e => e.path.toString()).sort();
      expect(sortedDirPaths[0]).toContain('ret/fileone');
      expect(sortedDirPaths[1]).toContain('ret/filetwo');
      expect(sortedDirPaths[2]).toContain('ret/sub');
    });

    describe('Descendant Path filtering', () => {
      async function pathsFromFilterOpts (opts: DirRetrieveOpts): Promise<AbsolutePath[]> {
        const dir = Node.fromPath(new RelativePath(TR + 'dir/ret').absolute(), { sync: true }) as Directory;
        const entries = await fs.readdir(dir.path.toString(), { withFileTypes: true, recursive: true });
        return dir['descendantPathsFilter'](entries, opts);
      }
      test('descendantPathsFilter recursive', async () => {
        const paths = await pathsFromFilterOpts({ recursive: true });
        expect(paths).toBeInstanceOf(Array);
        expect(paths).toBeArrayOfSize(3);
        expect(paths[0]).toBeInstanceOf(AbsolutePath);
        paths.sort((a, b) => a.toString().localeCompare(b.toString()));
        expect(paths[0].toString()).toContain('ret/fileone');
      });
    });

    test('Get recursive descendant file paths async', async () => {
      const dir = Node.fromPath(new RelativePath(TR + 'dir/ret').absolute(), { sync: true }) as Directory;
      const paths = await dir.fileDescendantPaths();
      expect(paths).toBeInstanceOf(Array);
      expect(paths).toBeArrayOfSize(3);
      expect(paths[0]).toBeInstanceOf(AbsolutePath);
      paths.sort((a, b) => a.toString().localeCompare(b.toString()));
      expect(paths[0].toString()).toContain('ret/fileone');
      expect(paths[1].toString()).toContain('ret/filetwo');
      expect(paths[2].toString()).toContain('ret/sub/filethree');
    });

    test('Get recursive descendant file paths sync', async () => {
      const dir = Node.fromPath(new RelativePath(TR + 'dir/ret').absolute(), { sync: true }) as Directory;
      const paths = dir.fileDescendantPaths({ sync: true });
      expect(paths).toBeInstanceOf(Array);
      expect(paths).toBeArrayOfSize(3);
      expect(paths[0]).toBeInstanceOf(AbsolutePath);
      paths.sort((a, b) => a.toString().localeCompare(b.toString()));
      expect(paths[0].toString()).toContain('ret/fileone');
      expect(paths[1].toString()).toContain('ret/filetwo');
      expect(paths[2].toString()).toContain('ret/sub/filethree');
    });

    // test('Exclude 

    test.skip('Recursive directory retrieval', async () => {
      const path = new RelativePath(TR + 'dir/ret').absolute();
      const node = await path.stat();
      const dirContent = await (node as Directory).retrieve({ recursive: true });
      expect(dirContent).toBeInstanceOf(Array);
      expect(dirContent).toBeArrayOfSize(5);
      const sortedDirPaths = dirContent.map(e => e.path.toString()).sort();
      expect(sortedDirPaths[0]).toContain('ret/fileone');
      expect(sortedDirPaths[1]).toContain('ret/filetwo');
      expect(sortedDirPaths[2]).toContain('ret/sub');
      expect(sortedDirPaths[3]).toContain('ret/sub/child');
      expect(sortedDirPaths[4]).toContain('ret/sub/filethree');
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
    test('FileContent type async', async () => {
      const path = new RelativePath(TR + 'File/retrieve').absolute();
      const file = await Node.fromPath(path);
      const content = (file as Node).retrieve()
      expect(content).toHaveProperty('text');
      expect(content).toHaveProperty('stream');
      expect(content).toHaveProperty('arrayBuffer');
      expect(content).toHaveProperty('json');
    });
    test('FileContent type sync', async () => {
      const path = new RelativePath(TR + 'File/retrieve').absolute();
      const file = await Node.fromPath(path);
      const content = (file as Node).retrieve({ sync: true })
      expect(content).toHaveProperty('text');
      expect(content).toHaveProperty('stream');
      expect(content).toHaveProperty('arrayBuffer');
      expect(content).toHaveProperty('json');
    });
    test('FileContent text', async () => {
      await fs.writeFile(TR + 'File/text', 'helloworld');
      const path = new RelativePath(TR + 'File/text').absolute();
      const file = await Node.fromPath(path);
      const content = (file as File).retrieve();
      expect(await content.text()).toEqual('helloworld');
      expect(content.text()).toEqual('helloworld');
    });
    test('FileContent stream', async () => {
      await fs.writeFile(TR + 'File/stream', 'helloworld');
      const path = new RelativePath(TR + 'File/stream').absolute();
      const file = await Node.fromPath(path);
      const stream = (file as File).retrieve().stream();
      expect(stream).toBeInstanceOf(ReadableStream);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      expect(Buffer.concat(chunks).toString()).toEqual('helloworld');
    });
    test('FileContent arrayBuffer', async () => {
      await fs.writeFile(TR + 'File/arrayBuffer', 'helloworld');
      const path = new RelativePath(TR + 'File/arrayBuffer').absolute();
      const file = await Node.fromPath(path);
      const content = (file as File).retrieve();
      const expected = new TextEncoder().encode('helloworld').buffer as ArrayBuffer;
      expect(await content.arrayBuffer()).toEqual(expected);
      expect(content.arrayBuffer()).toEqual(expected);
    });
    test('FileContent json', async () => {
      await fs.writeFile(TR + 'File/json', '{"hello": "world"}');
      const path = new RelativePath(TR + 'File/json').absolute();
      const file = await Node.fromPath(path);
      const content = (file as File).retrieve();
      expect(await content.json()).toEqual({ hello: 'world' });
      expect(content.json()).toEqual({ hello: 'world' });
    });
  });
});
