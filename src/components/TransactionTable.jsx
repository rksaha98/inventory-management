// File: components/TransactionTable.jsx
import React, { useEffect, useState } from 'react';

const API_URL = '/.netlify/functions/getTransactionsFromGoogle';
const DELETE_URL = '/.netlify/functions/deleteTransaction';
const EDIT_URL = '/.netlify/functions/editTransaction';

export default function TransactionTable() {
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      if (!Array.isArray(json)) throw new Error('Invalid data format');
      // Sort by Timestamp (latest first), fallback to ID if needed
      const sorted = [...json].sort((a, b) => {
        const aTime = new Date(a.Timestamp || a.timestamp || 0).getTime();
        const bTime = new Date(b.Timestamp || b.timestamp || 0).getTime();
        if (!isNaN(aTime) && !isNaN(bTime)) return bTime - aTime;
        // fallback to ID (assume numeric)
        return (b.ID || b.id || 0) - (a.ID || a.id || 0);
      });
      setTransactions(sorted);
    } catch (err) {
      console.error('❌ Error fetching transactions:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete transaction ID ${id}?`)) return;
    try {
      const res = await fetch(DELETE_URL, {
        method: 'POST',
        body: JSON.stringify({ id })
      });
      const result = await res.json();
      if (result.success) fetchTransactions();
    } catch (err) {
      console.error('❌ Error deleting:', err);
    }
  };

  const handleEdit = (id) => {
    setEditId(id);
    const tx = transactions.find(t => t.ID === id);
    if (tx) setEditData(tx);
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    try {
      // Map frontend keys to backend expected keys
      const payload = {
        id: editData.ID,
        transactionType: editData['Transaction Type'],
        itemType: editData['Item Type'],
        itemDescription: editData['Item Description'],
        quantity: editData['Quantity'],
        price: editData['Price'],
        timestamp: editData['Timestamp'],
        mode: editData['Mode'],
        note: editData['Note']
      };
      const res = await fetch(EDIT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setEditId(null);
        fetchTransactions();
      } else {
        console.error('❌ Save error:', result.error);
      }
    } catch (err) {
      console.error('❌ Error saving edit:', err);
    }
  };

  const filtered = filterType === 'All'
    ? transactions
    : transactions.filter(t => t['Transaction Type'] === filterType);

  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  return (
    <section className="w-full max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 mb-8">
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-blue-600">🧾 Transaction Logs</h2>

        <div className="flex gap-2">
          <select
            className="border px-2 py-1 rounded"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Add">Add</option>
            <option value="Sell">Sell</option>
          </select>

          <input
            type="number"
            min="1"
            className="border px-2 py-1 rounded w-20"
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table-auto w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Transaction Type</th>
              <th className="p-2">Item Type</th>
              <th className="p-2">Item Description</th>
              <th className="p-2">Quantity</th>
              <th className="p-2">Price</th>
              <th className="p-2">Timestamp</th>
              <th className="p-2">Mode</th>
              <th className="p-2">Note</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((t, idx) => (
              <tr key={t.ID} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {editId === t.ID ? (
                  <>
                    <td className="p-2 font-mono text-xs">{t.ID}</td>
                    <td className="p-2">{t['Transaction Type']}</td>
                    <td className="p-2">
                      <input className="input" value={editData['Item Type']} onChange={e => handleEditChange('Item Type', e.target.value)} />
                    </td>
                    <td className="p-2">
                      <input className="input" value={editData['Item Description']} onChange={e => handleEditChange('Item Description', e.target.value)} />
                    </td>
                    <td className="p-2">
                      <input type="number" className="input" value={editData['Quantity']} onChange={e => handleEditChange('Quantity', e.target.value)} />
                    </td>
                    <td className="p-2">
                      <input type="number" className="input" value={editData['Price']} onChange={e => handleEditChange('Price', e.target.value)} />
                    </td>
                    <td className="p-2">{t.Timestamp}</td>
                    <td className="p-2">
                      <input className="input" value={editData['Mode']} onChange={e => handleEditChange('Mode', e.target.value)} />
                    </td>
                    <td className="p-2">
                      <input className="input" value={editData['Note']} onChange={e => handleEditChange('Note', e.target.value)} />
                    </td>
                    <td className="p-2">
                      <button className="text-green-600 hover:underline mr-2" onClick={handleEditSave}>Save</button>
                      <button className="text-gray-500 hover:underline" onClick={() => setEditId(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 font-mono text-xs">{t.ID}</td>
                    <td className="p-2">{t['Transaction Type']}</td>
                    <td className="p-2">{t['Item Type']}</td>
                    <td className="p-2">{t['Item Description']}</td>
                    <td className="p-2">{t.Quantity}</td>
                    <td className="p-2">₹{Number(t.Price).toFixed(2)}</td>
                    <td className="p-2">{t.Timestamp}</td>
                    <td className="p-2">{t.Mode}</td>
                    <td className="p-2">{t.Note}</td>
                    <td className="p-2">
                      <button className="text-blue-600 hover:underline mr-2" onClick={() => handleEdit(t.ID)}>Edit</button>
                      <button className="text-red-600 hover:underline" onClick={() => handleDelete(t.ID)}>Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {paginated.length} of {filtered.length} transactions
        </p>
        <div className="space-x-2">
          <button
            className="px-3 py-1 border rounded"
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >Previous</button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <button
            className="px-3 py-1 border rounded"
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >Next</button>
        </div>
      </div>
    </section>
  );
}
