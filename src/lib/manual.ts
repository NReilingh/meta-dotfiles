import { pipe, Effect, Context } from 'effect';

type Placeholder<TInput> = string | ((input: TInput) => string);
type PromptScript<TInput> = Array<Placeholder<TInput>>;

export class UserIO extends Context.Tag("UserIOService")<
  UserIO,
  {
    readonly write: (x: any) => Effect.Effect<void>,
    readonly read: Effect.Effect<string>,
  }
>() {}

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
