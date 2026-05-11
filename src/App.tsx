import { Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LobbyPage } from './pages/LobbyPage'
import { GamePage } from './pages/GamePage'

function App() {
  return (
    <div className="app-frame">
      <header className="app-header">
        <div className="app-header__title">
          <span>DiXit</span>
        </div>
        <div className="app-header__tagline">
          Play the storytelling card game with friends online.
        </div>
        <div className="app-header__pill">Prototype</div>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby/:lobbyCode" element={<LobbyPage />} />
        <Route path="/game/:lobbyCode" element={<GamePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
  )
}

export default App
