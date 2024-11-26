import { test, expect } from 'bun:test';

import { cli } from './main.ts';

test("CLI is function",  () => {
  expect(cli.constructor.name).toBe('Function');
});
