// File: src/App.jsx


import React from 'react';
// Import your LoginPage component (ensure you have it in src/pages)
import Login from './pages/Login';
import Register from './pages/Register';
import Explore from './pages/Explore';
import { BrowserRouter, Routes, Route,Navigate } from 'react-router-dom';
import NotificationProvider from './contexts/NotificationContext';
import WebSocketProvider from './contexts/WebSocketsContext'; 

// The App component is the root component of your application.
// For now, it simply renders the LoginPage.
function App() {
  return (
    <NotificationProvider>
    <WebSocketProvider>
    
    <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path='/explore' element = {<Explore />}/>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
  
  </WebSocketProvider>
  </NotificationProvider>


    
    
  );
}

export default App;
