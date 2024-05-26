import { AbsolutePath, RelativePath } from './Path.ts';
import { Node, File, Directory, DirContent, DirRetrieveOpts } from './Node.ts';
import { test, expect, describe, beforeAll } from 'bun:test';
import * as fs from 'node:fs/promises';

import { relative, join } from 'node:path';

function AP (testPath: string) {
  return new RelativePath(
    join(
      'build/test',
      (r => r.slice(r.indexOf('/')+1))(relative(process.cwd(), import.meta.dir)),
      import.meta.file.split('.')[0]
  ) + '/')
    .absolute()
    .join(new RelativePath(testPath));
}

function PS (testPath: string) {
  return AP(testPath).toString();
}

const TR = PS('.');
console.log('TestRoot is:', TR);

async function cleanDir (testPath: string) {
  const path = PS(testPath);
  await fs.rm(path, { recursive: true, force: true });
  await fs.mkdir(path, { recursive: true });
}

await cleanDir('.');

describe('Node instantiation', () => {
  beforeAll(async () => {
    await cleanDir('construct');
    await fs.mkdir(PS('construct/dir'));
    await fs.writeFile(PS('construct/file'), '');
  });

  test('Path missing', async () => {
    const path = AP('construct/missing');
    const node = await Node.fromPath(path);
    expect(node).toBeFalse();
  });
  test('Dir from path', async () => {
    const path = AP('construct/dir');
    const node = await Node.fromPath(path);
    expect(node).toBeTruthy();
    expect(node).toBeInstanceOf(Node);
    expect(node).toBeInstanceOf(Directory);
  });
  test('File from path', async () => {
    const path = AP('construct/file');
    const node = await Node.fromPath(path);
    expect(node).toBeTruthy();
    expect(node).toBeInstanceOf(Node);
    expect(node).toBeInstanceOf(File);
  });
});

describe('File class', () => {
  beforeAll(async () => {
    await cleanDir('File');
  });
  describe('File retrieval', () => {
    beforeAll(async () => {
      await fs.writeFile(PS('File/retrieve'), '');
    });
    test('FileContent type', async () => {
      const path = AP('File/retrieve');
      const file = await Node.fromPath(path);
      const content = (file as Node).retrieve()
      expect(content).toHaveProperty('text');
      expect(content).toHaveProperty('stream');
      expect(content).toHaveProperty('arrayBuffer');
      expect(content).toHaveProperty('json');
    });
    test('FileContent text', async () => {
      await fs.writeFile(PS('File/text'), 'helloworld');
      const path = AP('File/text');
      const file = await Node.fromPath(path);
      const content = (file as File).retrieve();
      expect(await content.text()).toEqual('helloworld');
    });
    test('FileContent stream', async () => {
      await fs.writeFile(PS('File/stream'), 'helloworld');
      const path = AP('File/stream');
      const file = await Node.fromPath(path);
      const stream = (file as File).retrieve().stream();
      expect(stream).toBeInstanceOf(ReadableStream);
      const chunks = <any>[];
      for await (const chunk of stream as unknown as  AsyncIterable<any>) {
        chunks.push(Buffer.from(chunk));
      }
      expect(Buffer.concat(chunks).toString()).toEqual('helloworld');
    });
    test('FileContent arrayBuffer', async () => {
      await fs.writeFile(PS('File/arrayBuffer'), 'helloworld');
      const path = AP('File/arrayBuffer');
      const file = await Node.fromPath(path);
      const content = (file as File).retrieve();
      const expected = new TextEncoder().encode('helloworld').buffer as ArrayBuffer;
      expect(await content.arrayBuffer()).toEqual(expected);
      expect(content.arrayBuffer()).toEqual(expected);
    });
    test('FileContent json', async () => {
      await fs.writeFile(PS('File/json'), '{"hello": "world"}');
      const path = AP('File/json');
      const file = await Node.fromPath(path);
      const content = (file as File).retrieve();
      expect(await content.json()).toEqual({ hello: 'world' });
      expect(content.json()).toEqual({ hello: 'world' });
    });
  });
});

describe('Directory class', () => {
  beforeAll(async () => {
    await cleanDir('dir');
  });

  describe('Directory retrieval', () => {
    beforeAll(async () => {
      await cleanDir('dir/ret');
      await fs.mkdir(PS('dir/ret/sub/child'), { recursive: true });
      await fs.writeFile(PS('dir/ret/fileone'), '');
      await fs.writeFile(PS('dir/ret/filetwo'), '');
      await fs.writeFile(PS('dir/ret/sub/filethree'), '');
    });
    test('One directory level async memoed', async () => {
      const path = AP('dir/ret');
      console.log(path.toString());
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

    describe.skip('Descendant Path filtering', () => {
      async function pathsFromFilterOpts (opts: DirRetrieveOpts): Promise<AbsolutePath[]> {
        const dir = Node.fromPath(new RelativePath(TR + 'dir/ret').absolute(), { sync: true }) as Directory;
        const entries = await fs.readdir(dir.path.toString(), { withFileTypes: true, recursive: true });
        return dir['descendantPathsFilter'](entries, opts);
      }
      test.skip('descendantPathsFilter recursive', async () => {
        const paths = await pathsFromFilterOpts({ recursive: true });
        expect(paths).toBeInstanceOf(Array);
        expect(paths).toBeArrayOfSize(3);
        expect(paths[0]).toBeInstanceOf(AbsolutePath);
        paths.sort((a, b) => a.toString().localeCompare(b.toString()));
        expect(paths[0].toString()).toContain('ret/fileone');
      });
    });

    test.skip('Get recursive descendant file paths async', async () => {
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
