import config from './config.ts';
import * as cmd from './commands/mod.ts';

import { type Args } from './core.ts';

config.setup();

const args: Args = Bun.argv.slice(2);

const command = args.shift();

switch (command) {
  case 'init': {
    cmd.init();
    break;
  }

  case 'join': {
    cmd.join(args);
    break;
  }

  case 'inherit': {
    cmd.inherit(args);
    break;
  }

  case 'add': {
    cmd.add(args);
    break;
  }

  case 'sync': {
    cmd.sync();
    break;
  }

  case 'merge': {
    cmd.merge();
    break;
  }

  case 'doom': {
    console.log("Madvillainy");
    break;
  }

  case 'debug': {
    console.dir(globalThis);
    break;
  }

  default: {
    console.log("Unknown command", command);
  }
}

