import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AdminApp from './app/AdminApp.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminApp />
    </BrowserRouter>
  </React.StrictMode>,
);
