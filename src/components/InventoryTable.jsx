import React, { useEffect, useState, useRef } from "react";

function formatCurrency(num) {
  return "₹" + Number(num).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function InventoryTable({ buyColor = "#16a34a", sellColor = "#f97316", lowStockColor = "#f43f5e", lowStockQty = 10 }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(true);
  const [showSales, setShowSales] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [descFilter, setDescFilter] = useState("");
  const [typeDropdown, setTypeDropdown] = useState(false);
  const [descDropdown, setDescDropdown] = useState(false);
  const [typeSearch, setTypeSearch] = useState("");
  const [descSearch, setDescSearch] = useState("");
  const typeRef = useRef();
  const descRef = useRef();

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

  // Filtered and sorted summary
  const summary = data
    .filter(
      (item) =>
        (!typeFilter || item["Item Type"] === typeFilter) &&
        (!descFilter || item["Item Description"] === descFilter)
    )
    .sort(
      (a, b) => b["In Stock"] - a["In Stock"] || a["Item Description"].localeCompare(b["Item Description"])
    );

  // Unique types/descriptions for filter dropdowns
  const itemTypes = Array.from(new Set(data.map((d) => d["Item Type"])));

  const itemDescs = Array.from(new Set(data.map((d) => d["Item Description"])));

  // Color helpers
  const lighten = (hex, amt) => {
    let c = hex.replace("#", "");
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    let [r, g, b] = [0, 2, 4].map((i) => parseInt(c.substr(i, 2), 16));
    r = Math.min(255, Math.floor(r + (255 - r) * amt));
    g = Math.min(255, Math.floor(g + (255 - g) * amt));
    b = Math.min(255, Math.floor(b + (255 - b) * amt));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };
  const withAlpha = (hex, alpha) => {
    let c = hex.replace("#", "");
    if (c.length === 3) c = c.split("").map((x) => x + x).join("");
    return `#${c}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
  };

  // Dropdown close on click outside
  useEffect(() => {
    function handle(e) {
      if (typeRef.current && !typeRef.current.contains(e.target)) setTypeDropdown(false);
      if (descRef.current && !descRef.current.contains(e.target)) setDescDropdown(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Calculate if purchase/sales columns should be visually hidden
  const purchaseHidden = !showPurchase;
  const salesHidden = !showSales;

  // Determine visible columns
  const baseCols = [
    { key: 'Item Type', label: 'Item Type' },
    { key: 'Item Description', label: 'Item Description' },
    { key: 'In Stock', label: 'In Stock' },
  ];
  const purchaseCols = [
    { key: 'Total Purchased', label: 'Total Purchased', color: buyColor },
    { key: 'Avg Purchase Price', label: 'Avg Purchase Price', color: buyColor, isCurrency: true },
    { key: 'Total Purchase Value', label: 'Total Purchase Value', color: buyColor, isCurrency: true },
  ];
  const salesCols = [
    { key: 'Total Sold', label: 'Total Sold', color: sellColor },
    { key: 'Avg Sale Price', label: 'Avg Sale Price', color: sellColor, isCurrency: true },
    { key: 'Total Sales Value', label: 'Total Sales Value', color: sellColor, isCurrency: true },
  ];
  let visibleCols = [...baseCols];
  if (showPurchase) visibleCols = visibleCols.concat(purchaseCols);
  if (showSales) visibleCols = visibleCols.concat(salesCols);
  const colCount = visibleCols.length;

  return (
    <section className="px-2 sm:px-6 md:px-10 lg:px-16 xl:px-24 animate-fade-in">
      <div className="overflow-x-auto bg-white rounded-lg shadow ring-1 ring-gray-300 w-full">
        <div className="flex items-center justify-between pt-6 px-6">
          <span className="text-2xl font-semibold text-blue-600 mb-4 tracking-tight">📦 Inventory Summary</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-3 px-6">
          <button
            className="text-xs px-3 py-1 rounded border font-semibold transition-colors duration-150 shadow-sm"
            style={
              showPurchase
                ? {
                    background: buyColor,
                    color: '#fff',
                    borderColor: 'transparent',
                    boxShadow: `0 2px 8px 0 ${buyColor}4D`,
                  }
                : {
                    background: lighten(buyColor, 0.7),
                    color: buyColor,
                    borderColor: lighten(buyColor, 0.5),
                  }
            }
            onClick={() => setShowPurchase((v) => !v)}
          >
            {showPurchase ? 'Hide' : 'Expand'} Purchase Details
          </button>
          <button
            className="text-xs px-3 py-1 rounded border font-semibold transition-colors duration-150 shadow-sm"
            style={
              showSales
                ? {
                    background: sellColor,
                    color: '#fff',
                    borderColor: 'transparent',
                    boxShadow: `0 2px 8px 0 ${sellColor}4D`,
                  }
                : {
                    background: lighten(sellColor, 0.7),
                    color: sellColor,
                    borderColor: lighten(sellColor, 0.5),
                  }
            }
            onClick={() => setShowSales((v) => !v)}
          >
            {showSales ? 'Hide' : 'Expand'} Sales Details
          </button>
        </div>
        <div className="relative px-6 pb-6">
          <table className="min-w-full divide-y divide-gray-200 text-sm table-fixed" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              {visibleCols.map((_, i) => (
                <col key={i} style={{ width: `${100 / colCount}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-gray-100">
                {visibleCols.map((col, i) => (
                  <th key={col.key} className="px-3 py-2 border-b text-left">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="text-center py-6">
                    Loading...
                  </td>
                </tr>
              ) : summary.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="text-center py-6">
                    No inventory data.
                  </td>
                </tr>
              ) : (
                summary.map((item, idx) => {
                  const isLow = item["In Stock"] <= lowStockQty;
                  return (
                    <tr
                      key={item["Item Type"] + item["Item Description"]}
                      className={`odd:bg-gray-50 even:bg-gray-100 hover:bg-blue-50 transition-colors duration-100`}
                      style={isLow ? { background: withAlpha(lowStockColor, 0.6) } : {}}
                    >
                      {visibleCols.map((col, i) => {
                        let value = item[col.key];
                        if (col.isCurrency) value = formatCurrency(value);
                        let cellStyle = {};
                        if (col.color) {
                          cellStyle = { background: withAlpha(col.color, 0.13), color: col.color };
                        }
                        return (
                          <td key={col.key} className="px-3 py-2 border-b truncate max-w-xs text-left">
                            <span style={cellStyle} className={col.color ? 'font-medium px-2 py-1 rounded' : ''}>
                              {value}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}