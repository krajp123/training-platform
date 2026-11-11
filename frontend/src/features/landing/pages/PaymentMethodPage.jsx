import { LoaderCircle } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

function PaymentMethodPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-['DM_Sans',_sans-serif] text-[#29283a]">
      <Navbar />
      <main className="customer-page-main grid flex-1 place-items-center">
        <div className="space-y-4 text-center">
          <LoaderCircle className="mx-auto animate-spin text-[#7A1F2B]" size={40} aria-hidden="true" />
          <h1 className="customer-page-title">Coming soon!</h1>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default PaymentMethodPage;
