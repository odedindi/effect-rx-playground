import * as Runner from "@effect/platform/WorkerRunner"
import * as BrowserRunner from "@effect/platform-browser/BrowserWorkerRunner"
import { Requests } from "./schema"
import { Effect, Layer } from "effect"

// eslint-disable-next-line @typescript-eslint/no-floating-promises
Runner.layerSerialized(Requests, {
  InitialMessage: arg =>
    // eslint-disable-next-line require-yield
    Effect.gen(function* (fnArg) {
      console.log("[InitialMessage]: Hello from worker", arg, fnArg)
    }),
  GetId: ({ id }) => Effect.succeed(id),
}).pipe(Layer.provide(BrowserRunner.layer), Layer.launch, Effect.runPromise)
