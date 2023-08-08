import { join } from 'std/path/mod.ts';

import { Store } from './core.ts';

declare global {
  // deno-lint-ignore no-var
  var USER_HOME: string;
  // deno-lint-ignore no-var
  var MF_HOME: string;
  // deno-lint-ignore no-var
  var LOCAL_STORE: Store;
  // deno-lint-ignore no-var
  var MASTER_STORE: Store;
  // deno-lint-ignore no-var
  var PRIMARY_REPO: string;
}

export default {
  setup: function () {
    const home = Deno.env.get('HOME')!;
    globalThis.USER_HOME = home;

    const mf = join(home, '.files');
    globalThis.MF_HOME = mf;

    const store = join(mf, 'store');
    globalThis.PRIMARY_REPO = join(store, 'dotfiles');

    const local = join(store, 'local');
    const master = join(store, 'master');

    globalThis.LOCAL_STORE = new Store(local);
    globalThis.MASTER_STORE = new Store(master);

    console.debug = () => {};
  }
};
