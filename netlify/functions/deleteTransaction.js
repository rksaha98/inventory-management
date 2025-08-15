// File: netlify/functions/deleteTransaction.js
const { google } = require('googleapis');
const path = require('path');

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { id } = JSON.parse(event.body);
    if (!id) {
      return { statusCode: 400, body: 'Missing transaction ID' };
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: path.resolve(__dirname, 'credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
    const spreadsheetId = '1Ow9JvAqOeAcJMqD-aKhkwOYGrdDiF-VeoaUcqacF7KM';

    // Get all transaction rows to find the row index and details
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Transaction History!A2:G', // A:ID, B:Type, C:ItemType, D:ItemDesc, E:Qty, F:Price, G:Mode
    });

    const rows = res.data.values;
    const rowIndex = rows.findIndex(row => row[0] === id);
    if (rowIndex === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Transaction ID not found' }) };
    }

    // Get sheetId dynamically for robustness
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = meta.data.sheets.find(s => s.properties.title === 'Transaction History');
    const sheetId = sheet ? sheet.properties.sheetId : 0;

    // 1. Delete transaction log row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex + 1, // +1 for header row
              endIndex: rowIndex + 2
            }
          }
        }]
      }
    });

    // 2. Update inventory summary for affected item (incremental, not full scan)
    const summarySheet = 'Inventory Summary';
    // Fetch all summary rows
    const summaryRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${summarySheet}!A2:I`,
    });
    const summaryRows = summaryRes.data.values || [];
    // Find deleted transaction's itemType and itemDescription
    let deletedRow = null;
    for (const row of rows) {
      if (row[0] === id) {
        deletedRow = row;
        break;
      }
    }
    const itemType = deletedRow ? deletedRow[2].trim() : '';
    const itemDesc = deletedRow ? deletedRow[3].trim() : '';
    let foundIdx = -1;
    for (let i = 0; i < summaryRows.length; i++) {
      if ((summaryRows[i][0] || '').trim().toLowerCase() === itemType.toLowerCase() &&
          (summaryRows[i][1] || '').trim().toLowerCase() === itemDesc.toLowerCase()) {
        foundIdx = i;
        break;
      }
    }
    let updateValues;
    if (deletedRow && deletedRow[1].toLowerCase() === 'add') {
      // Remove purchase columns incrementally
      const row = foundIdx >= 0 ? summaryRows[foundIdx] : [itemType, itemDesc, 0, 0, 0, 0, 0, 0, 0];
      const prevInStock = Number(row[2]) || 0;
      const prevPurchased = Number(row[3]) || 0;
      const prevAvgPurchase = Number(row[4]) || 0;
      const prevPurchaseValue = Number(row[5]) || 0;
      const qty = Number(deletedRow[4]) || 0;
      const price = Number(deletedRow[5]) || 0;
      // New calculations
      const newInStock = prevInStock - qty;
      const newPurchased = prevPurchased - qty;
      const newPurchaseValue = prevPurchaseValue - qty * price;
      const newAvgPurchase = newPurchased > 0 ? ((prevAvgPurchase * prevPurchased - price * qty) / newPurchased) : 0;
      updateValues = [
        itemType,
        itemDesc,
        Number(newInStock.toFixed(2)),
        Number(newPurchased.toFixed(2)),
        Number(newAvgPurchase.toFixed(2)),
        Number(newPurchaseValue.toFixed(2)),
        row[6] || 0,
        row[7] || 0,
        row[8] || 0,
      ];
    } else if (deletedRow && deletedRow[1].toLowerCase() === 'sell') {
      // Remove sales columns incrementally
      const row = foundIdx >= 0 ? summaryRows[foundIdx] : [itemType, itemDesc, 0, 0, 0, 0, 0, 0, 0];
      const prevInStock = Number(row[2]) || 0;
      const prevSold = Number(row[6]) || 0;
      const prevAvgSale = Number(row[7]) || 0;
      const prevSalesValue = Number(row[8]) || 0;
      const qty = Number(deletedRow[4]) || 0;
      const price = Number(deletedRow[5]) || 0;
      // New calculations
      const newInStock = prevInStock + qty;
      const newSold = prevSold - qty;
      const newSalesValue = prevSalesValue - qty * price;
      const newAvgSale = newSold > 0 ? ((prevAvgSale * prevSold - price * qty) / newSold) : 0;
      updateValues = [
        itemType,
        itemDesc,
        Number(newInStock.toFixed(2)),
        row[3] || 0,
        row[4] || 0,
        row[5] || 0,
        Number(newSold.toFixed(2)),
        Number(newAvgSale.toFixed(2)),
        Number(newSalesValue.toFixed(2)),
      ];
    }
    if (foundIdx >= 0 && updateValues) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${summarySheet}!A${foundIdx + 2}:I${foundIdx + 2}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updateValues] },
      });
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('❌ Error deleting transaction:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
