import { manualStep, UserPrompt, EffectPrompt, ConsolePrompt, TerminalPrompt } from './manual.ts';
import { Effect, Context, pipe } from 'effect';

import { test, expect, describe, mock } from 'bun:test';

function makeMockPrompt (writeMock?: (x: any) => Effect.Effect<string>, readString?: string): Context.Tag.Service<UserPrompt> {
  return {
    prompt: writeMock ?? (() => Effect.succeed(readString ?? "")),
  };
}

describe("ConsolePrompt service implementation", () => {
  test("write calls console.log", async () => {
    const consoleMock = mock();
    globalThis.console = {
      log: consoleMock,
      async *[Symbol.asyncIterator] () {
        yield "fooYield";
      },
    } as unknown as Console;

    await Effect.runPromise(ConsolePrompt.prompt("hello world"));
    expect(consoleMock).toHaveBeenCalledWith("hello world");
  });

  test("read returns console input", async () => {
    globalThis.console = {
      async *[Symbol.asyncIterator] () {
        yield "fooYield";
      },
    } as unknown as Console;

    const result = await Effect.runPromise(ConsoleIO.read);
    expect(result).toBe("fooYield");

    globalThis.console = {
      async *[Symbol.asyncIterator] () { },
    } as unknown as Console;
    const secondResult = await Effect.runPromise(ConsoleIO.read);
    expect(secondResult).toBe("");
  });
});

describe("manualStep", () => {
  test("returns a function", () => {
    const result = manualStep({
      script: [''],
      outputThunk: () => null,
    });
    expect(typeof result).toBe("function");
  });

  test("return function returns an effect", () => {
    const step = manualStep({
      script: [''],
      outputThunk: () => null,
    });
    const result = step(null);
    expect(result.constructor.name).toBe('EffectPrimitive');
  });

  test("passes input to outputThunk", async () => {
    const outputMock = mock();
    const step = manualStep({
      script: [''],
      outputThunk: outputMock,
    });
    const program = step('helloInputTest')
      .pipe(Effect.provideService(UserIO, makeMockIO()));
    await Effect.runPromise(program);
    expect(outputMock).toHaveBeenCalledWith('helloInputTest', '');
  });

  test("writes prompt message", async () => {
    const step = manualStep({
      script: ["What is your favorite color? "],
      outputThunk: () => null,
    });
    const writeMock = mock(() => Effect.sync(() => {}));
    const program = step(null)
      .pipe(Effect.provideService(UserIO, makeMockIO(writeMock)));
    await Effect.runPromise(program);
    expect(writeMock).toHaveBeenCalledWith("What is your favorite color? ");
  });

  test("passes user input to outputThunk", async () => {
    const outputMock = mock();
    const step = manualStep({
      script: ["What is your favorite color? "],
      outputThunk: outputMock,
    });
    const program = step(null)
      .pipe(Effect.provideService(UserIO, makeMockIO(undefined, "blue")));
    await Effect.runPromise(program);
    expect(outputMock).toHaveBeenCalledWith(null, "blue");
  });

  test("outputThunk result is returned", async () => {
    const step = manualStep({
      script: [''],
      outputThunk: () => "fooBar",
    });
    const program = step(null)
      .pipe(Effect.provideService(UserIO, makeMockIO()));
    const result = await Effect.runPromise(program);
    expect(result).toBe("fooBar");
  });

  test("full send", async () => {
    const program = pipe(
      Effect.succeed(42),
      Effect.flatMap(manualStep({
        script: promptScript`What color is this number? ${input => input.toString()}`,
        outputThunk: (input, value) => ({
          color: value,
          number: input
        }),
      })),
    );

    const io = makeMockIO(undefined, "blue");
    const result = await Effect.runPromise(
      program.pipe(Effect.provideService(UserIO, io))
    );
    expect(result).toEqual({
      color: "blue",
      number: 42,
    });
  });
});

