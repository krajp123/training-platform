import React from 'react';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';

function CheckoutPage() {
  return (
    <div className="min-h-screen bg-white font-['DM_Sans',_sans-serif] text-[#29283a]">
      <Navbar />
      <main className="grid min-h-[calc(100vh-250px)] place-items-center px-5 py-20 text-center">
        <section>
          <p className="mb-3 text-sm font-bold uppercase tracking-[.16em] text-[#7A1F2B]">Checkout</p>
          <h1 className="m-0 font-[Manrope] text-3xl font-bold tracking-tight sm:text-4xl">Coming Soon</h1>
          <p className="mb-0 mt-3 max-w-md text-sm leading-6 text-[#686674]">
            Checkout is being prepared. Please check back soon.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default CheckoutPage;
