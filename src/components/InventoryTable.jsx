import React, { useEffect, useState } from 'react';

const API_URL = '/.netlify/functions/getInventoryFromGoogle';

const buyColor = '#16a34a'; // green-600
const sellColor = '#ea580c'; // orange-600
const lowStockThreshold = 5;
const lowStockColor = '#f43f5e'; // rose-600

export default function InventoryTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandPurchase, setExpandPurchase] = useState(false);
  const [expandSales, setExpandSales] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then((resData) => {
        if (!Array.isArray(resData)) {
          setError("Invalid data format");
          setData([]);
        } else {
          setData(resData);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching inventory data:", err);
        setError("Failed to load inventory");
        setLoading(false);
      });
  }, []);

  return (
    <section className="w-full max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">📦 Inventory Summary</h2>

      <div className="flex gap-4 mb-4">
        <button
          className="px-4 py-1 rounded border text-sm font-semibold"
          style={{
            backgroundColor: expandPurchase ? buyColor : '#e5f9ec',
            color: expandPurchase ? '#fff' : buyColor,
            borderColor: buyColor
          }}
          onClick={() => setExpandPurchase(!expandPurchase)}
        >
          {expandPurchase ? 'Hide Purchase Details' : 'Show Purchase Details'}
        </button>

        <button
          className="px-4 py-1 rounded border text-sm font-semibold"
          style={{
            backgroundColor: expandSales ? sellColor : '#ffeadd',
            color: expandSales ? '#fff' : sellColor,
            borderColor: sellColor
          }}
          onClick={() => setExpandSales(!expandSales)}
        >
          {expandSales ? 'Hide Sales Details' : 'Show Sales Details'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table-auto w-full text-sm border-collapse">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Item Type</th>
              <th className="p-2">Item Description</th>
              <th className="p-2">In Stock</th>
              {expandPurchase && (
                <>
                  <th className="p-2 border-l-2" style={{ color: buyColor }}>Total Purchased</th>
                  <th className="p-2" style={{ color: buyColor }}>Avg Purchase Price</th>
                  <th className="p-2" style={{ color: buyColor }}>Total Purchase Value</th>
                </>
              )}
              {expandSales && (
                <>
                  <th className="p-2 border-l-2" style={{ color: sellColor }}>Total Sold</th>
                  <th className="p-2" style={{ color: sellColor }}>Avg Sale Price</th>
                  <th className="p-2" style={{ color: sellColor }}>Total Sales Value</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="10" className="p-4 text-center text-gray-400">Loading data...</td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan="10" className="p-4 text-center text-red-600">{error}</td>
              </tr>
            )}

            {!loading && !error && data.length === 0 && (
              <tr>
                <td colSpan="10" className="p-4 text-center text-gray-400">No data found</td>
              </tr>
            )}

            {!loading && !error && data.map((item, idx) => {
              const isLowStock = Number(item['In Stock']) <= lowStockThreshold;
              return (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  style={isLowStock ? { backgroundColor: lowStockColor + '22' } : {}}
                >
                  <td className="p-2 font-medium">{item['Item Type']}</td>
                  <td className="p-2">{item['Item Description']}</td>
                  <td className="p-2">{item['In Stock']}</td>

                  {expandPurchase && (
                    <>
                      <td className="p-2 border-l-2">{item['Total Purchased']}</td>
                      <td className="p-2">₹{Number(item['Avg Purchase Price']).toFixed(2)}</td>
                      <td className="p-2">₹{Number(item['Total Purchase Value']).toFixed(2)}</td>
                    </>
                  )}
                  {expandSales && (
                    <>
                      <td className="p-2 border-l-2">{item['Total Sold']}</td>
                      <td className="p-2">₹{Number(item['Avg Sale Price']).toFixed(2)}</td>
                      <td className="p-2">₹{Number(item['Total Sales Value']).toFixed(2)}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
