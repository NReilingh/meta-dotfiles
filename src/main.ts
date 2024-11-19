// import config from './config.ts';
// import * as cmd from './commands/mod.ts';

import { Command, Options } from '@effect/cli';
import { Console, Effect, Boolean, pipe } from 'effect';
import { BunContext, BunRuntime } from '@effect/platform-bun';

// config.setup();

import { manualStep, promptScript, ConsoleIO, UserIO } from './lib/manual.ts';

const testPrompt = Command.make('prompt', {}, () =>
  pipe(
    Effect.succeed(42),
    Effect.flatMap(manualStep({
      script: promptScript`What color is this number? ${input => input.toString()}`,
      outputThunk: (input, value) => ({
        color: value,
        number: input
      }),
    })),
    Effect.flatMap((a) => Console.log(a)),
  )
);

const helloWorld = Command.make('hello', {}, () => Console.log('Hello, World!'));

const confirm = Options.boolean('confirm').pipe(Options.withAlias('c'));
const command = Command
  .make('dfi', { confirm }, ({ confirm }) =>
    Boolean.match(confirm, {
      onFalse: () => Console.log("We are running in confirmation mode."),
      onTrue: () => Console.log("We are not running in confirmation mode.")
    }))
  .pipe(Command.withSubcommands([
    helloWorld,
    testPrompt,
    // cmd.add,
    // cmd.init,
    // cmd.inherit,
    // cmd.join,
    // cmd.merge,
    // cmd.sync,
  ]));

const cli = Command.run(command, {
  name: 'meta-dotfiles',
  version: '0.0.1',
});

Effect.suspend(() => cli(Bun.argv)).pipe(
  Effect.provide(BunContext.layer),
  Effect.provideService(UserIO, ConsoleIO),
  BunRuntime.runMain
);

