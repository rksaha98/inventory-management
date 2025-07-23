import React from 'react';
import InventoryTable from './components/InventoryTable';
import EntryForm from './components/EntryForm';
import TransactionTable from './components/TransactionTable';
import SalesSummary from './components/SalesSummary';


function Header() {
  return (
    <div className="relative w-full min-h-[40vh] flex flex-col items-center justify-center pt-16 pb-8">
      {/* Futuristic Animated Gradient Border + Glassmorphism Card */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0fffc1] via-[#7e5fff] to-[#ff5e62] blur-3xl opacity-60 animate-fade-in" aria-hidden="true" />
      <div className="relative z-10 max-w-3xl mx-auto px-10 py-10 rounded-3xl shadow-2xl border-4 border-transparent bg-white/10 backdrop-blur-2xl flex flex-col items-center"
        style={{ boxShadow: '0 0 40px 8px #7e5fff55, 0 0 0 4px #0fffc1, 0 0 0 8px #ff5e62' }}>
        {/* Animated Neon Border */}
        <div className="absolute -inset-1 rounded-3xl pointer-events-none animate-pulse"
          style={{
            background: 'linear-gradient(120deg, #0fffc1 0%, #7e5fff 50%, #ff5e62 100%)',
            filter: 'blur(8px)',
            opacity: 0.7,
            zIndex: 0
          }}
        />
        {/* Futuristic Title */}
        <h1 className="relative z-10 text-5xl md:text-6xl font-black tracking-tight text-center drop-shadow-lg animate-fade-in uppercase"
          style={{
            letterSpacing: '0.08em',
            background: 'linear-gradient(90deg, #0fffc1 0%, #7e5fff 50%, #ff5e62 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: '#0fffc1'
          }}
        >
          Sarada PaintHouse
        </h1>
        <div className="h-4" />
        {/* Futuristic Subtitle */}
        <h2 className="relative z-10 text-xl md:text-2xl font-semibold text-center text-white/90 tracking-widest uppercase bg-gradient-to-r from-[#7e5fff] to-[#0fffc1] bg-clip-text text-transparent animate-fade-in">
          <span className="inline-block px-3 py-1 rounded-full border border-[#0fffc1] bg-white/10 backdrop-blur-sm shadow-md animate-pulse">
            <span className="mr-2">🎨</span> Hardware & Paint Inventory Manager
          </span>
        </h2>
        {/* Futuristic Accent Bar */}
        <div className="mt-6 w-32 h-1 rounded-full bg-gradient-to-r from-[#0fffc1] via-[#7e5fff] to-[#ff5e62] animate-pulse" />
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
    <div className="min-h-screen w-full flex flex-col items-center justify-start relative overflow-x-hidden bg-gradient-to-b from-blue-100 to-pink-100 py-10">
      <Header />
      <InventoryTable />
      <EntryForm inventoryData={inventoryData} />
      {/* Show Transactions Button */}
      <div className="w-full max-w-xl mx-auto mb-4">
        <button
          className={`px-4 py-2 rounded shadow text-sm font-medium border transition-colors w-full ${showTransactions ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-white text-gray-700 border-gray-300'}`}
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
