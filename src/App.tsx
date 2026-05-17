import { useReducer } from "react"
import Header from "./components/layout/Header"
import StepView from "./components/layout/StepView"
import { initialState, reducer } from "./state/reducer"

function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <div className="app">
      <Header />
      <main className="main">
        <StepView state={state} dispatch={dispatch} />
      </main>
    </div>
  )
}

export default App
