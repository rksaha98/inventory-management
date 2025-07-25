import React, { useEffect, useState, useRef, useCallback } from "react";

function formatCurrency(num) {
  return "₹" + Number(num).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function InventoryTable({ buyColor = "#8dc540", sellColor = "#fec10e", lowStockColor = "#f43f5e", lowStockQty = 5 }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showSales, setShowSales] = useState(false);
  const [typeFilter, setTypeFilter] = useState([]); // Multi-select
  const [descFilter, setDescFilter] = useState([]); // Multi-select
  const [typeDropdown, setTypeDropdown] = useState(false);
  const [descDropdown, setDescDropdown] = useState(false);
  const [typeSearch, setTypeSearch] = useState("");
  const [descSearch, setDescSearch] = useState("");
  const [typeActiveIdx, setTypeActiveIdx] = useState(0);
  const [descActiveIdx, setDescActiveIdx] = useState(0);
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

  // Unique types/descriptions for filter dropdowns
  const itemTypes = Array.from(new Set(data.map((d) => d["Item Type"])));

  const itemDescs = Array.from(new Set(data.map((d) => d["Item Description"])));

  // Dropdown close on click outside
  useEffect(() => {
    function handle(e) {
      if (typeRef.current && !typeRef.current.contains(e.target)) setTypeDropdown(false);
      if (descRef.current && !descRef.current.contains(e.target)) setDescDropdown(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Filtered and sorted summary
  const summary = data
    .filter((item) => {
      const typeMatch = typeFilter.length === 0 || typeFilter.includes(item["Item Type"]);
      const descMatch = descFilter.length === 0 || descFilter.includes(item["Item Description"]);
      return typeMatch && descMatch;
    })
    .sort(
      (a, b) => b["In Stock"] - a["In Stock"] || a["Item Description"].localeCompare(b["Item Description"])
    );

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

  // Determine visible columns
  const baseCols = [
    { key: 'Item Type', label: 'Item Type', filter: true },
    { key: 'Item Description', label: 'Item Description', filter: true },
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
    <section className="w-[70%] max-w-full mx-auto mb-6 px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
      <div className="overflow-x-auto bg-[#232b3a] rounded-xl shadow-lg ring-1 ring-[#3a506b] w-full">
        <div className="flex items-center justify-between pt-6 px-6">
          <span className="text-2xl font-semibold text-gray-100 mb-4 tracking-tight">📦 Inventory Summary</span>
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
        <div className="relative px-2 sm:px-6 pb-6">
          <table className="min-w-full divide-y divide-[#3a506b] text-sm table-fixed bg-[#232b3a] text-gray-100" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              {visibleCols.map((_, i) => (
                <col key={i} style={{ width: `${100 / colCount}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-[#1b262c]">
                {visibleCols.map((col, i) => (
                  <th key={col.key} className="px-3 py-2 border-b border-[#3a506b] text-left relative font-semibold text-gray-200">
                    <span>{col.label}</span>
                    {/* Filter button for Item Type and Item Description */}
                    {col.filter && (
                      <button
                        className="ml-2 p-1 rounded hover:bg-[#3a506b]/30 focus:bg-[#3a506b]/40 border border-transparent focus:outline-none"
                        title={`Filter ${col.label}`}
                        onClick={e => {
                          e.stopPropagation();
                          if (col.key === 'Item Type') setTypeDropdown(v => !v);
                          if (col.key === 'Item Description') setDescDropdown(v => !v);
                        }}
                        tabIndex={0}
                        aria-label={`Filter ${col.label}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-3.586a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" /></svg>
                      </button>
                    )}
                    {/* Dropdown for Item Type (multi-select, keyboard nav) */}
                    {col.key === 'Item Type' && typeDropdown && (
                      <div ref={typeRef} className="absolute bg-[#232b3a] border border-[#3a506b] rounded shadow-lg z-10 mt-2 p-2 w-64 left-0 top-full text-gray-100">
                        <input
                          className="w-full p-1 border border-[#3a506b] rounded text-sm mb-1 bg-[#1b262c] text-gray-100 placeholder-gray-400"
                          placeholder="Search Item Type..."
                          value={typeSearch}
                          onChange={e => { setTypeSearch(e.target.value); setTypeActiveIdx(0); }}
                          autoFocus
                          onKeyDown={e => {
                            const filtered = itemTypes.filter(t => t && t.toLowerCase().includes(typeSearch.toLowerCase()));
                            if (e.key === 'ArrowDown') {
                              setTypeActiveIdx(i => Math.min(i + 1, filtered.length));
                              e.preventDefault();
                            } else if (e.key === 'ArrowUp') {
                              setTypeActiveIdx(i => Math.max(i - 1, 0));
                              e.preventDefault();
                            } else if (e.key === 'Enter' || e.key === ' ') {
                              if (typeActiveIdx === 0) {
                                // Select All
                                if (typeFilter.length === filtered.length) setTypeFilter([]);
                                else setTypeFilter(filtered);
                              } else {
                                const t = filtered[typeActiveIdx - 1];
                                if (!t) return;
                                setTypeFilter(f => f.includes(t) ? f.filter(x => x !== t) : [...f, t]);
                              }
                              e.preventDefault();
                            } else if (e.key === 'Escape' || e.key === 'Tab') {
                              setTypeDropdown(false);
                            }
                          }}
                        />
                        <ul className="max-h-40 overflow-y-auto text-sm" tabIndex={-1}>
                          <li
                            className={`px-2 py-1 cursor-pointer flex items-center ${typeActiveIdx === 0 ? 'bg-[#3a506b]/40 font-bold' : ''}`}
                            onMouseEnter={() => setTypeActiveIdx(0)}
                            onClick={() => {
                              const filtered = itemTypes.filter(t => t && t.toLowerCase().includes(typeSearch.toLowerCase()));
                              if (typeFilter.length === filtered.length) setTypeFilter([]);
                              else setTypeFilter(filtered);
                            }}
                          >
                            <input type="checkbox" className="mr-2" readOnly checked={typeFilter.length === itemTypes.filter(t => t && t.toLowerCase().includes(typeSearch.toLowerCase())).length && typeFilter.length > 0} />
                            <span>{typeFilter.length === itemTypes.filter(t => t && t.toLowerCase().includes(typeSearch.toLowerCase())).length && typeFilter.length > 0 ? 'Unselect All' : 'Select All'}</span>
                          </li>
                          {itemTypes.filter(t => t && t.toLowerCase().includes(typeSearch.toLowerCase())).map((t, idx) => (
                            <li
                              key={t}
                              className={`px-2 py-1 hover:bg-[#3a506b]/40 cursor-pointer flex items-center ${typeFilter.includes(t) ? 'font-bold text-[#60a5fa]' : ''} ${typeActiveIdx === idx + 1 ? 'bg-[#3a506b]/40' : ''}`}
                              onMouseEnter={() => setTypeActiveIdx(idx + 1)}
                              onClick={() => setTypeFilter(f => f.includes(t) ? f.filter(x => x !== t) : [...f, t])}
                            >
                              <input type="checkbox" className="mr-2" readOnly checked={typeFilter.includes(t)} />
                              {t}
                            </li>
                          ))}
                          {typeSearch && itemTypes.filter(t => t && t.toLowerCase().includes(typeSearch.toLowerCase())).length === 0 && (
                            <li className="px-2 py-1 text-gray-500">No matches</li>
                          )}
                        </ul>
                        <div className="mt-2 flex justify-between">
                          <button className="text-xs text-[#60a5fa] hover:underline" onClick={() => { setTypeFilter([]); setTypeDropdown(false); setTypeSearch(''); }}>Clear</button>
                          <button className="text-xs text-[#60a5fa] hover:underline" onClick={() => setTypeDropdown(false)}>Done</button>
                        </div>
                      </div>
                    )}
                    {/* Dropdown for Item Description (multi-select, keyboard nav) */}
                    {col.key === 'Item Description' && descDropdown && (
                      <div ref={descRef} className="absolute bg-[#232b3a] border border-[#3a506b] rounded shadow-lg z-10 mt-2 p-2 w-64 left-0 top-full text-gray-100">
                        <input
                          className="w-full p-1 border border-[#3a506b] rounded text-sm mb-1 bg-[#1b262c] text-gray-100 placeholder-gray-400"
                          placeholder="Search Description..."
                          value={descSearch}
                          onChange={e => { setDescSearch(e.target.value); setDescActiveIdx(0); }}
                          autoFocus
                          onKeyDown={e => {
                            const filtered = itemDescs.filter(d => d && d.toLowerCase().includes(descSearch.toLowerCase()));
                            if (e.key === 'ArrowDown') {
                              setDescActiveIdx(i => Math.min(i + 1, filtered.length));
                              e.preventDefault();
                            } else if (e.key === 'ArrowUp') {
                              setDescActiveIdx(i => Math.max(i - 1, 0));
                              e.preventDefault();
                            } else if (e.key === 'Enter' || e.key === ' ') {
                              if (descActiveIdx === 0) {
                                if (descFilter.length === filtered.length) setDescFilter([]);
                                else setDescFilter(filtered);
                              } else {
                                const d = filtered[descActiveIdx - 1];
                                if (!d) return;
                                setDescFilter(f => f.includes(d) ? f.filter(x => x !== d) : [...f, d]);
                              }
                              e.preventDefault();
                            } else if (e.key === 'Escape' || e.key === 'Tab') {
                              setDescDropdown(false);
                            }
                          }}
                        />
                        <ul className="max-h-40 overflow-y-auto text-sm" tabIndex={-1}>
                          <li
                            className={`px-2 py-1 cursor-pointer flex items-center ${descActiveIdx === 0 ? 'bg-[#3a506b]/40 font-bold' : ''}`}
                            onMouseEnter={() => setDescActiveIdx(0)}
                            onClick={() => {
                              const filtered = itemDescs.filter(d => d && d.toLowerCase().includes(descSearch.toLowerCase()));
                              if (descFilter.length === filtered.length) setDescFilter([]);
                              else setDescFilter(filtered);
                            }}
                          >
                            <input type="checkbox" className="mr-2" readOnly checked={descFilter.length === itemDescs.filter(d => d && d.toLowerCase().includes(descSearch.toLowerCase())).length && descFilter.length > 0} />
                            <span>{descFilter.length === itemDescs.filter(d => d && d.toLowerCase().includes(descSearch.toLowerCase())).length && descFilter.length > 0 ? 'Unselect All' : 'Select All'}</span>
                          </li>
                          {itemDescs.filter(d => d && d.toLowerCase().includes(descSearch.toLowerCase())).map((d, idx) => (
                            <li
                              key={d}
                              className={`px-2 py-1 hover:bg-[#3a506b]/40 cursor-pointer flex items-center ${descFilter.includes(d) ? 'font-bold text-[#60a5fa]' : ''} ${descActiveIdx === idx + 1 ? 'bg-[#3a506b]/40' : ''}`}
                              onMouseEnter={() => setDescActiveIdx(idx + 1)}
                              onClick={() => setDescFilter(f => f.includes(d) ? f.filter(x => x !== d) : [...f, d])}
                            >
                              <input type="checkbox" className="mr-2" readOnly checked={descFilter.includes(d)} />
                              {d}
                            </li>
                          ))}
                          {descSearch && itemDescs.filter(d => d && d.toLowerCase().includes(descSearch.toLowerCase())).length === 0 && (
                            <li className="px-2 py-1 text-gray-500">No matches</li>
                          )}
                        </ul>
                        <div className="mt-2 flex justify-between">
                          <button className="text-xs text-[#60a5fa] hover:underline" onClick={() => { setDescFilter([]); setDescDropdown(false); setDescSearch(''); }}>Clear</button>
                          <button className="text-xs text-[#60a5fa] hover:underline" onClick={() => setDescDropdown(false)}>Done</button>
                        </div>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="text-center py-6 text-gray-400 bg-[#232b3a]">
                    Loading...
                  </td>
                </tr>
              ) : summary.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="text-center py-6 text-gray-400 bg-[#232b3a]">
                    No inventory data.
                  </td>
                </tr>
              ) : (
                summary.map((item, idx) => {
                  const isLow = item["In Stock"] <= lowStockQty;
                  return (
                    <tr
                      key={item["Item Type"] + item["Item Description"]}
                      className={`odd:bg-[#232b3a] even:bg-[#1b262c] hover:bg-[#3a506b]/40`}
                      style={isLow ? { background: withAlpha(lowStockColor, 0.18) } : {}}
                    >
                      {visibleCols.map((col, i) => {
                        let value = item[col.key];
                        if (col.isCurrency) value = formatCurrency(value);
                        let cellStyle = {};
                        if (col.color) {
                          cellStyle = { background: withAlpha(col.color, 0.13), color: col.color };
                        }
                        return (
                          <td key={col.key} className="px-3 py-2 border-b border-[#3a506b] truncate max-w-xs text-left">
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