import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import FinanceList from './pages/FinanceList';
import Sales from './pages/Sales';
import { AuthProvider } from './firebase/AuthProvider';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';


import './App.css'

function App() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route path="/dash" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />

          <Route path="/list/:type" element={
            <PrivateRoute>
              <FinanceList />
            </PrivateRoute>
          } />

          <Route path="/sales" element={
            <PrivateRoute>
              <Sales />
            </PrivateRoute>
          } />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
