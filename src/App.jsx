import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SessionSetup from './pages/SessionSetup';
import QRDisplay from './pages/QRDisplay';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SessionSetup />} />
        <Route path="/display/:sessionId" element={<QRDisplay />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
