import React, { useEffect, useState } from "react";

const PURCHASE_COLS = [
  { key: "totalPurchased", label: "Total Purchased" },
  { key: "avgPurchasePrice", label: "Avg Purchase Price" },
  { key: "totalPurchaseValue", label: "Total Purchase Value" },
];
const SALES_COLS = [
  { key: "totalSold", label: "Total Sold" },
  { key: "avgSalePrice", label: "Avg Sale Price" },
  { key: "totalSalesValue", label: "Total Sales Value" },
];

function aggregateInventory(transactions) {
  const summary = {};
  transactions.forEach((row) => {
    const {
      "Item Type": itemType,
      "Item Description": itemDescription,
      "Transaction Type": type,
      Quantity,
      Price,
    } = row;
    if (!itemType || !itemDescription) return;
    const key = `${itemType}|||${itemDescription}`;
    if (!summary[key]) {
      summary[key] = {
        itemType,
        itemDescription,
        totalPurchased: 0,
        totalPurchaseValue: 0,
        purchasePrices: [],
        totalSold: 0,
        totalSalesValue: 0,
        salePrices: [],
      };
    }
    if (type === "Add") {
      summary[key].totalPurchased += Number(Quantity);
      summary[key].totalPurchaseValue += Number(Quantity) * Number(Price);
      summary[key].purchasePrices.push(Number(Price));
    } else if (type === "Sell") {
      summary[key].totalSold += Number(Quantity);
      summary[key].totalSalesValue += Number(Quantity) * Number(Price);
      summary[key].salePrices.push(Number(Price));
    }
  });

  // Calculate averages and in stock
  return Object.values(summary).map((item) => {
    const avgPurchasePrice =
      item.purchasePrices.length > 0
        ? (
            item.totalPurchaseValue /
            (item.totalPurchased || 1)
          ).toFixed(2)
        : "-";
    const avgSalePrice =
      item.salePrices.length > 0
        ? (
            item.totalSalesValue /
            (item.totalSold || 1)
          ).toFixed(2)
        : "-";
    return {
      ...item,
      inStock: item.totalPurchased - item.totalSold,
      avgPurchasePrice,
      avgSalePrice,
      totalPurchaseValue: item.totalPurchaseValue.toFixed(2),
      totalSalesValue: item.totalSalesValue.toFixed(2),
    };
  });
}

export default function InventoryTable() {
  const [data, setData] = useState([]);
  const [showPurchase, setShowPurchase] = useState(true);
  const [showSales, setShowSales] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      try {
        const res = await fetch("/.netlify/functions/getTransactionsFromGoogle");
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } catch (err) {
        setData([]);
      }
      setLoading(false);
    }
    fetchTransactions();
  }, []);

  const summary = aggregateInventory(data);

  // Optional: sort by inStock descending, then by itemDescription
  summary.sort(
    (a, b) =>
      b.inStock - a.inStock ||
      a.itemDescription.localeCompare(b.itemDescription)
  );

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded ${
            showPurchase
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
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
                  key={item.itemType + item.itemDescription}
                  className={
                    item.inStock <= 5
                      ? "bg-rose-100"
                      : ""
                  }
                >
                  <td className="px-3 py-2 border">{item.itemType}</td>
                  <td className="px-3 py-2 border">{item.itemDescription}</td>
                  <td className="px-3 py-2 border font-semibold">{item.inStock}</td>
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