import config from './config.ts';
import { parse } from "std/flags/mod.ts";
import * as cmd from './commands/mod.ts';

import { type Args } from './core.ts';

config.setup();

const args: Args = parse(Deno.args)._;

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

  default: {
    console.log("Unknown command", command);
  }
}

