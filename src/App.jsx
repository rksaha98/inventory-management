import React from 'react';
import InventoryTable from './components/InventoryTable';
import EntryForm from './components/EntryForm';
import TransactionTable from './components/TransactionTable';
import SalesSummary from './components/SalesSummary';


function Header() {
  return (
    <div className="relative w-full min-h-[40vh] flex flex-col items-center justify-center pt-16 pb-8">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-300 via-indigo-100 to-pink-200 blur-2xl opacity-70 animate-fade-in" aria-hidden="true" />
      {/* Title Card */}
      <div className="relative z-10 px-8 py-7 rounded-2xl bg-white/70 backdrop-blur-md shadow-xl border border-blue-100 flex flex-col items-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-700 via-indigo-600 to-pink-600 text-center drop-shadow animate-fade-in">
          Sarada PaintHouse
        </h1>
        <div className="h-2" />
        <h2 className="text-lg md:text-xl font-semibold text-blue-700/80 tracking-wide text-center animate-fade-in">
          🎨 Hardware & Paint Inventory Manager
        </h2>
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
