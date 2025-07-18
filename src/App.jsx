import React from 'react';
import InventoryTable from './components/InventoryTable';

function App() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gradient-to-b from-blue-100 to-pink-100 py-10 px-4">
      <h1 className="text-4xl font-bold text-center text-blue-800 mb-10 drop-shadow-md">
        🏠 Sarada PaintHouse Inventory
      </h1>

      {/* Inventory Summary Table */}
      <InventoryTable />

      {/* Add future components here like:
          <AddItemForm />
          <TransactionTable />
          <SalesSummary />
          <CreditLedger />
      */}
    </div>
  );
}

export default App;
