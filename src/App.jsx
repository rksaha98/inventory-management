import React from 'react';
// Google Fonts import for Orbitron (futuristic font)
const orbitronFont = document && document.head && !document.getElementById('orbitron-font') ? (() => {
  const link = document.createElement('link');
  link.id = 'orbitron-font';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap';
  document.head.appendChild(link);
  return true;
})() : null;

// Futuristic Title Card Component
function FuturisticTitleCard() {
  const cardStyle = {
    fontFamily: "'Orbitron', 'Rajdhani', 'Segoe UI', Arial, sans-serif",
    background: 'linear-gradient(120deg, rgba(30,34,54,0.92) 60%, rgba(44,62,80,0.85) 100%)',
    boxShadow: '0 0 32px 4px #00f0ff44, 0 0 0 2px #a259ff55',
    border: '2.5px solid rgba(0,255,255,0.18)',
    borderRadius: '2.2rem',
    padding: '2.5rem 2.5rem 2.2rem 2.5rem',
    margin: '2.5rem auto 2.5rem auto',
    maxWidth: '520px',
    width: '92vw',
    textAlign: 'center',
    position: 'relative',
    zIndex: 20,
    transition: 'transform 0.3s cubic-bezier(.4,2,.6,1), box-shadow 0.3s cubic-bezier(.4,2,.6,1)',
    cursor: 'pointer',
    overflow: 'hidden',
    userSelect: 'none',
  };
  const [hover, setHover] = React.useState(false);
  return (
    <div
      style={{
        ...cardStyle,
        transform: hover ? 'scale(1.05)' : 'scale(1)',
        boxShadow: hover
          ? '0 0 48px 8px #00f0ff99, 0 0 0 4px #a259ffcc, 0 0 24px 2px #00f0ff44'
          : cardStyle.boxShadow,
        border: hover
          ? '2.5px solid #00f0ff'
          : cardStyle.border,
        filter: hover ? 'brightness(1.08) saturate(1.2) drop-shadow(0 0 16px #00f0ff)' : 'none',
        transition: cardStyle.transition,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Neon Glow Border Accent */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '2.2rem',
        pointerEvents: 'none',
        boxShadow: hover
          ? '0 0 64px 8px #00f0ffcc, 0 0 0 6px #a259ffcc'
          : '0 0 32px 4px #00f0ff55, 0 0 0 2px #a259ff55',
        opacity: 0.7,
        zIndex: 1,
        transition: 'box-shadow 0.3s cubic-bezier(.4,2,.6,1)',
      }} />
      {/* Glassmorphism Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '2.2rem',
        background: 'linear-gradient(120deg, rgba(255,255,255,0.08) 60%, rgba(162,89,255,0.10) 100%)',
        backdropFilter: 'blur(12px)',
        zIndex: 2,
        pointerEvents: 'none',
      }} />
      {/* Title Text */}
      <h1 style={{
        position: 'relative',
        zIndex: 3,
        fontSize: '2.7rem',
        fontWeight: 900,
        letterSpacing: '0.08em',
        color: hover ? '#00f0ff' : '#a259ff',
        textShadow: hover
          ? '0 0 16px #00f0ff, 0 0 32px #00f0ffcc'
          : '0 0 8px #a259ff, 0 0 16px #00f0ff44',
        margin: 0,
        lineHeight: 1.1,
        transition: 'color 0.3s, text-shadow 0.3s',
      }}>
        Sarada PaintHouse
      </h1>
      {/* Subtitle */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        marginTop: '1.1rem',
        fontSize: '1.1rem',
        fontWeight: 700,
        color: hover ? '#fff' : '#b2eaff',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        textShadow: hover
          ? '0 0 8px #00f0ff, 0 0 16px #00f0ffcc'
          : '0 0 4px #a259ff, 0 0 8px #00f0ff44',
        background: 'rgba(0,240,255,0.08)',
        borderRadius: '1.2rem',
        padding: '0.4rem 1.2rem',
        display: 'inline-block',
        boxShadow: hover ? '0 0 12px #00f0ff88' : '0 0 4px #a259ff44',
        transition: 'color 0.3s, text-shadow 0.3s, box-shadow 0.3s',
      }}>
        Inventory Manager
      </div>
      {/* Neon Underline Accent */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        margin: '1.5rem auto 0 auto',
        width: '60%',
        height: '4px',
        borderRadius: '2px',
        background: 'linear-gradient(90deg, #a259ff 0%, #00f0ff 100%)',
        boxShadow: hover
          ? '0 0 16px #00f0ffcc, 0 0 8px #a259ffcc'
          : '0 0 8px #00f0ff44, 0 0 4px #a259ff44',
        opacity: 0.85,
        transition: 'box-shadow 0.3s',
      }} />
    </div>
  );
}
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
  const [refreshKey, setRefreshKey] = React.useState(0);
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

  // Unified refresh handler
  const handleRefresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start relative overflow-x-hidden py-10">
      {/* Universal animated gradient background for the whole page */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#181c2a] via-[#232b3a] to-[#1b262c] blur-3xl opacity-80" aria-hidden="true" />
      {/* Futuristic Title Card at the top */}
      <FuturisticTitleCard />
      {/* Inventory Table rendered directly, all styling handled in component */}
      <InventoryTable refreshTrigger={refreshKey} />
      <EntryForm inventoryData={inventoryData} onSuccess={handleRefresh} />
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
          <TransactionTable onSuccess={handleRefresh} />
        </div>
      )}
      <SalesSummary />
    </div>
  );
}

export default App;

// Tailwind custom animation (add to tailwind.config.js if not present):
// theme: { extend: { keyframes: { 'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } } }, animation: { 'fade-in': 'fade-in 1.2s ease-in' } } }
