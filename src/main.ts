// import config from './config.ts';
// import * as cmd from './commands/mod.ts';

import { Command, Options } from '@effect/cli';
import { Console, Effect } from 'effect';
import { BunContext, BunRuntime } from '@effect/platform-bun';

// config.setup();

const confirm = Options.boolean('confirm').pipe(Options.withAlias('c'));
const command = Command
  .make('mf', { confirm }, ({ confirm }) =>
    Console.log(`Hello this is the mf command and we are${confirm ? '' : ' NOT'} in confirmation mode.`),
  );
  // .pipe(Command.withSubcommands([
  //   cmd.add,
  //   cmd.init,
  //   cmd.inherit,
  //   cmd.join,
  //   cmd.merge,
  //   cmd.sync,
  // ]));

const cli = Command.run(command, {
  name: 'meta-dotfiles',
  version: '0.0.1',
});

Effect.suspend(() => cli(Bun.argv.slice(2))).pipe(
  Effect.provide(BunContext.layer),
  BunRuntime.runMain
);

