import React, { useEffect, useState } from "react";

const PURCHASE_COLS = [
  { key: "Total Purchased", label: "Total Purchased" },
  { key: "Avg Purchase Price", label: "Avg Purchase Price" },
  { key: "Total Purchase Value", label: "Total Purchase Value" },
];
const SALES_COLS = [
  { key: "Total Sold", label: "Total Sold" },
  { key: "Avg Sale Price", label: "Avg Sale Price" },
  { key: "Total Sales Value", label: "Total Sales Value" },
];

export default function InventoryTable() {
  const [data, setData] = useState([]);
  const [showPurchase, setShowPurchase] = useState(true);
  const [showSales, setShowSales] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      try {
        const res = await fetch("/.netlify/functions/getInventorySummary");
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } catch (err) {
        setData([]);
      }
      setLoading(false);
    }
    fetchSummary();
  }, []);

  // Optional: sort by In Stock descending, then by Item Description
  const summary = [...data].sort(
    (a, b) => b["In Stock"] - a["In Stock"] || a["Item Description"].localeCompare(b["Item Description"])
  );

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded ${
            showPurchase ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setShowPurchase((v) => !v)}
        >
          {showPurchase ? "Hide" : "Show"} Purchase Details
        </button>
        <button
          className={`px-3 py-1 rounded ${
            showSales ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setShowSales((v) => !v)}
        >
          {showSales ? "Hide" : "Show"} Sales Details
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded shadow bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 border">Item Type</th>
              <th className="px-3 py-2 border">Item Description</th>
              <th className="px-3 py-2 border">In Stock</th>
              {showPurchase &&
                PURCHASE_COLS.map((col) => (
                  <th key={col.key} className="px-3 py-2 border">
                    {col.label}
                  </th>
                ))}
              {showSales &&
                SALES_COLS.map((col) => (
                  <th key={col.key} className="px-3 py-2 border">
                    {col.label}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3 + (showPurchase ? 3 : 0) + (showSales ? 3 : 0)} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : summary.length === 0 ? (
              <tr>
                <td colSpan={3 + (showPurchase ? 3 : 0) + (showSales ? 3 : 0)} className="text-center py-6">
                  No inventory data.
                </td>
              </tr>
            ) : (
              summary.map((item) => (
                <tr
                  key={item["Item Type"] + item["Item Description"]}
                  className={item["In Stock"] <= 5 ? "bg-rose-100" : ""}
                >
                  <td className="px-3 py-2 border">{item["Item Type"]}</td>
                  <td className="px-3 py-2 border">{item["Item Description"]}</td>
                  <td className="px-3 py-2 border font-semibold">{item["In Stock"]}</td>
                  {showPurchase &&
                    PURCHASE_COLS.map((col) => (
                      <td key={col.key} className="px-3 py-2 border">
                        {item[col.key]}
                      </td>
                    ))}
                  {showSales &&
                    SALES_COLS.map((col) => (
                      <td key={col.key} className="px-3 py-2 border">
                        {item[col.key]}
                      </td>
                    ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}