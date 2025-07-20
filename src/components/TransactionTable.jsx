// File: components/TransactionTable.jsx
import React, { useEffect, useState } from 'react';
import formatDateDMYTimeSec from './formatDateDMYTimeSec';

const API_URL = '/.netlify/functions/getTransactionsFromGoogle';
const DELETE_URL = '/.netlify/functions/deleteTransaction';
const EDIT_URL = '/.netlify/functions/editTransaction';

export default function TransactionTable() {
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState('');
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


  // Filter by type and date
  let filtered = transactions;
  if (filterType !== 'All') {
    filtered = filtered.filter(t => t['Transaction Type'] === filterType);
  }
  if (filterDate) {
    filtered = filtered.filter(t => {
      // Accepts YYYY-MM-DD, matches start of ISO string
      return (t.Timestamp || '').slice(0, 10) === filterDate;
    });
  }

  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  return (
    <section className="w-full max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 mb-8">
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-blue-600">🧾 Transaction Logs</h2>

        <div className="flex gap-2 items-center">
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
            type="date"
            className="border px-2 py-1 rounded"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
          />

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
        <table className="w-full text-sm border-separate rounded-lg shadow-md bg-white">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="p-3 text-gray-700 font-semibold">ID</th>
              <th className="p-3 text-gray-700 font-semibold">Tran Type</th>
              <th className="p-3 text-gray-700 font-semibold">Item Type</th>
              <th className="p-3 text-gray-700 font-semibold">Item Description</th>
              <th className="p-3 text-gray-700 font-semibold">Qty</th>
              <th className="p-3 text-gray-700 font-semibold">Price</th>
              <th className="p-3 text-gray-700 font-semibold">Timestamp</th>
              <th className="p-3 text-gray-700 font-semibold">Mode</th>
              <th className="p-3 text-gray-700 font-semibold">Note</th>
              <th className="p-3 text-gray-700 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={10} className="text-center text-gray-400 py-8">No transactions</td></tr>
            )}
            {paginated.map((t, idx) => (
              <tr key={t.ID} className={
                `${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ` +
                'border-b border-gray-100 hover:bg-blue-50 transition-colors duration-100'
              }>
                {editId === t.ID ? (
                  <>
                    <td className="p-3 font-mono text-xs align-middle">{t.ID}</td>
                    <td className="p-3 align-middle">{t['Transaction Type']}</td>
                    <td className="p-3 align-middle">
                      <input className="border rounded px-2 py-1 w-full" value={editData['Item Type']} onChange={e => handleEditChange('Item Type', e.target.value)} />
                    </td>
                    <td className="p-3 align-middle">
                      <input className="border rounded px-2 py-1 w-full" value={editData['Item Description']} onChange={e => handleEditChange('Item Description', e.target.value)} />
                    </td>
                    <td className="p-3 align-middle">
                      <input type="number" className="border rounded px-2 py-1 w-full" value={editData['Quantity']} onChange={e => handleEditChange('Quantity', e.target.value)} />
                    </td>
                    <td className="p-3 align-middle">
                      <input type="number" className="border rounded px-2 py-1 w-full" value={editData['Price']} onChange={e => handleEditChange('Price', e.target.value)} />
                    </td>
                    <td className="p-3 align-middle">{formatDateDMYTimeSec(editData['Timestamp'] || t.Timestamp)}</td>
                    <td className="p-3 align-middle">
                      <input className="border rounded px-2 py-1 w-full" value={editData['Mode']} onChange={e => handleEditChange('Mode', e.target.value)} />
                    </td>
                    <td className="p-3 align-middle">
                      <input className="border rounded px-2 py-1 w-full" value={editData['Note']} onChange={e => handleEditChange('Note', e.target.value)} />
                    </td>
                    <td className="p-3 align-middle flex gap-1">
                      <button className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded" onClick={handleEditSave}>Save</button>
                      <button className="text-xs bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded" onClick={() => setEditId(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 font-mono text-xs align-middle">{t.ID}</td>
                    <td className="p-3 align-middle">{t['Transaction Type']}</td>
                    <td className="p-3 align-middle">{t['Item Type']}</td>
                    <td className="p-3 align-middle">{t['Item Description']}</td>
                    <td className="p-3 align-middle">{t.Quantity}</td>
                    <td className="p-3 align-middle">₹{Number(t.Price).toFixed(2)}</td>
                    <td className="p-3 align-middle">{formatDateDMYTimeSec(t.Timestamp)}</td>
                    <td className="p-3 align-middle">{t.Mode}</td>
                    <td className="p-3 align-middle">{t.Note}</td>
                    <td className="p-3 align-middle flex gap-1">
                      <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded" onClick={() => handleEdit(t.ID)}>Edit</button>
                      <button className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded" onClick={() => handleDelete(t.ID)}>Delete</button>
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
