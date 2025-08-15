import React, { useState, useRef, useEffect } from 'react';

const initialState = {
  itemType: '',
  itemDescription: '',
  quantity: '',
  price: '',
  paymentMode: '',
  note: '',
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function EntryForm({ onSuccess, inventoryData = [] }) {
  const [mode, setMode] = useState(null); // null | 'add' | 'sell'
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Smart dropdown states
  const [itemTypeInput, setItemTypeInput] = useState('');
  const [itemTypeDropdown, setItemTypeDropdown] = useState(false);
  const [itemTypeHighlight, setItemTypeHighlight] = useState(0);
  const [itemDescInput, setItemDescInput] = useState('');
  const [itemDescDropdown, setItemDescDropdown] = useState(false);
  const [itemDescHighlight, setItemDescHighlight] = useState(0);
  const itemTypeRef = useRef();
  const itemDescRef = useRef();

  // Debounced input for filtering
  const debouncedType = useDebounce(itemTypeInput, 120);
  const debouncedDesc = useDebounce(itemDescInput, 120);

  // Unique item types
  const itemTypes = Array.from(new Set(inventoryData.map(d => d.itemType || d['Item Type']).filter(Boolean)));
  // Filtered by input
  const filteredTypes = itemTypes.filter(t => t.toLowerCase().includes(debouncedType.toLowerCase()));

  // Unique item descriptions for selected type
  const itemDescs = Array.from(new Set(
    inventoryData
      .filter(d => (d.itemType || d['Item Type']) === form.itemType)
      .map(d => d.itemDescription || d['Item Description'])
      .filter(Boolean)
  ));
  const filteredDescs = itemDescs.filter(d => d.toLowerCase().includes(debouncedDesc.toLowerCase()));

  // Dropdown close on click outside
  useEffect(() => {
    function handle(e) {
      if (itemTypeRef.current && !itemTypeRef.current.contains(e.target)) setItemTypeDropdown(false);
      if (itemDescRef.current && !itemDescRef.current.contains(e.target)) setItemDescDropdown(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Toggle logic for Add/Sell buttons
  const handleMode = (m) => {
    setMode(curr => (curr === m ? null : m));
    setForm(initialState);
    setItemTypeInput('');
    setItemDescInput('');
    setError('');
    setSuccess('');
  };

  // Handle smart dropdown selection
  const handleTypeInput = (e) => {
    setItemTypeInput(e.target.value);
    setForm(f => ({ ...f, itemType: e.target.value, itemDescription: '' }));
    setItemTypeDropdown(true);
    setItemTypeHighlight(0);
    setItemDescInput('');
  };
  const handleTypeSelect = (val) => {
    setForm(f => ({ ...f, itemType: val, itemDescription: '' }));
    setItemTypeInput(val);
    setItemTypeDropdown(false);
    setItemDescInput('');
    setTimeout(() => {
      if (itemDescRef.current) itemDescRef.current.querySelector('input').focus();
    }, 0);
  };
  const handleTypeKey = (e) => {
    if (!itemTypeDropdown) return;
    if (e.key === 'ArrowDown') setItemTypeHighlight(h => Math.min(h + 1, filteredTypes.length - 1));
    else if (e.key === 'ArrowUp') setItemTypeHighlight(h => Math.max(h - 1, 0));
    else if (e.key === 'Enter' && filteredTypes[itemTypeHighlight]) handleTypeSelect(filteredTypes[itemTypeHighlight]);
    else if (e.key === 'Escape') setItemTypeDropdown(false);
  };

  const handleDescInput = (e) => {
    setItemDescInput(e.target.value);
    setForm(f => ({ ...f, itemDescription: e.target.value }));
    setItemDescDropdown(true);
    setItemDescHighlight(0);
  };
  const handleDescSelect = (val) => {
    setForm(f => ({ ...f, itemDescription: val }));
    setItemDescInput(val);
    setItemDescDropdown(false);
  };
  const handleDescKey = (e) => {
    if (!itemDescDropdown) return;
    if (e.key === 'ArrowDown') setItemDescHighlight(h => Math.min(h + 1, filteredDescs.length - 1));
    else if (e.key === 'ArrowUp') setItemDescHighlight(h => Math.max(h - 1, 0));
    else if (e.key === 'Enter' && filteredDescs[itemDescHighlight]) handleDescSelect(filteredDescs[itemDescHighlight]);
    else if (e.key === 'Escape') setItemDescDropdown(false);
  };

  // Other fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Transaction submit logic (add/sell/edit/delete)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const endpoint = mode === 'add' ? '/.netlify/functions/addItemToGoogle' : '/.netlify/functions/sellItemToGoogle';
      // Timestamp in 'd/m/yyyy, h:mm:ss am/pm' format
      const now = new Date();
      const d = now.getDate();
      const m = now.getMonth() + 1;
      const y = now.getFullYear();
      let h = now.getHours();
      const min = String(now.getMinutes()).padStart(2, '0');
      const sec = String(now.getSeconds()).padStart(2, '0');
      const ampm = h >= 12 ? 'pm' : 'am';
      h = h % 12;
      h = h === 0 ? 12 : h;
      const timeStr = `${h}:${min}:${sec} ${ampm}`;
      const dateStr = `${d}/${m}/${y}, ${timeStr}`;
      // Add 'mode' property to match TransactionTable's edit logic
      const payload = { ...form, Timestamp: dateStr, mode: form.paymentMode };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setSuccess(mode === 'add' ? 'Item added!' : 'Item sold!');
      setForm(initialState);
      setItemTypeInput('');
      setItemDescInput('');
      if (onSuccess) onSuccess(); // trigger summary refresh
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[60%] max-w-full mx-auto mb-8">
      {/* Toggle Buttons - dark mode, fluid, larger */}
      <div className="flex flex-row gap-4 mb-4 w-full">
        <button
          className={`flex-1 min-w-0 px-6 py-3 rounded-lg border-2 font-semibold text-lg focus:outline-none tracking-wide shadow-lg
            ${mode === 'add' ? 'bg-[#8dc540] text-white border-[#8dc540]' : 'bg-[#232b3a] text-gray-200 border-[#3a506b] hover:bg-[#8dc540]/80'}`
          }
          onClick={() => handleMode('add')}
          type="button"
        >
          ➕ Add Item
        </button>
        <button
          className={`flex-1 min-w-0 px-6 py-3 rounded-lg border-2 font-semibold text-lg focus:outline-none tracking-wide shadow-lg
            ${mode === 'sell' ? 'bg-[#fec10e] text-white border-[#fec10e]' : 'bg-[#232b3a] text-gray-200 border-[#3a506b] hover:bg-[#fec10e]/80'}`
          }
          onClick={() => handleMode('sell')}
          type="button"
        >
          🛒 Sell Item
        </button>
      </div>
      {/* Form - always visible when mode is set */}
      {mode && (
        <form
          className="bg-[#232b3a] shadow-xl rounded-xl px-8 py-7 w-full border-2 border-[#3a506b]"
          onSubmit={handleSubmit}
        >
          {/* Item Type Smart Dropdown */}
          <div className="mb-3 relative" ref={itemTypeRef}>
            <label className="text-xs text-gray-300 font-semibold uppercase tracking-wide mb-1 block">Item Type</label>
            <input
              type="text"
              name="itemType"
              autoComplete="off"
              value={itemTypeInput}
              onChange={handleTypeInput}
              onFocus={() => setItemTypeDropdown(true)}
              onKeyDown={handleTypeKey}
              className="w-full border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 px-4 py-2 rounded-md text-base focus:ring-2 focus:ring-blue-500"
              required
            />
            {itemTypeDropdown && filteredTypes.length > 0 && (
              <ul className="absolute left-0 right-0 bg-[#232b3a] border border-[#3a506b] shadow-lg rounded-md z-10 max-h-40 overflow-y-auto text-base mt-1 text-gray-100">
                {filteredTypes.map((t, i) => (
                  <li
                    key={t}
                    className={`px-4 py-2 cursor-pointer ${i === itemTypeHighlight ? 'bg-[#3a506b]/40 font-semibold' : ''}`}
                    onMouseDown={() => handleTypeSelect(t)}
                  >
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Item Description Smart Dropdown */}
          <div className="mb-3 relative" ref={itemDescRef}>
            <label className="text-xs text-gray-300 font-semibold uppercase tracking-wide mb-1 block">Item Description</label>
            <input
              type="text"
              name="itemDescription"
              autoComplete="off"
              value={itemDescInput}
              onChange={handleDescInput}
              onFocus={() => setItemDescDropdown(true)}
              onKeyDown={handleDescKey}
              className="w-full border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 px-4 py-2 rounded-md text-base focus:ring-2 focus:ring-blue-500"
              required
            />
            {itemDescDropdown && filteredDescs.length > 0 && (
              <ul className="absolute left-0 right-0 bg-[#232b3a] border border-[#3a506b] shadow-lg rounded-md z-10 max-h-40 overflow-y-auto text-base mt-1 text-gray-100">
                {filteredDescs.map((d, i) => (
                  <li
                    key={d}
                    className={`px-4 py-2 cursor-pointer ${i === itemDescHighlight ? 'bg-[#3a506b]/40 font-semibold' : ''}`}
                    onMouseDown={() => handleDescSelect(d)}
                  >
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Quantity, Price, Payment, Note */}
          <div className="mb-3">
            <label className="text-xs text-gray-300 font-semibold uppercase tracking-wide mb-1 block">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              className="w-full border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 px-4 py-2 rounded-md text-base focus:ring-2 focus:ring-blue-500"
              min="1"
              required
            />
          </div>
          <div className="mb-3">
            <label className="text-xs text-gray-300 font-semibold uppercase tracking-wide mb-1 block">Price PER ITEM</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              className="w-full border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 px-4 py-2 rounded-md text-base focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
          </div>
          <div className="mb-3">
            <label className="text-xs text-gray-300 font-semibold uppercase tracking-wide mb-1 block">Mode of Payment</label>
            <input
              type="text"
              name="paymentMode"
              value={form.paymentMode}
              onChange={handleChange}
              className="w-full border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 px-4 py-2 rounded-md text-base focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="text-xs text-gray-300 font-semibold uppercase tracking-wide mb-1 block">Note</label>
            <input
              type="text"
              name="note"
              value={form.note}
              onChange={handleChange}
              className="w-full border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 px-4 py-2 rounded-md text-base focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <div className="text-red-600 text-xs mb-2">{error}</div>}
          {success && <div className="text-green-600 text-xs mb-2">{success}</div>}
          <button
            type="submit"
            className={`w-full text-lg font-bold rounded-lg shadow-lg px-6 py-3 mt-2
              ${mode === 'add' ? 'bg-[#8dc540] hover:bg-[#7bb23a] text-white' : 'bg-[#fec10e] hover:bg-[#e0ad0c] text-white'}`
            }
            disabled={loading}
          >
            {loading ? (mode === 'add' ? 'Adding...' : 'Selling...') : (mode === 'add' ? 'Add Item' : 'Sell Item')}
          </button>
        </form>
      )}
    </div>
  );
}
