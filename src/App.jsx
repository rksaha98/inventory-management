import React from 'react';
import InventoryTable from './components/InventoryTable';
import AddItemForm from './components/AddItemForm';
import SellItemForm from './components/SellItemForm';
import TransactionTable from './components/TransactionTable';
import SalesSummary from './components/SalesSummary';

function App() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gradient-to-b from-blue-100 to-pink-100 py-10">
      <h1 className="text-4xl font-bold text-center text-blue-800 mb-10">Sarada PaintHouse Inventory</h1>
      <InventoryTable />
      <AddItemForm />
      <SellItemForm />
      <TransactionTable />
      
      <SalesSummary />
    </div>
  );
}

export default App;
