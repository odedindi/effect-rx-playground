import { Rx, RxRef } from "@effect-rx/rx-react"
import * as Http from "@effect/platform/HttpClient"
import * as Schema from "@effect/schema/Schema"
import { Context, Effect, Layer, Option, Stream } from "effect"

export class Todo extends Schema.Class<Todo>("Todo")({
  id: Schema.number,
  title: Schema.string,
  completed: Schema.boolean,
}) {
  static readonly array = Schema.array(Todo)
  static readonly chunk = Schema.chunk(Todo)
}

const make = Effect.gen(function* (_) {
  const defaultClient = yield* _(Http.client.Client)
  const client = defaultClient.pipe(
    Http.client.mapRequest(
      Http.request.prependUrl("https://jsonplaceholder.typicode.com"),
    ),
    Http.client.filterStatusOk,
  )

  const getTodos = Http.request.get("/todos")
  const todosChunk = Http.response.schemaBodyJson(Todo.chunk)
  const todos = (perPage: number) =>
    Stream.paginateChunkEffect(1, page =>
      getTodos.pipe(
        Http.request.setUrlParams({
          _page: page.toString(),
          _limit: perPage.toString(),
        }),
        client,
        Effect.flatMap(todosChunk),
        Effect.scoped,
        Effect.map(chunk => [
          chunk,
          Option.some(page + 1).pipe(
            Option.filter(() => chunk.length === perPage),
          ),
        ]),
      ),
    )

  return { todos } as const
})

export class Todos extends Context.Tag("Todos")<
  Todos,
  Effect.Effect.Success<typeof make>
  >() {
  static Live = Layer.effect(Todos, make).pipe(
    Layer.provide(Http.client.layer),
  )
 };

// Rx exports

const todosRuntime = Rx.runtime(Todos.Live)

export const perPage = Rx.make(5)

export const stream = todosRuntime.pull(get =>
  Stream.unwrap(Effect.map(Todos, _ => _.todos(get(perPage)))).pipe(
    // preload the next page
    Stream.bufferChunks({ capacity: 1 }),
    Stream.map(RxRef.make),
  ),
)

export const isDone = Rx.make(get => {
  const r = get(stream)
  return r._tag === "Success" && r.value.done
})
