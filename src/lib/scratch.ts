import { Console, Effect, Context, Layer } from 'effect';
import { Prompt } from '@effect/cli';
import { Terminal, QuitException } from '@effect/platform/Terminal';
import { BunContext, BunRuntime } from '@effect/platform-bun';

/**
 * A service abstraction for prompting the user for input.
 */
export class UserPrompt extends Context.Tag("UserPromptService")<
  UserPrompt,
  {
    readonly prompt: (query: string) => Effect.Effect<string, never | QuitException>,
  }
>() {}

/**
 * An implementation of UserPrompt using the `@effect/cli/Prompt` library.
 */
export class EffectPrompt extends Effect.Service<EffectPrompt>()('UserPrompt', {
  succeed: {
    prompt: (query: string) => Prompt.text({ message: query }),
  },
  // effect: Effect.succeed({
  //   prompt: (query: string) => Prompt.text({ message: query }),
  // }),
  // define how to create the service
  // You can also use the "scoped", "sync" or "succeed" keys to create your service
  // provide dependencies
  dependencies: [BunContext.layer],
}) {}
//
// Test case
const program = UserPrompt.pipe(
  Effect.flatMap(p => p.prompt("What is your name?")),
  Effect.flatMap(Console.log),
);

/**
 * An implementation of UserPrompt using dumb console IO.
 */
export const ConsolePrompt: Context.Tag.Service<UserPrompt> = {
  prompt: query => Effect.promise<string>(async () => {
    console.log(query);

    const iterator = console[Symbol.asyncIterator]();
    const { value, done } = await iterator.next();
    await iterator.return?.();
    if (done) {
      return "";
    }
    return value;
  }),
};

// await Effect.runPromise(program.pipe(Effect.provideService(UserPrompt, ConsolePrompt)));

// const requirements = Layer.provide(TerminalPrompt, BunContext.layer);

const runnable = Effect.provide(program, EffectPrompt.Default);
//
await Effect.runPromiseExit(runnable);
