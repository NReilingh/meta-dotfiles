import { join } from 'node:path';

import { Store } from './core.ts';

declare global {
  // deno-lint-ignore no-var
  var USER_HOME: string;
  // deno-lint-ignore no-var
  var DFI_HOME: string;
  // deno-lint-ignore no-var
  var LOCAL_STORE: Store;
  // deno-lint-ignore no-var
  var MASTER_STORE: Store;
  // deno-lint-ignore no-var
  var PRIMARY_REPO: string;
}

export default {
  setup: function () {
    const home = Bun.env.HOME!;
    globalThis.USER_HOME = home;

    const dfi = join(home, '.files');
    globalThis.DFI_HOME = dfi;

    const store = join(dfi, 'store');
    globalThis.PRIMARY_REPO = join(store, 'dotfiles');

    const local = join(store, 'local');
    const master = join(store, 'master');

    globalThis.LOCAL_STORE = new Store(local);
    globalThis.MASTER_STORE = new Store(master);

    console.debug = () => {};
  }
};
