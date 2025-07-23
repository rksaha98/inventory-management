import React from 'react';
import InventoryTable from './components/InventoryTable';
import EntryForm from './components/EntryForm';
import TransactionTable from './components/TransactionTable';
import SalesSummary from './components/SalesSummary';


function Header() {
  return (
    <div className="relative w-full min-h-[40vh] flex flex-col items-center justify-center pt-16 pb-8">
      {/* Title Card with glassmorphism and neon border */}
      <div className="relative z-10 max-w-3xl mx-auto px-10 py-10 rounded-3xl shadow-xl border-4 border-transparent bg-white/10 backdrop-blur-2xl flex flex-col items-center"
        style={{ boxShadow: '0 0 24px 4px #232b3a33, 0 0 0 2px #3a506b22' }}>
        {/* Animated Neon Border */}
        <div className="absolute -inset-1 rounded-3xl pointer-events-none animate-fade-in"
          style={{
            background: 'linear-gradient(120deg, #232b3a 0%, #3a506b 50%, #1b262c 100%)',
            filter: 'blur(6px)',
            opacity: 0.6,
            zIndex: 0
          }}
        />
        {/* Futuristic Title */}
        <h1
          className="relative z-10 text-5xl md:text-6xl font-bold tracking-wide text-center animate-fade-in uppercase text-[#232b3a]"
          style={{
            fontFamily: 'Segoe UI, Arial, sans-serif',
            letterSpacing: '0.06em'
          }}
        >
          Sarada PaintHouse
        </h1>
        <div className="h-4" />
        {/* Futuristic Subtitle */}
        <h2
          className="relative z-10 text-xl md:text-2xl font-medium text-center tracking-wide uppercase animate-fade-in text-[#3a506b]"
          style={{
            fontFamily: 'Segoe UI, Arial, sans-serif',
            letterSpacing: '0.08em'
          }}
        >
          <span className="inline-block px-3 py-1 rounded-full border border-[#232b3a] bg-white/10 backdrop-blur-sm shadow-md animate-fade-in">
            <span className="mr-2"></span>Inventory Manager
          </span>
        </h2>
        {/* Futuristic Accent Bar */}
        <div className="mt-6 w-32 h-1 rounded-full bg-gradient-to-r from-[#232b3a] via-[#3a506b] to-[#1b262c] animate-fade-in" />
      </div>
    </div>
  );
}

function App() {
  const [inventoryData, setInventoryData] = React.useState([]);
  const [showTransactions, setShowTransactions] = React.useState(false);
  const logsRef = React.useRef(null);
  React.useEffect(() => {
    async function fetchInventory() {
      try {
        const res = await fetch('/.netlify/functions/getInventorySummary');
        const json = await res.json();
        setInventoryData(Array.isArray(json) ? json : []);
      } catch {
        setInventoryData([]);
      }
    }
    fetchInventory();
  }, []);

  React.useEffect(() => {
    if (showTransactions && logsRef.current) {
      logsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showTransactions]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start relative overflow-x-hidden py-10">
      {/* Universal animated gradient background for the whole page */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#232b3a] via-[#3a506b] to-[#1b262c] blur-3xl opacity-70 animate-fade-in" aria-hidden="true" />
      <Header />
      {/* Inventory Table rendered directly, all styling handled in component */}
      <InventoryTable />
      <EntryForm inventoryData={inventoryData} />
      {/* Show Transactions Button */}
      <div className="w-[60%] max-w-full mx-auto mb-8 flex justify-center">
        <button
          className={`w-full px-4 py-3 rounded-xl shadow text-base font-semibold border-2 transition-colors
            ${showTransactions
              ? 'bg-[#1b262c] text-blue-300 border-[#3a506b] hover:bg-[#232b3a]'
              : 'bg-[#232b3a] text-gray-100 border-[#3a506b] hover:bg-[#1b262c]'}
          `}
          onClick={() => setShowTransactions(v => !v)}
          type="button"
        >
          {showTransactions ? 'Hide Transactions' : 'Show Transactions'}
        </button>
      </div>
      {/* Transaction Logs Section */}
      {showTransactions && (
        <div ref={logsRef} className="w-full flex flex-col items-center">
          <TransactionTable />
        </div>
      )}
      <SalesSummary />
    </div>
  );
}

export default App;

// Tailwind custom animation (add to tailwind.config.js if not present):
// theme: { extend: { keyframes: { 'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } } }, animation: { 'fade-in': 'fade-in 1.2s ease-in' } } }
