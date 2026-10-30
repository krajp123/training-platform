import React from 'react';
import DashboardPage from '../pages/DashboardPage.jsx';
import HomePage from '../pages/HomePage.jsx';

function App() {
  const isDashboard = window.location.pathname.replace(/\/+$/, '') === '/dashboard';
  return isDashboard ? <DashboardPage /> : <HomePage />;
}

export default App;
