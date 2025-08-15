import React, { useState } from 'react';

export default function AddItemForm({ onSuccess }) {
  const [form, setForm] = useState({
    itemType: '',
    itemDescription: '',
    quantity: '',
    price: '',
    mode: '',
    note: ''
  });

  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus('Submitting...');
    try {
      const res = await fetch('/.netlify/functions/addItemToGoogle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = await res.json();
      if (res.ok) {
        setStatus('✅ Item added successfully!');
        setForm({ itemType: '', itemDescription: '', quantity: '', price: '', mode: '', note: '' });
        if (onSuccess) onSuccess(); // trigger summary refresh
      } else {
        throw new Error(result.error || 'Failed to add item');
      }
    } catch (err) {
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  return (
    <section className="w-full max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-xl font-bold mb-4 text-green-600">➕ Add Item</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input name="itemType" value={form.itemType} onChange={handleChange} placeholder="Item Type" required className="input" />
          <input name="itemDescription" value={form.itemDescription} onChange={handleChange} placeholder="Item Description" required className="input" />
          <input type="number" name="quantity" value={form.quantity} onChange={handleChange} placeholder="Quantity" required className="input" />
          <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="Purchase Price" required className="input" />
          <input name="mode" value={form.mode} onChange={handleChange} placeholder="Mode (e.g. Cash/UPI)" className="input" />
          <input name="note" value={form.note} onChange={handleChange} placeholder="Note (optional)" className="input" />
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded font-semibold">Add Item</button>
      </form>

      {status && <p className="mt-4 text-sm text-gray-700">{status}</p>}
    </section>
  );
}
