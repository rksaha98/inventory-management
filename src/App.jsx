import React, { useState } from 'react';
import InventoryTable from './components/InventoryTable';
import AddItemForm from './components/AddItemForm';
import SellItemForm from './components/SellItemForm';
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

function UserSettingsPanel({ buyColor, setBuyColor, sellColor, setSellColor, lowStockQty, setLowStockQty, lowStockColor, setLowStockColor }) {
  return (
    <div className="fixed bottom-20 right-6 bg-white rounded-xl shadow-xl border border-gray-300 z-50 px-6 py-5 w-80 space-y-4 animate-fade-in">
      <div>
        <label className="block font-semibold text-sm text-gray-700 mb-1">Buy Color</label>
        <input type="color" value={buyColor} onChange={e => setBuyColor(e.target.value)} className="w-full border border-gray-300 rounded p-1" />
      </div>
      <div>
        <label className="block font-semibold text-sm text-gray-700 mb-1">Sell Color</label>
        <input type="color" value={sellColor} onChange={e => setSellColor(e.target.value)} className="w-full border border-gray-300 rounded p-1" />
      </div>
      <div>
        <label className="block font-semibold text-sm text-gray-700 mb-1">Low Stock Qty Threshold</label>
        <input type="number" min="0" value={lowStockQty} onChange={e => setLowStockQty(Number(e.target.value))} className="w-full border border-gray-300 rounded p-1" />
      </div>
      <div>
        <label className="block font-semibold text-sm text-gray-700 mb-1">Low Stock Alert Color</label>
        <input type="color" value={lowStockColor} onChange={e => setLowStockColor(e.target.value)} className="w-full border border-gray-300 rounded p-1" />
      </div>
    </div>
  );
}

function App() {
  const [buyColor, setBuyColor] = useState("#16a34a"); // green-600
  const [sellColor, setSellColor] = useState("#f97316"); // orange-500
  const [lowStockQty, setLowStockQty] = useState(10);
  const [lowStockColor, setLowStockColor] = useState("#f43f5e"); // rose-500
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start relative overflow-x-hidden bg-gradient-to-b from-blue-100 to-pink-100 py-10">
      <Header />
      <InventoryTable />
      <AddItemForm />
      <SellItemForm />
      <TransactionTable />
      <SalesSummary />
      {/* Floating Settings Button */}
      <button
        className="fixed bottom-6 right-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full px-4 py-2 shadow-lg z-50"
        onClick={() => setShowSettings(v => !v)}
        aria-label="Settings"
      >⚙️ Settings</button>
      {/* Floating Settings Panel */}
      {showSettings && (
        <UserSettingsPanel
          buyColor={buyColor}
          setBuyColor={setBuyColor}
          sellColor={sellColor}
          setSellColor={setSellColor}
          lowStockQty={lowStockQty}
          setLowStockQty={setLowStockQty}
          lowStockColor={lowStockColor}
          setLowStockColor={setLowStockColor}
        />
      )}
    </div>
  );
}

export default App;

// Tailwind custom animation (add to tailwind.config.js if not present):
// theme: { extend: { keyframes: { 'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } } }, animation: { 'fade-in': 'fade-in 1.2s ease-in' } } }
