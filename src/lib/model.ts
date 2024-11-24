import { FileSystem, Terminal } from "@effect/platform"
import { BunContext } from "@effect/platform-bun"
import { Console, Layer, Context } from "effect"
import { Prompt } from '@effect/cli';
import * as Effect from "effect/Effect"

export class Cache extends Effect.Service<Cache>()("app/Cache", {
  // define how to create the service
  // You can also use the "scoped", "sync" or "succeed" keys to create your service
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const lookup = (key: string) => fs.readFileString(`src/lib/cache/${key}`)
    return { lookup,
    prompt: (query: string) => Prompt.text({ message: query }),
    }
  }),
  // provide dependencies
  dependencies: [Layer.service(Terminal.Terminal), Layer.service(FileSystem.FileSystem)],
}) {};


// Layer for use in the application
// const layer: Layer.Layer<Cache> = Cache.Default

// console.log(Effect.serviceMembers(layer).lookup);

// Layer without dependencies provided
// const layerNoDeps: Layer.Layer<Cache, never, FileSystem.FileSystem> =
//   Cache.DefaultWithoutDependencies

const program = Cache.pipe(
  Effect.flatMap(cache => cache.prompt("hwllo")),
  Effect.flatMap(Console.log)
);

class Random extends Context.Tag("Random")<
  Random,
  {
    readonly nextInt: Effect.Effect<number>;
    readonly nextBool: Effect.Effect<boolean>;
    readonly nextIntBetween: (
      min: number,
      max: number
    ) => Effect.Effect<number>;
  }
>() {
  static readonly Mock = Layer.succeed(Random, {
    nextInt: Effect.succeed(42),
    nextBool: Effect.succeed(true),
    nextIntBetween: (min, max) => Effect.succeed(min + max),
  });
}

const foo = Effect.serviceMembers(Random);
const bar = Effect.serviceMembers(Cache);

//
const runnable = program.pipe(
  Effect.provide(Cache.Default),
  Effect.provide(BunContext.layer)
);
// Run the program
await Effect.runPromise(runnable);

// `Cache` type also represents the service itself
// declare const cache: Cache
// cache.lookup("foo")
