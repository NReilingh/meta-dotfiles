import {
  manualStep,
  UserPrompt,
  EffectPrompt,
  ConsolePrompt,
  TerminalPrompt,
} from './manual.ts';
import { Effect, Context, Option, pipe } from 'effect';
import { test, expect, describe, mock } from 'bun:test';

function makeMockPrompt (
  writeMock?: (x: any) => Effect.Effect<string>, readString?: string
): Context.Tag.Service<UserPrompt> {
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

import { Terminal, UserInput } from '@effect/platform/Terminal';

function makeMockTerminal (
  displayMock?: () => Effect.Effect<void>
): Context.Tag.Service<typeof Terminal> {
  return Terminal.of({
    columns: Effect.succeed(80),
    readInput: Effect.succeed(<UserInput>{
      input: Option.none(),
      key: {
        name: 'enter',
        ctrl: false,
        meta: false,
        shift: false,
      },
    }),
    readLine: Effect.succeed('a'),
    display: displayMock ?? (() => Effect.succeed(undefined)),
  });
}

describe("EffectPrompt service implementation", () => {
  test("prompt displays message", async () => {
    const displayMock = mock(() => Effect.succeed(undefined));
    const program = UserPrompt.pipe(
      Effect.flatMap(p => p.prompt("What is your favorite color?")),
      Effect.provide(EffectPrompt),
      Effect.provideService(Terminal, makeMockTerminal(displayMock))
    );
    await Effect.runPromise(program);
    expect(displayMock.mock.calls.join('')).toContain("What is your favorite color?");
  });
});

describe("TerminalPrompt service implementation", () => {
  test("prompt displays message", async () => {
    const displayMock = mock(() => Effect.succeed(undefined));
    const program = UserPrompt.pipe(
      Effect.flatMap(p => p.prompt("Append space here>")),
      Effect.provide(TerminalPrompt),
      Effect.provideService(Terminal, makeMockTerminal(displayMock))
    );
    await Effect.runPromise(program);
    expect(displayMock).toHaveBeenCalledWith("Append space here> ");
  });
});

describe("ConsolePrompt service implementation", () => {
  function makeMockConsole (
    logMock?: (x: any) => void,
    readOpts?: {
      readString?: string,
      empty?: boolean,
    }
  ): void {
    globalThis.console = {
      log: logMock ?? (() => {}),
      async *[Symbol.asyncIterator] () {
        if (readOpts?.empty) {
          return;
        }
        yield readOpts?.readString ?? "";
      },
    } as unknown as Console;
  }

  test("write calls console.log", async () => {
    const consoleMock = mock();
    makeMockConsole(consoleMock);

    await Effect.runPromise(ConsolePrompt.prompt("hello world"));
    expect(consoleMock).toHaveBeenCalledWith("hello world");
  });

  test("read returns empty string with no console input", async () => {
    makeMockConsole(undefined, { empty: true });

    const result = await Effect.runPromise(ConsolePrompt.prompt("Hello"));
    expect(result).toBe('');
  });

  test("read returns console input", async () => {
    makeMockConsole(undefined, { readString: "fooYield" });

    const result = await Effect.runPromise(ConsolePrompt.prompt("Hello"));
    expect(result).toBe("fooYield");

    makeMockConsole();

    const secondResult = await Effect.runPromise(ConsolePrompt.prompt("Hello"));
    expect(secondResult).toBe('');
  });
});


