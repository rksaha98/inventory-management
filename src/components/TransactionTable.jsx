// File: components/TransactionTable.jsx

import React, { useEffect, useState } from 'react';
import formatDateDMYTimeSec from './formatDateDMYTimeSec';

const API_URL = '/.netlify/functions/getTransactionsFromGoogle';
const DELETE_URL = '/.netlify/functions/deleteTransaction';
const EDIT_URL = '/.netlify/functions/editTransaction';

export default function TransactionTable({ onSuccess }) {
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete transaction ID ${id}?`)) return;
    try {
      const res = await fetch(DELETE_URL, {
        method: 'POST',
        body: JSON.stringify({ id })
      });
      const result = await res.json();
      if (result.success) {
        fetchTransactions();
        if (onSuccess) onSuccess(); // trigger summary refresh
      }
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
        fetchTransactions();
        setEditId(null);
        if (onSuccess) onSuccess(); // trigger summary refresh
      } else {
        console.error('❌ Save error:', result.error);
      }
    } catch (err) {
      console.error('❌ Error saving edit:', err);
    }
  };


  // --- Filtering Logic ---
  // Helper: parse date string to yyyy-mm-dd robustly
  function parseDateYMD(dateStr) {
    if (!dateStr) return '';
    // yyyy-mm-dd or yyyy-mm-ddTHH:MM:SS
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.slice(0, 10);
    // dd-mm-yyyy
    if (/^\d{2}-\d{2}-\d{4}/.test(dateStr)) {
      const [dd, mm, yyyy] = dateStr.split('-');
      return `${yyyy}-${mm}-${dd}`;
    }
    // mm/dd/yyyy or mm-dd-yyyy
    if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(dateStr)) {
      const parts = dateStr.split(/[\/\-]/);
      return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
    // d/m/yyyy, d/m/yyyy, ... (with or without time)
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(dateStr)) {
      // e.g. 21/7/2025, 12:57:53 am
      const [datePart] = dateStr.split(',');
      const [d, m, y] = datePart.split(/[\/\-]/);
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    // fallback: try Date parse
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    return '';
  }

  // Today's date in yyyy-mm-dd
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Filter by type
  let filtered = transactions;
  if (filterType !== 'All') {
    filtered = filtered.filter(t => t['Transaction Type'] === filterType);
  }

  // Date filter: if both blank, show only today's logs
  filtered = filtered.filter(t => {
    const txDate = parseDateYMD(t.Timestamp || t.timestamp || '');
    if (!txDate) return false;
    // If both blank, show only today's logs
    if (!fromDate && !toDate) {
      return txDate === todayStr;
    }
    // If only fromDate
    if (fromDate && !toDate) return txDate >= fromDate;
    // If only toDate
    if (!fromDate && toDate) return txDate <= toDate;
    // Both fromDate and toDate
    return txDate >= fromDate && txDate <= toDate;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Reset page to 1 on filter change
  useEffect(() => { setCurrentPage(1); }, [filterType, fromDate, toDate]);

  return (
    <section className="w-[60%] max-w-full mx-auto mb-8 bg-[#232b3a] shadow-xl rounded-xl border-2 border-[#3a506b]">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6">
        <h2 className="text-xl font-bold text-gray-100 px-0 pb-0">🧾 Transaction Logs</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <select
            className="border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 px-3 py-2 rounded text-base focus:ring-2 focus:ring-blue-500"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Add">Add</option>
            <option value="Sell">Sell</option>
          </select>
          {/* From-To Date Filters */}
          <input
            type="date"
            className="border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 px-3 py-2 rounded text-base focus:ring-2 focus:ring-blue-500"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            max={toDate || todayStr}
            placeholder="From"
            title="From date"
          />
          <input
            type="date"
            className="border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 px-3 py-2 rounded text-base focus:ring-2 focus:ring-blue-500"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            min={fromDate}
            max={todayStr}
            placeholder="To"
            title="To date"
          />
          <input
            type="number"
            min="1"
            className="border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 px-3 py-2 rounded w-24 text-base text-right focus:ring-2 focus:ring-blue-500"
            value={rowsPerPage}
            onChange={e => setRowsPerPage(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="space-y-3 px-6 py-4 max-h-[60vh] overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading transactions...</div>
        ) : paginated.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No transactions</div>
        ) : paginated.map((t) => {
          const isEditing = editId === t.ID;
          return (
            <div
              key={t.ID}
              className={`relative p-4 rounded-lg shadow border-l-4 space-y-1 transition-all
                ${t['Transaction Type'] === 'Add' ? 'border-[#8dc540] bg-[#1b262c]' : t['Transaction Type'] === 'Sell' ? 'border-[#fec10e] bg-[#232b3a]' : 'border-[#3a506b] bg-[#232b3a]'}
              `}
            >
              {/* Actions top-right */}
              <div className="absolute top-4 right-4 flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      className={`border-2 px-3 py-2 rounded text-xs font-semibold focus:ring-2 focus:ring-blue-500 transition-colors
                        ${editData['Transaction Type'] === 'Add' ? 'border-[#8dc540] text-[#8dc540] bg-[#1b262c] hover:bg-[#8dc540]/10' : 'border-[#fec10e] text-[#fec10e] bg-[#1b262c] hover:bg-[#fec10e]/10'}`}
                      onClick={handleEditSave}
                    >Save</button>
                    <button
                      className="border-2 border-[#3a506b] bg-[#1b262c] text-gray-300 hover:bg-[#232b3a] px-3 py-2 rounded text-xs font-semibold focus:ring-2 focus:ring-blue-500 transition-colors"
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
                  <div className="text-sm font-medium text-gray-100">
                    <span>{t['Transaction Type'] === 'Sell' ? 'Sold' : 'Added'}</span>
                    <input
                      type="number"
                      className="border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 rounded px-2 py-1 w-16 mx-2 text-sm focus:ring-2 focus:ring-blue-500"
                      value={editData['Quantity']}
                      onChange={e => handleEditChange('Quantity', e.target.value)}
                    />
                    pcs of
                    <input
                      className="border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 rounded px-2 py-1 w-24 mx-2 text-sm focus:ring-2 focus:ring-blue-500"
                      value={editData['Item Type']}
                      onChange={e => handleEditChange('Item Type', e.target.value)}
                    />
                    -
                    <input
                      className="border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 rounded px-2 py-1 w-32 mx-2 text-sm focus:ring-2 focus:ring-blue-500"
                      value={editData['Item Description']}
                      onChange={e => handleEditChange('Item Description', e.target.value)}
                    />
                  </div>
                  <div className="text-xs text-gray-300 italic mt-1 flex flex-wrap gap-2 items-center">
                    Price:
                    <input
                      type="number"
                      className="border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 rounded px-2 py-1 w-20 text-xs mx-1 focus:ring-2 focus:ring-blue-500"
                      value={editData['Price']}
                      onChange={e => handleEditChange('Price', e.target.value)}
                    />
                    |
                    Mode:
                    <input
                      className="border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 rounded px-2 py-1 w-20 text-xs mx-1 focus:ring-2 focus:ring-blue-500"
                      value={editData['Mode']}
                      onChange={e => handleEditChange('Mode', e.target.value)}
                    />
                    |
                    Note:
                    <input
                      className="border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 rounded px-2 py-1 w-32 text-xs mx-1 focus:ring-2 focus:ring-blue-500"
                      value={editData['Note']}
                      onChange={e => handleEditChange('Note', e.target.value)}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDateDMYTimeSec(editData['Timestamp'] || t.Timestamp)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium text-gray-100">
                    {t['Transaction Type'] === 'Sell' ? 'Sold' : 'Added'} {t.Quantity} pcs of {t['Item Type']} - {t['Item Description']}
                  </div>
                  <div className="text-xs text-gray-300 italic mt-1">
                    Price: ₹{Number(t.Price).toFixed(2)} | Mode: {t.Mode} | Note: {t.Note}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDateDMYTimeSec(t.Timestamp)}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap justify-between items-center px-6 pb-6">
        <p className="text-sm text-gray-400 mb-2 md:mb-0">
          Showing {paginated.length} of {filtered.length} transactions
        </p>
        <div className="space-x-2 flex items-center">
          <button
            className="px-4 py-2 border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 rounded disabled:opacity-50 text-base font-semibold"
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >« Prev</button>
          <span className="text-base text-gray-200">Page {currentPage} of {totalPages}</span>
          <button
            className="px-4 py-2 border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 rounded disabled:opacity-50 text-base font-semibold"
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >Next »</button>
        </div>
      </div>
    </section>
  );
}
