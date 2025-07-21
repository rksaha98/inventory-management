import React, { useEffect, useState } from "react";

function formatDate(dateStr) {
  // Assumes DD-MM-YYYY
  const [d, m, y] = dateStr.split("-");
  return `${y}-${m}-${d}`;
}

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
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
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
          const headers = ["Date", "Item Type", "Item Description", "Quantity", "Price", "Total"];
          rows = rows.map(arr => {
            const obj = {};
            headers.forEach((h, i) => { obj[h] = arr[i]; });
            return obj;
          });
        }
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
      const d = formatDate(date);
      const from = fromDate ? fromDate : d;
      const to = toDate ? toDate : d;
      return d >= from && d <= to;
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
  filteredDates.sort((a, b) => formatDate(b).localeCompare(formatDate(a)));

  // Prepare filtered data for CSV export
  const filteredRows = filteredDates.flatMap(date => grouped[date]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <div className="flex gap-2 items-center">
          <label className="font-medium">From:</label>
          <input type="date" className="border rounded px-2 py-1" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div className="flex gap-2 items-center">
          <label className="font-medium">To:</label>
          <input type="date" className="border rounded px-2 py-1" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
        <button
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded shadow"
          onClick={() => exportCSV(filteredRows)}
          disabled={filteredRows.length === 0}
        >
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded shadow bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 border">Date</th>
              <th className="px-3 py-2 border">Total Sales</th>
              <th className="px-3 py-2 border">Expand</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="text-center py-6">Loading sales summary...</td>
              </tr>
            ) : filteredDates.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6">No sales data.</td>
              </tr>
            ) : (
              filteredDates.map(date => {
                const rows = grouped[date];
                const totalSales = rows.reduce((sum, r) => sum + Number(r.Total), 0);
                return (
                  <React.Fragment key={date}>
                    <tr className="bg-gray-50">
                      <td className="px-3 py-2 border font-semibold">{date}</td>
                      <td className="px-3 py-2 border font-semibold">₹{totalSales.toFixed(2)}</td>
                      <td className="px-3 py-2 border text-center">
                        <button
                          className="px-2 py-1 bg-blue-100 rounded hover:bg-blue-200"
                          onClick={() => setExpanded(exp => ({ ...exp, [date]: !exp[date] }))}
                        >
                          {expanded[date] ? "Collapse" : "Expand"}
                        </button>
                      </td>
                    </tr>
                    {expanded[date] && (
                      <tr>
                        <td colSpan={3} className="p-0">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-200">
                                <th className="px-2 py-1 border">Item Type</th>
                                <th className="px-2 py-1 border">Item Description</th>
                                <th className="px-2 py-1 border">Quantity</th>
                                <th className="px-2 py-1 border">Price</th>
                                <th className="px-2 py-1 border">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((r, idx) => (
                                <tr key={idx}>
                                  <td className="px-2 py-1 border">{r["Item Type"]}</td>
                                  <td className="px-2 py-1 border">{r["Item Description"]}</td>
                                  <td className="px-2 py-1 border">{r["Quantity"]}</td>
                                  <td className="px-2 py-1 border">₹{Number(r["Price"]).toFixed(2)}</td>
                                  <td className="px-2 py-1 border">₹{Number(r["Total"]).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
