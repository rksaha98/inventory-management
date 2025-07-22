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
    <section className="w-full max-w-6xl mx-auto bg-white shadow-md rounded-lg p-0 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <h2 className="text-xl font-bold text-blue-600 px-0 pb-0">🧾 Transaction Logs</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <select
            className="border px-2 py-1 rounded text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Add">Add</option>
            <option value="Sell">Sell</option>
          </select>
          <input
            type="date"
            className="border px-2 py-1 rounded text-sm"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
          />
          <input
            type="number"
            min="1"
            className="border px-2 py-1 rounded w-20 text-sm text-right"
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="space-y-3 px-4 py-2 max-h-[60vh] overflow-y-auto">
        {paginated.length === 0 && (
          <div className="text-center text-gray-400 py-8">No transactions</div>
        )}
        {paginated.map((t) => {
          const borderColor = t['Transaction Type'] === 'Add'
            ? 'border-green-300 bg-green-50'
            : t['Transaction Type'] === 'Sell'
            ? 'border-red-400 bg-red-50'
            : 'border-gray-200 bg-white';
          const isEditing = editId === t.ID;
          return (
            <div
              key={t.ID}
              className={`relative p-4 rounded-lg shadow border-l-4 ${borderColor} space-y-1 transition-all`}
            >
              {/* Actions top-right */}
              <div className="absolute top-4 right-4 flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      className="bg-green-100 text-green-800 hover:bg-green-200 px-2 py-1 rounded text-xs"
                      onClick={handleEditSave}
                    >Save</button>
                    <button
                      className="bg-gray-100 text-gray-800 hover:bg-gray-200 px-2 py-1 rounded text-xs"
                      onClick={() => setEditId(null)}
                    >Cancel</button>
                  </>
                ) : (
                  <>
                    <button
                      className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-2 py-1 rounded text-xs"
                      title="Edit"
                      aria-label="Edit"
                      onClick={() => handleEdit(t.ID)}
                    >✏️</button>
                    <button
                      className="bg-red-100 text-red-800 hover:bg-red-200 px-2 py-1 rounded text-xs"
                      title="Delete"
                      aria-label="Delete"
                      onClick={() => handleDelete(t.ID)}
                    >🗑️</button>
                  </>
                )}
              </div>
              {/* Card content */}
              {isEditing ? (
                <>
                  <div className="text-sm font-medium text-gray-900">
                    <span>{t['Transaction Type'] === 'Sell' ? 'Sold' : 'Added'}</span>
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-16 mx-2 text-sm"
                      value={editData['Quantity']}
                      onChange={e => handleEditChange('Quantity', e.target.value)}
                    />
                    pcs of
                    <input
                      className="border rounded px-2 py-1 w-24 mx-2 text-sm"
                      value={editData['Item Type']}
                      onChange={e => handleEditChange('Item Type', e.target.value)}
                    />
                    -
                    <input
                      className="border rounded px-2 py-1 w-32 mx-2 text-sm"
                      value={editData['Item Description']}
                      onChange={e => handleEditChange('Item Description', e.target.value)}
                    />
                  </div>
                  <div className="text-xs text-gray-700 italic mt-1 flex flex-wrap gap-2 items-center">
                    Price:
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-20 text-xs mx-1"
                      value={editData['Price']}
                      onChange={e => handleEditChange('Price', e.target.value)}
                    />
                    |
                    Mode:
                    <input
                      className="border rounded px-2 py-1 w-20 text-xs mx-1"
                      value={editData['Mode']}
                      onChange={e => handleEditChange('Mode', e.target.value)}
                    />
                    |
                    Note:
                    <input
                      className="border rounded px-2 py-1 w-32 text-xs mx-1"
                      value={editData['Note']}
                      onChange={e => handleEditChange('Note', e.target.value)}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDateDMYTimeSec(editData['Timestamp'] || t.Timestamp)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium text-gray-900">
                    {t['Transaction Type'] === 'Sell' ? 'Sold' : 'Added'} {t.Quantity} pcs of {t['Item Type']} - {t['Item Description']}
                  </div>
                  <div className="text-xs text-gray-700 italic mt-1">
                    Price: ₹{Number(t.Price).toFixed(2)} | Mode: {t.Mode} | Note: {t.Note}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDateDMYTimeSec(t.Timestamp)}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap justify-between items-center px-4 pb-4">
        <p className="text-sm text-gray-600 mb-2 md:mb-0">
          Showing {paginated.length} of {filtered.length} transactions
        </p>
        <div className="space-x-2 flex items-center">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >« Prev</button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >Next »</button>
        </div>
      </div>
    </section>
  );
}
