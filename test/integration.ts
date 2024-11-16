import { $ } from 'bun';
import { beforeAll, describe, expect, test } from 'bun:test';

const executable = './build/test/dfi';

beforeAll(async () => {
  await $`bun build ./src/main.ts --compile --outfile ${executable}`;
});

describe('executable', () => {
  test('prints version', async () => {
    const result = await $`${executable} --version`.text();
    expect(result).toContain('0.0.1');
  });

  test('says hello', async () => {
    const result = await $`${executable} hello`.text();
    expect(result).toContain('Hello, World!');
  });

  test('passes an option', async () => {
    const result = await $`${executable} -c`.text();
    expect(result).toContain('We are not running in confirmation mode.');
  });
});


