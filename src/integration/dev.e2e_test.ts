import { $ } from 'bun';
import { beforeAll } from 'bun:test';

import cliTest from './test/cli.ts';

const executable = './build/test/dfi';

beforeAll(async () => {
  await $`bun build ./src/main.ts --compile --outfile ${executable}`;
  await $`${executable} --version`.quiet();
});

cliTest(executable);

