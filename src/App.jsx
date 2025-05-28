import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import FinanceList from './pages/FinanceList';
import { AuthProvider } from './firebase/AuthProvider';
import Login from './pages/Login';

import './App.css'

function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dash" element={<Dashboard />} />
          <Route path="/list/:type" element={<FinanceList />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
