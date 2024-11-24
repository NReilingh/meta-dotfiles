import { Console, Effect, Context, Layer } from 'effect';
import { Prompt } from '@effect/cli';
import { QuitException, Terminal } from '@effect/platform/Terminal';
import { BunContext, BunTerminal } from '@effect/platform-bun';

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
  // succeed: {
  //   prompt: (query: string) => Prompt.text({ message: query }),
  // },
  // Equivalent?
  effect: Effect.succeed({
    prompt: (query: string) => Prompt.text({ message: query }),
  }),
  // dependencies: [BunContext.layer], // Seems strange to pass this here since
  // usually all requirements are fulfilled just before execution
  // Use this instead?
  dependencies: [Layer.service(Terminal)],
}) {}

const testing = Effect.serviceMembers(EffectPrompt);

// Test case
const program = UserPrompt.pipe(
  Effect.flatMap(p => p.prompt("What is your name?")),
  Effect.flatMap(Console.log),
);

// const runnable = Effect.provideService(program, UserPrompt, EffectPrompt);
// Error: property `prompt` is missing. Seems like this should 
// have cause typechecking issues above at the definition
// Equivalent?
const runnable = program.pipe(
  Effect.provide(EffectPrompt.Default),
  Effect.provide(BunTerminal.layer),
);
// causes error in last line with `UserPrompt not assignable to never`
// -- apparently EffectPrompt.Default not actually providing UserPrompt

await Effect.runPromiseExit(runnable.pipe(Effect.provide(BunTerminal.layer)));
