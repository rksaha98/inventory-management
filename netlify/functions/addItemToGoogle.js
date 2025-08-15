const { google } = require('googleapis');
const credentials = require('./credentials.json');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1Ow9JvAqOeAcJMqD-aKhkwOYGrdDiF-VeoaUcqacF7KM'; // ✅ your spreadsheet ID
    const sheetName = 'Transaction History';

    const newRow = [
      Date.now(),                 // ID
      'Add',                     // Transaction Type
      body.itemType,             // Item Type
      body.itemDescription,      // Item Description
      body.quantity,
      body.price,
      new Date().toLocaleString(),
      body.mode || '',
      body.note || ''
    ];

    // 1. Append transaction row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });

    // 2. Update Inventory Summary for this item (incremental, not full scan)
    const summarySheet = 'Inventory Summary';
    // Fetch all summary rows
    const summaryRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${summarySheet}!A2:I`,
    });
    const summaryRows = summaryRes.data.values || [];
    const itemType = body.itemType.trim();
    const itemDesc = body.itemDescription.trim();
    const qty = Number(body.quantity);
    const price = Number(body.price);
    let foundIdx = -1;
    for (let i = 0; i < summaryRows.length; i++) {
      if ((summaryRows[i][0] || '').trim().toLowerCase() === itemType.toLowerCase() &&
          (summaryRows[i][1] || '').trim().toLowerCase() === itemDesc.toLowerCase()) {
        foundIdx = i;
        break;
      }
    }
    let updateValues;
    if (foundIdx >= 0) {
      // Update only purchase columns incrementally
      const row = summaryRows[foundIdx];
      const prevInStock = Number(row[2]) || 0;
      const prevPurchased = Number(row[3]) || 0;
      const prevAvgPurchase = Number(row[4]) || 0;
      const prevPurchaseValue = Number(row[5]) || 0;
      // New calculations
      const newInStock = prevInStock + qty;
      const newPurchased = prevPurchased + qty;
      const newPurchaseValue = prevPurchaseValue + qty * price;
      // Weighted average calculation
      const newAvgPurchase = newPurchased ? ((prevAvgPurchase * prevPurchased + price * qty) / newPurchased) : 0;
      updateValues = [
        itemType,
        itemDesc,
        Number(newInStock.toFixed(2)),
        Number(newPurchased.toFixed(2)),
        Number(newAvgPurchase.toFixed(2)),
        Number(newPurchaseValue.toFixed(2)),
        row[6] || 0, // Total Sold (unchanged)
        row[7] || 0, // Avg Sale Price (unchanged)
        row[8] || 0, // Total Sales Value (unchanged)
      ];
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${summarySheet}!A${foundIdx + 2}:I${foundIdx + 2}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updateValues] },
      });
    } else {
      // Add new row
      updateValues = [
        itemType,
        itemDesc,
        Number(qty.toFixed(2)),
        Number(qty.toFixed(2)),
        Number(price.toFixed(2)),
        Number((qty * price).toFixed(2)),
        0, // Total Sold
        0, // Avg Sale Price
        0, // Total Sales Value
      ];
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${summarySheet}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updateValues] },
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Add item logged successfully and inventory updated' }),
    };
  } catch (error) {
    console.error('❌ Error in addItemToGoogle:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
