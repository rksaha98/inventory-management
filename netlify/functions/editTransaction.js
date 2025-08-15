const { google } = require('googleapis');
const path = require('path');

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const updated = JSON.parse(event.body);
    const { id } = updated;
    if (!id) {
      return { statusCode: 400, body: 'Missing transaction ID' };
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: path.resolve(__dirname, 'credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
    const spreadsheetId = '1Ow9JvAqOeAcJMqD-aKhkwOYGrdDiF-VeoaUcqacF7KM';

    // Fetch all columns for the transaction row
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Transaction History!A2:I', // A:ID, B:Type, C:ItemType, D:ItemDesc, E:Qty, F:Price, G:Timestamp, H:Mode, I:Note
    });

    const rows = res.data.values;
    const rowIndex = rows.findIndex(row => row[0] === id);
    if (rowIndex === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Transaction ID not found' }) };
    }

    const rowNumber = rowIndex + 2; // +2 because A2 is first data row
    const originalRow = rows[rowIndex];
    const originalType = (originalRow[1] || '').trim().toLowerCase();
    const originalItemType = (originalRow[2] || '').trim();
    const originalItemDesc = (originalRow[3] || '').trim();
    const originalQty = Number(originalRow[4]) || 0;
    const originalPrice = Number(originalRow[5]) || 0;

    // Ensure all fields are present and in correct order
    const updatedRow = [
      updated.id || '',
      updated.transactionType || '',
      updated.itemType || '',
      updated.itemDescription || '',
      updated.quantity || '',
      updated.price || '',
      updated.timestamp || '',
      updated.mode || '',
      updated.note || ''
    ];

    // 1. Edit transaction log
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Transaction History!A${rowNumber}:I${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow]
      }
    });

    // 2. Update inventory summary for affected item (atomic undo + apply)
    const summarySheet = 'Inventory Summary';
    const summaryRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${summarySheet}!A2:I`,
    });
    const summaryRows = summaryRes.data.values || [];

    // Undo original transaction effect
    let foundIdx = -1;
    for (let i = 0; i < summaryRows.length; i++) {
      if ((summaryRows[i][0] || '').trim().toLowerCase() === originalItemType.toLowerCase() &&
          (summaryRows[i][1] || '').trim().toLowerCase() === originalItemDesc.toLowerCase()) {
        foundIdx = i;
        break;
      }
    }
    let row = foundIdx >= 0 ? summaryRows[foundIdx] : [originalItemType, originalItemDesc, 0, 0, 0, 0, 0, 0, 0];
    let inStock = Number(row[2]) || 0;
    let purchased = Number(row[3]) || 0;
    let avgPurchase = Number(row[4]) || 0;
    let purchaseValue = Number(row[5]) || 0;
    let sold = Number(row[6]) || 0;
    let avgSale = Number(row[7]) || 0;
    let salesValue = Number(row[8]) || 0;

    if (originalType === 'add') {
      // Undo purchase
      inStock -= originalQty;
      purchased -= originalQty;
      purchaseValue -= originalQty * originalPrice;
      avgPurchase = purchased > 0 ? ((avgPurchase * (purchased + originalQty) - originalPrice * originalQty) / purchased) : 0;
    } else if (originalType === 'sell') {
      // Undo sale
      inStock += originalQty;
      sold -= originalQty;
      salesValue -= originalQty * originalPrice;
      avgSale = sold > 0 ? ((avgSale * (sold + originalQty) - originalPrice * originalQty) / sold) : 0;
    }

    // Apply new transaction
    const newType = (updated.transactionType || '').trim().toLowerCase();
    const newItemType = (updated.itemType || '').trim();
    const newItemDesc = (updated.itemDescription || '').trim();
    const newQty = Number(updated.quantity) || 0;
    const newPrice = Number(updated.price) || 0;

    // If item type/desc changed, update old row and new row
    if (originalItemType !== newItemType || originalItemDesc !== newItemDesc) {
      // Update old row (undo only)
      const undoValues = [
        originalItemType,
        originalItemDesc,
        Number(inStock.toFixed(2)),
        Number(purchased.toFixed(2)),
        Number(avgPurchase.toFixed(2)),
        Number(purchaseValue.toFixed(2)),
        Number(sold.toFixed(2)),
        Number(avgSale.toFixed(2)),
        Number(salesValue.toFixed(2)),
      ];
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${summarySheet}!A${foundIdx + 2}:I${foundIdx + 2}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [undoValues] },
      });
      // Now update/apply to new row
      let newIdx = -1;
      for (let i = 0; i < summaryRows.length; i++) {
        if ((summaryRows[i][0] || '').trim().toLowerCase() === newItemType.toLowerCase() &&
            (summaryRows[i][1] || '').trim().toLowerCase() === newItemDesc.toLowerCase()) {
          newIdx = i;
          break;
        }
      }
      let newRow = newIdx >= 0 ? summaryRows[newIdx] : [newItemType, newItemDesc, 0, 0, 0, 0, 0, 0, 0];
      let newInStock = Number(newRow[2]) || 0;
      let newPurchased = Number(newRow[3]) || 0;
      let newAvgPurchase = Number(newRow[4]) || 0;
      let newPurchaseValue = Number(newRow[5]) || 0;
      let newSold = Number(newRow[6]) || 0;
      let newAvgSale = Number(newRow[7]) || 0;
      let newSalesValue = Number(newRow[8]) || 0;
      if (newType === 'add') {
        newInStock += newQty;
        newPurchased += newQty;
        newPurchaseValue += newQty * newPrice;
        newAvgPurchase = newPurchased > 0 ? ((newAvgPurchase * (newPurchased - newQty) + newPrice * newQty) / newPurchased) : 0;
      } else if (newType === 'sell') {
        newInStock -= newQty;
        newSold += newQty;
        newSalesValue += newQty * newPrice;
        newAvgSale = newSold > 0 ? ((newAvgSale * (newSold - newQty) + newPrice * newQty) / newSold) : 0;
      }
      const applyValues = [
        newItemType,
        newItemDesc,
        Number(newInStock.toFixed(2)),
        Number(newPurchased.toFixed(2)),
        Number(newAvgPurchase.toFixed(2)),
        Number(newPurchaseValue.toFixed(2)),
        Number(newSold.toFixed(2)),
        Number(newAvgSale.toFixed(2)),
        Number(newSalesValue.toFixed(2)),
      ];
      if (newIdx >= 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${summarySheet}!A${newIdx + 2}:I${newIdx + 2}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [applyValues] },
        });
      } else {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${summarySheet}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [applyValues] },
        });
      }
    } else {
      // Update same row (undo + apply)
      if (newType === 'add') {
        inStock += newQty;
        purchased += newQty;
        purchaseValue += newQty * newPrice;
        avgPurchase = purchased > 0 ? ((avgPurchase * (purchased - newQty) + newPrice * newQty) / purchased) : 0;
      } else if (newType === 'sell') {
        inStock -= newQty;
        sold += newQty;
        salesValue += newQty * newPrice;
        avgSale = sold > 0 ? ((avgSale * (sold - newQty) + newPrice * newQty) / sold) : 0;
      }
      const updateValues = [
        newItemType,
        newItemDesc,
        Number(inStock.toFixed(2)),
        Number(purchased.toFixed(2)),
        Number(avgPurchase.toFixed(2)),
        Number(purchaseValue.toFixed(2)),
        Number(sold.toFixed(2)),
        Number(avgSale.toFixed(2)),
        Number(salesValue.toFixed(2)),
      ];
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${summarySheet}!A${foundIdx + 2}:I${foundIdx + 2}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updateValues] },
      });
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('❌ Error editing transaction:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
