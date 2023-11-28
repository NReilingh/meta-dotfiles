import { Node } from './Node.ts';
import { AbsolutePath } from './Path.ts';

export class Directory extends Node {
  constructor (path: AbsolutePath, inode?: number) {
    super(path, inode);
  }
}
