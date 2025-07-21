const { google } = require('googleapis');
const credentials = require('./credentials.json');

exports.handler = async function(event) {
  try {
    // Authenticate
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1Ow9JvAqOeAcJMqD-aKhkwOYGrdDiF-VeoaUcqacF7KM'; // <-- Replace with your actual spreadsheet ID
    const txSheet = 'Transaction History';
    const summarySheet = 'Inventory Summary';

    // Fetch all transaction rows
    console.log('[getInventorySummary] Fetching transaction rows...');
    const txRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${txSheet}!A2:I`,
    });
    const txRows = txRes.data.values || [];
    console.log(`[getInventorySummary] Transaction rows fetched: ${txRows.length}`);

    // Group by Item Type + Item Description (case-insensitive)
    const groups = {};
    for (const row of txRows) {
      if (row.length < 6) {
        console.warn('[getInventorySummary] Skipping malformed row:', row);
        continue;
      }
      const [id, txType, itemType, itemDesc, qty, price] = row;
      if (!itemType || !itemDesc || !txType || !qty || !price) continue;
      const key = `${(itemType || '').trim().toLowerCase()}|||${(itemDesc || '').trim().toLowerCase()}`;
      if (!groups[key]) {
        groups[key] = {
          itemType: itemType.trim(),
          itemDescription: itemDesc.trim(),
          addQty: 0,
          addValue: 0,
          addWeighted: 0,
          sellQty: 0,
          sellValue: 0,
          sellWeighted: 0,
        };
      }
      const q = Number(qty);
      const p = Number(price);
      if (txType.toLowerCase() === 'add') {
        groups[key].addQty += q;
        groups[key].addValue += q * p;
        groups[key].addWeighted += q * p;
      } else if (txType.toLowerCase() === 'sell') {
        groups[key].sellQty += q;
        groups[key].sellValue += q * p;
        groups[key].sellWeighted += q * p;
      }
    }

    // Prepare summary array
    const summaryArr = Object.values(groups).map(g => {
      const avgPurchasePrice = g.addQty ? g.addWeighted / g.addQty : 0;
      const avgSalePrice = g.sellQty ? g.sellWeighted / g.sellQty : 0;
      return {
        'Item Type': g.itemType,
        'Item Description': g.itemDescription,
        'In Stock': Number((g.addQty - g.sellQty).toFixed(2)),
        'Total Purchased': Number(g.addQty.toFixed(2)),
        'Avg Purchase Price': Number(avgPurchasePrice.toFixed(2)),
        'Total Purchase Value': Number(g.addValue.toFixed(2)),
        'Total Sold': Number(g.sellQty.toFixed(2)),
        'Avg Sale Price': Number(avgSalePrice.toFixed(2)),
        'Total Sales Value': Number(g.sellValue.toFixed(2)),
      };
    });

    // Sort by Item Type then Item Description
    summaryArr.sort((a, b) => {
      const t = a['Item Type'].localeCompare(b['Item Type']);
      if (t !== 0) return t;
      return a['Item Description'].localeCompare(b['Item Description']);
    });

    // Fetch current summary sheet rows
    const summaryRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${summarySheet}!A2:I`,
    });
    const summaryRows = summaryRes.data.values || [];

    // Map for row matching
    const summaryMap = {};
    summaryRows.forEach((row, idx) => {
      if (row.length < 2) return;
      const key = `${(row[0] || '').trim().toLowerCase()}|||${(row[1] || '').trim().toLowerCase()}`;
      summaryMap[key] = idx + 2; // Row number in sheet
    });

    // Update or append rows
    for (const item of summaryArr) {
      const key = `${item['Item Type'].trim().toLowerCase()}|||${item['Item Description'].trim().toLowerCase()}`;
      const values = [
        item['Item Type'],
        item['Item Description'],
        item['In Stock'],
        item['Total Purchased'],
        item['Avg Purchase Price'],
        item['Total Purchase Value'],
        item['Total Sold'],
        item['Avg Sale Price'],
        item['Total Sales Value'],
      ];
      if (summaryMap[key]) {
        // Update existing row
        console.log(`[getInventorySummary] Updating row for ${item['Item Type']} | ${item['Item Description']} at row ${summaryMap[key]}`);
        try {
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${summarySheet}!A${summaryMap[key]}:I${summaryMap[key]}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [values] },
          });
        } catch (err) {
          console.error(`[getInventorySummary] Error updating row:`, err.message);
        }
      } else {
        // Append new row
        console.log(`[getInventorySummary] Appending new row for ${item['Item Type']} | ${item['Item Description']}`);
        try {
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${summarySheet}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [values] },
          });
        } catch (err) {
          console.error(`[getInventorySummary] Error appending row:`, err.message);
        }
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(summaryArr),
    };
  } catch (err) {
    console.error('[getInventorySummary] Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
