import { pipe, Effect, Context } from 'effect';

type Placeholder<TInput> = string | ((input: TInput) => string);
type PromptScript<TInput> = Array<Placeholder<TInput>>;

/**
 * A service abstraction for interactive user I/O.
 *
 * The `@effect/platform` module does not yet have an IO abstraction.
 * It may have in the future, at which point this can be deprecated.
 */
export class UserIO extends Context.Tag("UserIOService")<
  UserIO,
  {
    readonly write: (x: any) => Effect.Effect<void>,
    readonly read: Effect.Effect<string>,
  }
>() {}

/**
 * An implementation of UserIO that provides for
 * reading and writing from the console.
 */
export const ConsoleIO: Context.Tag.Service<UserIO> = {
  write: x => Effect.sync(() => console.log(x)),
  read: Effect.promise<string>(async () => {
    const iterator = console[Symbol.asyncIterator]();
    const { value, done } = await iterator.next();
    await iterator.return?.();
    if (done) {
      return "";
    }
    return value;
  }),
};

/**
 * An effectful function that can be passed to `Effect.flatMap`
 * to prompt the operator to perform a manual step.
 *
 * @example
 * const program = pipe(
 *   Effect.succeed(42),
 *   Effect.flatMap(manualStep({
 *     script: promptScript`What color is this number? ${input => input.toString()}`,
 *     outputThunk: (input, value) => ({
 *       color: value,
 *       number: input
 *     }),
 *   })),
 * );
 */
export function manualStep<TInput, TOutput> (
  { script, outputThunk }: {
    script: PromptScript<TInput>,
    outputThunk: (input: TInput, value: string) => TOutput,
  }
): (input: TInput) => Effect.Effect<TOutput, unknown, UserIO> {
  return (input) => UserIO.pipe(
    Effect.flatMap(io => pipe(
      Effect.suspend(() => {
        const promptMessage =
          script.map(line => typeof line === "function" ? line(input) : line).join("");

        return io.write(promptMessage);
      }),
      Effect.flatMap(() => io.read),
      Effect.map(value => outputThunk(input, value)),
    )),
  );
}

/**
 * Template literal tag function for creating a prompt script.
 *
 * Interpolations are simply interleaved so that the resulting
 * value conforms to `PromptScript<TInput>`.
 *
 * Expected usage is that interpolated values can be string expressions,
 * but can also be functions that take the input value and return a string.
 * @example
 * const script = promptScript`
 * What letter comes after ${input => input.letter}?`;
 */
export function promptScript<TInput> (
  strings: TemplateStringsArray,
  ...args: PromptScript<TInput>
): PromptScript<TInput> {
  return args.reduce(
    (a, c, i) => a.concat([c, strings[i+1]]),
    Array<Placeholder<TInput>>(strings[0])
  );
}
