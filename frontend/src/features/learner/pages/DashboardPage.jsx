import React from 'react';
import Navbar from '../../landing/components/Navbar.jsx';
import Footer from '../../landing/components/Footer.jsx';

function DashboardPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f6f7fb', fontFamily: 'Arial, sans-serif' }}>
      <Navbar />

      <main
        style={{
          minHeight: 'calc(100vh - 200px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 24px 40px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(2.5rem, 7vw, 6rem)',
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: '-0.05em',
            color: '#7A1F2B',
            textAlign: 'center',
          }}
        >
          Comming Soon!
        </h1>
      </main>

      <Footer />
    </div>
  );
}

export default DashboardPage;
