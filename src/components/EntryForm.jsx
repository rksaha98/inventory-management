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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const endpoint = mode === 'add' ? '/.netlify/functions/addItemToGoogle' : '/.netlify/functions/sellItemToGoogle';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to submit');
      setSuccess(mode === 'add' ? 'Item added!' : 'Item sold!');
      setForm(initialState);
      setItemTypeInput('');
      setItemDescInput('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-8">
      {/* Toggle Buttons */}
      <div className="flex flex-row gap-4 mb-4">
        <button
          className={`flex-1 px-4 py-2 rounded-lg border transition-all duration-200 font-semibold text-base focus:outline-none ${mode === 'add' ? 'bg-green-100 text-green-800 border-green-300 shadow' : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'} `}
          onClick={() => handleMode('add')}
          type="button"
        >
          ➕ Add Item
        </button>
        <button
          className={`flex-1 px-4 py-2 rounded-lg border transition-all duration-200 font-semibold text-base focus:outline-none ${mode === 'sell' ? 'bg-red-100 text-red-800 border-red-300 shadow' : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50'} `}
          onClick={() => handleMode('sell')}
          type="button"
        >
          🛒 Sell Item
        </button>
      </div>
      {/* Form - always visible when mode is set */}
      {mode && (
        <form
          className="bg-white shadow-lg rounded-xl px-6 py-5 w-full animate-fade-in"
          onSubmit={handleSubmit}
        >
          {/* Item Type Smart Dropdown */}
          <div className="mb-3 relative" ref={itemTypeRef}>
            <label className="text-xs text-gray-700 font-semibold uppercase tracking-wide mb-1 block">Item Type</label>
            <input
              type="text"
              name="itemType"
              autoComplete="off"
              value={itemTypeInput}
              onChange={handleTypeInput}
              onFocus={() => setItemTypeDropdown(true)}
              onKeyDown={handleTypeKey}
              className="w-full border px-3 py-1.5 rounded-md text-sm"
              required
            />
            {itemTypeDropdown && filteredTypes.length > 0 && (
              <ul className="absolute left-0 right-0 bg-white border shadow-lg rounded-md z-10 max-h-40 overflow-y-auto text-sm mt-1">
                {filteredTypes.map((t, i) => (
                  <li
                    key={t}
                    className={`px-3 py-1.5 cursor-pointer ${i === itemTypeHighlight ? 'bg-blue-100 font-semibold' : ''}`}
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
            <label className="text-xs text-gray-700 font-semibold uppercase tracking-wide mb-1 block">Item Description</label>
            <input
              type="text"
              name="itemDescription"
              autoComplete="off"
              value={itemDescInput}
              onChange={handleDescInput}
              onFocus={() => setItemDescDropdown(true)}
              onKeyDown={handleDescKey}
              className="w-full border px-3 py-1.5 rounded-md text-sm"
              required
            />
            {itemDescDropdown && filteredDescs.length > 0 && (
              <ul className="absolute left-0 right-0 bg-white border shadow-lg rounded-md z-10 max-h-40 overflow-y-auto text-sm mt-1">
                {filteredDescs.map((d, i) => (
                  <li
                    key={d}
                    className={`px-3 py-1.5 cursor-pointer ${i === itemDescHighlight ? 'bg-blue-100 font-semibold' : ''}`}
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
            <label className="text-xs text-gray-700 font-semibold uppercase tracking-wide mb-1 block">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              className="w-full border px-3 py-1.5 rounded-md text-sm"
              min="1"
              required
            />
          </div>
          <div className="mb-3">
            <label className="text-xs text-gray-700 font-semibold uppercase tracking-wide mb-1 block">Price</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              className="w-full border px-3 py-1.5 rounded-md text-sm"
              min="0"
              required
            />
          </div>
          <div className="mb-3">
            <label className="text-xs text-gray-700 font-semibold uppercase tracking-wide mb-1 block">Mode of Payment (optional)</label>
            <input
              type="text"
              name="paymentMode"
              value={form.paymentMode}
              onChange={handleChange}
              className="w-full border px-3 py-1.5 rounded-md text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="text-xs text-gray-700 font-semibold uppercase tracking-wide mb-1 block">Note (optional)</label>
            <input
              type="text"
              name="note"
              value={form.note}
              onChange={handleChange}
              className="w-full border px-3 py-1.5 rounded-md text-sm"
            />
          </div>
          {error && <div className="text-red-600 text-xs mb-2">{error}</div>}
          {success && <div className="text-green-600 text-xs mb-2">{success}</div>}
          <button
            type="submit"
            className={`w-full ${mode === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white px-4 py-2 rounded shadow font-semibold transition-all duration-200`}
            disabled={loading}
          >
            {loading ? (mode === 'add' ? 'Adding...' : 'Selling...') : (mode === 'add' ? 'Add Item' : 'Sell Item')}
          </button>
        </form>
      )}
    </div>
  );
}
