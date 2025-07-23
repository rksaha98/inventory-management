
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
    <div className="w-[60%] max-w-full mx-auto mb-8 flex flex-col items-center">
      <button
        className={`w-full px-4 py-3 rounded-xl shadow text-base font-semibold border-2 transition-colors mb-4
          ${showSummary
            ? 'bg-[#1b262c] text-blue-300 border-[#3a506b] hover:bg-[#232b3a]'
            : 'bg-[#232b3a] text-gray-100 border-[#3a506b] hover:bg-[#1b262c]'}
        `}
        onClick={() => setShowSummary(v => !v)}
        type="button"
      >
        {showSummary ? 'Hide Daily Sales Summary' : 'Show Daily Sales Summary'}
      </button>
      {showSummary && (
        <section className="w-full bg-[#232b3a] shadow-xl rounded-xl border-2 border-[#3a506b] px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-6 mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <span className="text-2xl font-semibold text-gray-100 tracking-tight">🧾 Daily Sales Summary</span>
            <div className="flex gap-3 items-center flex-wrap justify-end">
              <input
                type="date"
                className="border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 px-3 py-2 rounded text-base focus:ring-2 focus:ring-blue-500"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
              />
              <input
                type="date"
                className="border-2 border-[#3a506b] bg-[#1b262c] text-gray-100 px-3 py-2 rounded text-base focus:ring-2 focus:ring-blue-500"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
              />
              <button
                className="border-2 border-[#3a506b] bg-yellow-900 text-yellow-200 hover:bg-yellow-800 px-4 py-2 rounded text-base font-semibold shadow focus:ring-2 focus:ring-yellow-400 transition-colors disabled:opacity-50"
                onClick={() => exportCSV(filteredRows)}
                disabled={filteredRows.length === 0}
              >
                Export CSV
              </button>
            </div>
          </div>
          <div>
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading sales summary...</div>
            ) : filteredDates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No sales data.</div>
            ) : (
              filteredDates.map(date => {
                const rows = grouped[date];
                const totalSales = rows.reduce((sum, r) => sum + Number(r.Price) * Number(r.Quantity), 0);
                return (
                  <div key={date} className="relative p-4 rounded-lg shadow border-l-4 space-y-1 transition-all mb-4
                    border-yellow-700 bg-[#1b262c]">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="font-semibold text-yellow-200">Date: {date}</div>
                      <div className="font-semibold text-yellow-200">Total: ₹{totalSales.toLocaleString()}</div>
                      <button
                        className="border-2 border-[#3a506b] bg-[#232b3a] text-gray-100 hover:bg-[#1b262c] px-3 py-2 rounded text-xs font-semibold focus:ring-2 focus:ring-blue-500 transition-colors"
                        onClick={() => setExpanded(exp => ({ ...exp, [date]: !exp[date] }))}
                      >
                        {expanded[date] ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                    {expanded[date] && (
                      <div className="bg-[#232b3a] rounded p-3 mt-3 shadow text-sm text-gray-100">
                        <div className="w-full">
                          <div className="grid grid-cols-5 gap-2 font-semibold text-yellow-200 border-b border-[#3a506b] pb-2 mb-2">
                            <div>Item Type</div>
                            <div>Description</div>
                            <div>Quantity</div>
                            <div>Price</div>
                            <div>Total</div>
                          </div>
                          {rows.map((r, idx) => (
                            <div key={idx} className="grid grid-cols-5 gap-2 border-b border-[#3a506b] last:border-b-0 py-2 items-center">
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
        </section>
      )}
    </div>
  );
}
