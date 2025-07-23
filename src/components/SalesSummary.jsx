
import React, { useEffect, useState } from "react";

function exportCSV(data, filename = "sales-summary.csv") {
  if (!data.length) return;
  // Remove 'Transaction Type' from each row
  const filtered = data.map(row => {
    const { ["Transaction Type"]: _, ...rest } = row;
    return rest;
  });
  const headers = Object.keys(filtered[0]);
  const rows = filtered.map(row => headers.map(h => row[h]));
  let csv = headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function SalesSummary() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      try {
        const res = await fetch("/.netlify/functions/getSalesSummary");
        const result = await res.json();
        let rows = result.rows || result;
        // If array-of-arrays, convert to array-of-objects
        if (Array.isArray(rows) && rows.length && Array.isArray(rows[0])) {
          const headers = ["Date", "Item Type", "Item Description", "Quantity", "Price", "Total", "Transaction Type"];
          rows = rows.map(arr => {
            const obj = {};
            headers.forEach((h, i) => { obj[h] = arr[i]; });
            return obj;
          });
        }
        // Only keep 'Sell' transactions
        rows = rows.filter(r => r["Transaction Type"] === "Sell" || r["Transaction Type"] === undefined);
        setData(Array.isArray(rows) ? rows : []);
      } catch (err) {
        setData([]);
      }
      setLoading(false);
    }
    fetchSummary();
  }, []);

  // Group by date
  const grouped = {};
  data.forEach(row => {
    const date = row.Date;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(row);
  });

  // Filter by date
  let filteredDates = Object.keys(grouped);
  if (fromDate || toDate) {
    filteredDates = filteredDates.filter(date => {
      // Format: DD-MM-YYYY
      const [d, m, y] = date.split("-");
      const dISO = `${y}-${m}-${d}`;
      const from = fromDate ? fromDate : dISO;
      const to = toDate ? toDate : dISO;
      return dISO >= from && dISO <= to;
    });
  } else {
    // Show only current date sales if no filter
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const currentDate = `${dd}-${mm}-${yyyy}`;
    filteredDates = filteredDates.filter(date => date === currentDate);
  }

  // Sort dates latest first
  filteredDates.sort((a, b) => {
    const [da, ma, ya] = a.split("-");
    const [db, mb, yb] = b.split("-");
    return new Date(`${yb}-${mb}-${db}`) - new Date(`${ya}-${ma}-${da}`);
  });

  // Prepare filtered data for CSV export
  const filteredRows = filteredDates.flatMap(date => grouped[date]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <button
        className="bg-red-100 hover:bg-red-200 text-red-800 font-medium px-4 py-2 rounded text-sm mb-4"
        onClick={() => setShowSummary(v => !v)}
      >
        {showSummary ? 'Hide Daily Sales Summary' : 'Show Daily Sales Summary'}
      </button>
      {showSummary && (
        <>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div className="text-lg font-semibold text-gray-800">🧾 Daily Sales Summary</div>
            <div className="flex gap-3 items-center flex-wrap">
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
              />
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
              />
              <button
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm shadow"
                onClick={() => exportCSV(filteredRows)}
                disabled={filteredRows.length === 0}
              >
                Export CSV
              </button>
            </div>
          </div>
          <div>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading sales summary...</div>
            ) : filteredDates.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No sales data.</div>
            ) : (
              filteredDates.map(date => {
                const rows = grouped[date];
                const totalSales = rows.reduce((sum, r) => sum + Number(r.Price) * Number(r.Quantity), 0);
                return (
                  <div key={date} className="p-4 bg-red-50 border-l-4 border-red-300 rounded-lg shadow mb-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-800">Date: {date}</div>
                      <div className="font-semibold text-gray-800">Total: ₹{totalSales.toLocaleString()}</div>
                      <button
                        className="bg-gray-200 px-3 py-1 text-sm rounded hover:bg-gray-300"
                        onClick={() => setExpanded(exp => ({ ...exp, [date]: !exp[date] }))}
                      >
                        {expanded[date] ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                    {expanded[date] && (
                      <div className="bg-white rounded p-3 mt-3 shadow text-sm text-gray-700">
                        <div className="w-full">
                          <div className="grid grid-cols-5 gap-2 font-semibold text-gray-800 border-b pb-2 mb-2">
                            <div>Item Type</div>
                            <div>Description</div>
                            <div>Quantity</div>
                            <div>Price</div>
                            <div>Total</div>
                          </div>
                          {rows.map((r, idx) => (
                            <div key={idx} className="grid grid-cols-5 gap-2 border-b last:border-b-0 py-2 items-center">
                              <div>{r["Item Type"]}</div>
                              <div>{r["Item Description"]}</div>
                              <div>{r["Quantity"]}</div>
                              <div>₹{Number(r["Price"]).toFixed(2)}</div>
                              <div>₹{(Number(r["Price"]) * Number(r["Quantity"]) || 0).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
