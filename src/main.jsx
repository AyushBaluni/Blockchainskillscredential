import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Certificates from './pages/Certificates';
import Issue from './pages/Issue';
import { AuthProvider, AuthContext } from './AuthContext';

function Protected({ children }){
  const { user } = React.useContext(AuthContext);
  if(!user) return <Navigate to="/login" replace />;
  return children;
}

function App(){
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/dashboard' element={<Protected><Dashboard/></Protected>} />
          <Route path='/certificates' element={<Protected><Certificates/></Protected>} />
          <Route path='/issue' element={<Protected><Issue/></Protected>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
