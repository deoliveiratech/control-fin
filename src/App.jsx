import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import FinanceList from './pages/FinanceList';

import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/list/:type" element={<FinanceList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
