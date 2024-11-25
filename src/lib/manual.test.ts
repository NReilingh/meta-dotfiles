import { manualStep, UserPrompt, EffectPrompt, ConsolePrompt, TerminalPrompt } from './manual.ts';
import { Effect, Context, pipe } from 'effect';

import { test, expect, describe, mock } from 'bun:test';

function makeMockPrompt (writeMock?: (x: any) => Effect.Effect<string>, readString?: string): Context.Tag.Service<UserPrompt> {
  return UserPrompt.of({
    prompt: writeMock ?? (() => Effect.succeed(readString ?? "")),
  });
}

describe("manualStep", () => {
  test("returns an Effect", () => {
    const result = manualStep('', () => null);
    expect(result.constructor.name).toBe('EffectPrimitive');
  });

  test("writes prompt message", async () => {
    const writeMock = mock(() => Effect.sync(() => ''));
    const program = manualStep("What is your favorite color?", () => null)
      .pipe(Effect.provideService(UserPrompt, makeMockPrompt(writeMock)));
    await Effect.runPromise(program);
    expect(writeMock).toHaveBeenCalledWith("What is your favorite color?");
  });

  test("passes user input to outputThunk", async () => {
    const outputMock = mock();
    const program = manualStep('', outputMock)
      .pipe(Effect.provideService(UserPrompt, makeMockPrompt(undefined, "blue")));
    await Effect.runPromise(program);
    expect(outputMock).toHaveBeenCalledWith("blue");
  });

  test("outputThunk result is returned", async () => {
    const program = manualStep('', () => "fooBar")
      .pipe(Effect.provideService(UserPrompt, makeMockPrompt()));
    const result = await Effect.runPromise(program);
    expect(result).toBe("fooBar");
  });

  test("full send", async () => {
    const program = pipe(
      Effect.succeed(42),
      Effect.flatMap((input) => manualStep(
        `What color is this number? ${input}`,
        (value) => ({
          color: value,
          number: input
        })
      )),
    );

    const prompt = makeMockPrompt(undefined, "blue");
    const result = await Effect.runPromise(
      program.pipe(Effect.provideService(UserPrompt, prompt))
    );
    expect(result).toEqual({
      color: "blue",
      number: 42,
    });
  });
});

describe("ConsolePrompt service implementation", () => {
  function makeMockConsole (
    logMock?: (x: any) => void,
    readString?: string
  ): void {
    globalThis.console = {
      log: logMock ?? (() => {}),
      async *[Symbol.asyncIterator] () {
        yield readString ?? "";
      },
    } as unknown as Console;
  }
  test("write calls console.log", async () => {
    const consoleMock = mock();
    makeMockConsole(consoleMock);

    await Effect.runPromise(ConsolePrompt.prompt("hello world"));
    expect(consoleMock).toHaveBeenCalledWith("hello world");
  });

  test("read returns console input", async () => {
    makeMockConsole(undefined, "fooYield");

    const result = await Effect.runPromise(ConsolePrompt.prompt(''));
    expect(result).toBe("fooYield");

    makeMockConsole();

    const secondResult = await Effect.runPromise(ConsolePrompt.prompt(''));
    expect(secondResult).toBe('');
  });
});


