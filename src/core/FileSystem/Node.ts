
// Define type Node as algebraic union of File and Directory
//
import { Path } from './Path.ts';

export interface Node {
  path: Path
}
