import AppContainer from "./components/layout/AppContainer"
import Header from "./components/layout/Header"

function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <AppContainer>
          {/* Steps component go in here */}
        </AppContainer>
      </main>
    </div>
  )
}

export default App
