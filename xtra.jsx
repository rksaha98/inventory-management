import React, { useEffect, useState } from 'react';

const TransactionTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('All');
  const [editRowId, setEditRowId] = useState(null);
  const [editData, setEditData] = useState({});
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch('/.netlify/functions/getTransactionsFromGoogle')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const reversed = data.reverse(); // latest first
          setTransactions(reversed);
        } else {
          console.error("Invalid transaction data format:", data);
        }
      })
      .catch(err => {
        console.error("Error loading transactions:", err);
      });
  }, []);

  const filteredData = filter === 'All'
    ? transactions
    : transactions.filter(txn => txn['Transaction Type'] === filter);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleEditClick = (txn) => {
    setEditRowId(txn.ID);
    setEditData({ ...txn });
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditCancel = () => {
    setEditRowId(null);
    setEditData({});
  };

  const handleEditSave = async (editedRow) => {
    try {
      const res = await fetch('/.netlify/functions/editTransaction', {
        method: 'POST',
        body: JSON.stringify(editedRow),
      });
      const result = await res.json();
      if (result.success) {
        const updated = transactions.map(t =>
          t.ID === editedRow.ID ? editedRow : t
        );
        setTransactions(updated);
        setEditRowId(null);
        setEditData({});
      } else {
        console.error("Edit failed:", result.error);
      }
    } catch (err) {
      console.error("Error saving edit:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch('/.netlify/functions/deleteTransaction', {
        method: 'POST',
        body: JSON.stringify({ id }),
      });
      const result = await res.json();
      if (result.success) {
        const updated = transactions.filter(t => t.ID !== id);
        setTransactions(updated);
      } else {
        console.error("Delete failed:", result.error);
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
    }
  };

  return (
    <section className="w-full max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 mb-10">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">📄 Transaction Logs</h2>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button onClick={() => setFilter('All')} className={`px-3 py-1 border rounded ${filter === 'All' ? 'bg-blue-100' : ''}`}>All</button>
          <button onClick={() => setFilter('Add')} className={`px-3 py-1 border rounded ${filter === 'Add' ? 'bg-green-100' : ''}`}>Add</button>
          <button onClick={() => setFilter('Sell')} className={`px-3 py-1 border rounded ${filter === 'Sell' ? 'bg-red-100' : ''}`}>Sell</button>
        </div>
        <div className="text-sm">
          Rows per page:{' '}
          <input
            type="number"
            className="border px-2 py-1 w-16"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            min={1}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table-auto w-full text-sm border-collapse">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Type</th>
              <th className="p-2">Category</th>
              <th className="p-2">Item Description</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Price</th>
              <th className="p-2">Timestamp</th>
              <th className="p-2">Mode</th>
              <th className="p-2">Note</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((txn) => (
              <tr key={txn.ID} className="odd:bg-gray-50">
                {editRowId === txn.ID ? (
                  <>
                    <td className="p-2">{txn.ID}</td>
                    <td className="p-2">{txn['Transaction Type']}</td>
                    <td className="p-2">
                      <input value={editData['Item Type']} onChange={(e) => handleEditChange('Item Type', e.target.value)} className="input" />
                    </td>
                    <td className="p-2">
                      <input value={editData['Item Description']} onChange={(e) => handleEditChange('Item Description', e.target.value)} className="input" />
                    </td>
                    <td className="p-2">
                      <input type="number" value={editData['Quantity']} onChange={(e) => handleEditChange('Quantity', e.target.value)} className="input" />
                    </td>
                    <td className="p-2">
                      <input type="number" value={editData['Price']} onChange={(e) => handleEditChange('Price', e.target.value)} className="input" />
                    </td>
                    <td className="p-2">{txn['Timestamp']}</td>
                    <td className="p-2">
                      <input value={editData['Mode']} onChange={(e) => handleEditChange('Mode', e.target.value)} className="input" />
                    </td>
                    <td className="p-2">
                      <input value={editData['Note']} onChange={(e) => handleEditChange('Note', e.target.value)} className="input" />
                    </td>
                    <td className="p-2">
                      <button onClick={() => handleEditSave(editData)} className="text-green-600 hover:underline mr-2">💾</button>
                      <button onClick={handleEditCancel} className="text-gray-600 hover:underline">✖</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2">{txn.ID}</td>
                    <td className="p-2">{txn['Transaction Type']}</td>
                    <td className="p-2">{txn['Item Type']}</td>
                    <td className="p-2">{txn['Item Description']}</td>
                    <td className="p-2">{txn['Quantity']}</td>
                    <td className="p-2">₹{txn['Price']}</td>
                    <td className="p-2">{txn['Timestamp']}</td>
                    <td className="p-2">{txn['Mode']}</td>
                    <td className="p-2">{txn['Note']}</td>
                    <td className="p-2">
                      <button onClick={() => handleEditClick(txn)} className="text-blue-600 hover:underline mr-2">Edit</button>
                      <button onClick={() => handleDelete(txn.ID)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-400" colSpan="10">No transactions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between mt-4">
        <button
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default TransactionTable;
