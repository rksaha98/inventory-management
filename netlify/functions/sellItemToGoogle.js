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
      'Sell',                    // Transaction Type
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
      // Update only sales columns incrementally
      const row = summaryRows[foundIdx];
      const prevInStock = Number(row[2]) || 0;
      const prevSold = Number(row[6]) || 0;
      const prevAvgSale = Number(row[7]) || 0;
      const prevSalesValue = Number(row[8]) || 0;
      // New calculations
      const newInStock = prevInStock - qty;
      const newSold = prevSold + qty;
      const newSalesValue = prevSalesValue + qty * price;
      // Weighted average calculation
      const newAvgSale = newSold ? ((prevAvgSale * prevSold + price * qty) / newSold) : 0;
      updateValues = [
        itemType,
        itemDesc,
        Number(newInStock.toFixed(2)),
        row[3] || 0, // Total Purchased (unchanged)
        row[4] || 0, // Avg Purchase Price (unchanged)
        row[5] || 0, // Total Purchase Value (unchanged)
        Number(newSold.toFixed(2)),
        Number(newAvgSale.toFixed(2)),
        Number(newSalesValue.toFixed(2)),
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
        Number((-qty).toFixed(2)),
        0, // Total Purchased
        0, // Avg Purchase Price
        0, // Total Purchase Value
        Number(qty.toFixed(2)),
        Number(price.toFixed(2)),
        Number((qty * price).toFixed(2)),
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
      body: JSON.stringify({ message: 'Sell item logged successfully and inventory updated' }),
    };
  } catch (error) {
    console.error('❌ Error in sellItemToGoogle:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
