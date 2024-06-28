import {
  useRx,
  useRxSet,
  useRxSuspenseSuccess,
  useRxValue,
} from "@effect-rx/rx-react"
import { type FC, Suspense, useState } from "react"
import * as Todos from "./services/todos"
import { getIdRx } from "./worker/client"

const App: FC = () => (
  <>
    <WorkerWrap />
    <h3>Stream list</h3>
    <Suspense fallback={<p>Loading...</p>}>
      <TodoStreamList />
    </Suspense>
    <PullButton />
    <br />
    <PerPageSelect />
    <h3>Effect list</h3>
    <Suspense fallback={<p>Loading...</p>}>
      <TodoEffectList />
    </Suspense>
  </>
)

export default App

const WaitingOrLoaded: FC<{ waiting?: boolean }> = ({ waiting }) => (
  <p
    style={{
      color: waiting ? "blue" : "green",
      fontWeight: "bold",
    }}
  >
    {waiting ? "Waiting" : "Loaded"}
  </p>
)

const TodoStreamList = () => {
  const result = useRxSuspenseSuccess(Todos.stream)

  return (
    <>
      {result.value.items.map(todo => (
        <Todo key={todo.id} todo={todo} />
      ))}
      <WaitingOrLoaded waiting={result.waiting} />
    </>
  )
}

const TodoEffectList: FC = () => {
  const result = useRxSuspenseSuccess(Todos.effect)
  return (
    <>
      {result.value.map(todo => (
        <Todo key={todo.id} todo={todo} />
      ))}
      <WaitingOrLoaded waiting={result.waiting} />{" "}
    </>
  )
}

const Todo: FC<{ readonly todo: Todos.Todo }> = ({ todo }) => (
  <p style={{ textAlign: "left" }}>
    <input checked={todo.completed} type="checkbox" disabled />
    &nbsp;{todo.title}
  </p>
)

const PullButton: FC = () => {
  const pull = useRxSet(Todos.stream)
  const done = useRxValue(Todos.streamIsDone)
  return (
    <button onClick={() => pull()} disabled={done}>
      Pull more
    </button>
  )
}

const PerPageSelect: FC = () => {
  const [n, set] = useRx(Todos.perPage)
  return (
    <label>
      Per page:
      <select value={n} onChange={({ target }) => set(Number(target.value))}>
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
      </select>
    </label>
  )
}

const WorkerWrap: FC = () => {
  const [mount, setMount] = useState(false)
  return (
    <>
      <button onClick={() => setMount(prev => !prev)}>
        {mount ? "Stop" : "Start"} worker
      </button>
      {mount ? <WorkerButton /> : null}
    </>
  )
}

const WorkerButton: FC = () => {
  const getById = useRxSet(getIdRx)
  return <button onClick={() => getById("2")}>Get ID from worker</button>
}
