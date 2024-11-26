import { test, expect } from 'bun:test';

import { cli } from './main.ts';

// We're really only doing this to get watch mode to work on tests.
test("CLI is function",  () => {
  expect(cli.constructor.name).toBe('Function');
});
