import { useReducer } from "react"
import Header from "./components/layout/Header"
import StepView from "./components/layout/StepView"
import { initialState, reducer } from "./state/reducer"
import styles from "./App.module.css"

function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <div className={styles.app}>
      <Header />
      <main className={styles.main}>
        <StepView state={state} dispatch={dispatch} />
      </main>
    </div>
  )
}

export default App
