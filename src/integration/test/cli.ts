import { $ } from 'bun';
import { describe, expect, test } from 'bun:test';

export default function (executable: string) {
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
}

