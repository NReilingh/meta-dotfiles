import { Effect, Context, Layer } from 'effect';
import { Prompt } from '@effect/cli';
import { Terminal, QuitException } from '@effect/platform/Terminal';
import { Error } from '@effect/platform';

/**
 * A service abstraction for prompting the user for input.
 *
 * Intended to support interactive console usage as well as
 * headless circumstances where the user may be prompted via Slack
 * or another web frontend.
 */
export class UserPrompt extends Context.Tag("UserPromptService")<
  UserPrompt,
  {
    readonly prompt: (query: string) => Effect.Effect<string, never | QuitException | Error.PlatformError>,
  }
>() {}

/**
 * An effectful function that can be passed to `Effect.flatMap`
 * to prompt the operator to perform a manual step.
 *
 * This should be used differently from `@ffect/cli/Prompt` in that
 * a `manualStep` should eventually be replaced with an automated solution.
 *
 * `manualStep`'s implementation may end up using Prompt
 * in interactive CLI contexts,
 * but could also be a web frontend or Slack message.
 *
 * Prompt should still be used when the user's participation is always desired.
 * However, ideally this will be accomplished using Args/Opts with Prompt fallbacks.
 *
 * It's entirely possible that this outputThunk pattern is trivially replacable
 * with a combinator using the UserPrompt service directly.
 *
 * I guess it's just Effect.Effect.pipe after all?
 * The function just gets use the convenience of UserPrompt
 * without so much ceremony.
 *
 * @example
 * const program = pipe(
 *   Effect.succeed(42),
 *   Effect.flatMap((input) => manualStep(
 *     `What color is this number? ${input}`,
 *     (value) => ({
 *       color: value,
 *       number: input
 *     }),
 *   )),
 * );
 */
export function manualStep<TOutput> (
  script: string,
  outputThunk?: (value: string) => TOutput,
) {
  return UserPrompt.pipe(
    Effect.flatMap(({ prompt }) => prompt(script)),
    Effect.map(value => outputThunk ? outputThunk(value) : value),
  );
}

// Some "batteries included" implementations of UserPrompt

/**
 * An implementation of UserPrompt using the `@effect/cli/Prompt` library.
 */
export const EffectPrompt = Layer.effect(UserPrompt, Terminal.pipe(
  Effect.map(t => ({
    prompt: (query: string) => Prompt.text({ message: query })
      .pipe(Effect.provideService(Terminal, t)),
  })),
));

/**
 * An implementation of UserPrompt using Effect's Terminal interface.
 */
export const TerminalPrompt = Layer.effect(
  UserPrompt,
  Terminal.pipe(
    Effect.map(t => ({
      prompt: (query: string) => Effect.zipRight(t.display(query + ' '), t.readLine),
    })),
  )
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
