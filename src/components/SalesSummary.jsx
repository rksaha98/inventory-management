import React, { useState } from "react";

function exportCSV(data, filename = "sales-summary.csv") {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => row[h]));
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
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Fetch summary only when button is clicked
  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/salesSummary");
      const result = await res.json();
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      setData([]);
    }
    setLoading(false);
  };

  // Group by date (use backend date as-is)
  const grouped = {};
  data.forEach(row => {
    let date = row.date || 'Unknown';
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(row);
  });

  // Default: show only current day's sales summary
  let filteredDates = Object.keys(grouped);
  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
  if (!fromDate && !toDate) {
    filteredDates = filteredDates.filter(date => date === todayStr);
  } else {
    filteredDates = filteredDates.filter(date => {
      // Convert DD-MM-YYYY to YYYY-MM-DD for comparison
      const [d, m, y] = date.split('-');
      const dISO = `${y}-${m}-${d}`;
      const from = fromDate ? fromDate : dISO;
      const to = toDate ? toDate : dISO;
      return dISO >= from && dISO <= to;
    });
  }
  // Sort dates latest first
  filteredDates.sort((a, b) => {
    const [da, ma, ya] = a.split('-');
    const [db, mb, yb] = b.split('-');
    return new Date(`${yb}-${mb}-${db}`) - new Date(`${ya}-${ma}-${da}`);
  });
  const filteredRows = filteredDates.flatMap(date => grouped[date]);

  return (
    <div className="w-[60%] max-w-full mx-auto mb-8 flex flex-col items-center">
      <button
        className={`w-full px-4 py-3 rounded-xl shadow text-base font-semibold border-2 transition-colors mb-4
          ${showSummary ? 'bg-[#1b262c] text-blue-300 border-[#3a506b] hover:bg-[#232b3a]' : 'bg-[#232b3a] text-gray-100 border-[#3a506b] hover:bg-[#1b262c]'}
        `}
        onClick={() => {
          setShowSummary(v => !v);
          if (!showSummary) fetchSummary();
        }}
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
                // Calculate daily total sales and margin from backend data
                const totalSales = rows.reduce((sum, r) => sum + Number(r.sellTotal), 0);
                const totalMargin = rows.reduce((sum, r) => sum + Number(r.margin), 0);
                return (
                  <div key={date} className="relative p-4 rounded-lg shadow border-l-4 space-y-1 transition-all mb-4 border-yellow-700 bg-[#1b262c]">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="font-semibold text-yellow-200">Date: {date}</div>
                      <div className="font-semibold text-yellow-200">Total: ₹{totalSales.toLocaleString()}</div>
                      <div className="font-semibold text-yellow-200 flex items-center">Margin: {totalMargin.toFixed(2)}%</div>
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
                          <div className="grid grid-cols-9 gap-2 font-semibold text-yellow-200 border-b border-[#3a506b] pb-2 mb-2">
                            <div>Date</div>
                            <div>Item Type</div>
                            <div>Description</div>
                            <div>Sell Qty</div>
                            <div>Sell Price</div>
                            <div>Sell Total</div>
                            <div>Cost Price</div>
                            <div>Cost Total</div>
                            <div>Margin</div>
                          </div>
                          {rows.map((r, idx) => (
                            <div key={idx} className="grid grid-cols-9 gap-2 border-b border-[#3a506b] last:border-b-0 py-2 items-center">
                              <div>{r.date}</div>
                              <div>{r.itemType}</div>
                              <div>{r.itemDesc}</div>
                              <div>{r.sellQty}</div>
                              <div>₹{Number(r.sellTotal / r.sellQty || 0).toFixed(2)}</div>
                              <div>₹{Number(r.sellTotal).toLocaleString()}</div>
                              <div>₹{Number(r.costPrice).toFixed(2)}</div>
                              <div>₹{Number(r.costTotal).toLocaleString()}</div>
                              <div>{Number(r.margin).toFixed(2)}%</div>
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
