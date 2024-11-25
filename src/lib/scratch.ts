import { Console, Effect, Context, Layer } from 'effect';
import { Prompt } from '@effect/cli';
import { QuitException, Terminal } from '@effect/platform/Terminal';
import { BunContext } from '@effect/platform-bun';
import { Error } from '@effect/platform';

// Tag definition
export class UserPrompt extends Context.Tag("UserPromptService")<
  UserPrompt,
  {
    readonly prompt: (query: string) => Effect.Effect<string, never | QuitException | Error.PlatformError>,
  }
>() {}

// Service option
export class EffectPromptService extends Effect.Service<UserPrompt>()("UserPromptService", {
  succeed: {
    prompt: (query: string) => Prompt.text({ message: query }),
  },
  dependencies: [Layer.service(Terminal)],
}) {}

// Layer option
export const EffectPromptLayer = Layer.effect(UserPrompt, Terminal.pipe(
  Effect.map(t => ({
    prompt: (query: string) => Prompt.text({ message: query })
      .pipe(Effect.provideService(Terminal, t)),
  })),
));

// Test case
const program = UserPrompt.pipe(
  Effect.flatMap(p => p.prompt("What is your name?")),
  Effect.flatMap(Console.log),
);

const runnable = program.pipe(
  // Choose:
  // Effect.provide(EffectPromptService.Default),
  // OR
  Effect.provide(EffectPromptLayer),
  // (both work)
  Effect.provide(BunContext.layer),
);

await Effect.runPromiseExit(runnable);
