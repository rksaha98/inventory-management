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
    const spreadsheetId = '1Ow9JvAqOeAcJMqD-aKhkwOYGrdDiF-VeoaUcqacF7KM'; // <-- Corrected spreadsheet ID
    const txSheet = 'Transaction History';
    const summarySheet = 'Sales Summary';

    // Fetch all transaction rows
    console.log('[getSalesSummary] Fetching transaction rows...');
    const txRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${txSheet}!A2:I`,
    });
    const txRows = txRes.data.values || [];
    console.log(`[getSalesSummary] Transaction rows fetched: ${txRows.length}`);

    // Filter only 'Sell' transactions
    const salesRows = txRows.filter(row => (row[1] || '').toLowerCase() === 'sell');
    console.log(`[getSalesSummary] Sell rows found: ${salesRows.length}`);

    // Group by Date, Item Type, Item Description (case-insensitive)
    const groups = {};
    for (const row of salesRows) {
      if (row.length < 7) {
        console.warn('[getSalesSummary] Skipping malformed row:', row);
        continue;
      }
      const [id, txType, itemType, itemDesc, qty, price, timestamp] = row;
      if (!itemType || !itemDesc || !qty || !price || !timestamp) {
        console.warn('[getSalesSummary] Skipping row with missing fields:', row);
        continue;
      }
      // Extract date part in DD-MM-YYYY from '21/7/2025, 12:57:53 am' format
      let date = '';
      try {
        // Split by comma, take first part
        const datePart = (timestamp || '').split(',')[0].trim();
        // Split by '/' and pad day/month
        const [d, m, y] = datePart.split('/');
        date = `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
      } catch (err) {
        console.warn('[getSalesSummary] Invalid timestamp format:', timestamp);
        date = '';
      }
      const key = `${date}|||${(itemType || '').trim().toLowerCase()}|||${(itemDesc || '').trim().toLowerCase()}`;
      if (!groups[key]) {
        groups[key] = {
          date,
          itemType: itemType.trim(),
          itemDescription: itemDesc.trim(),
          totalQty: 0,
          totalValue: 0,
          prices: [],
        };
      }
      const q = Number(qty);
      const p = Number(price);
      groups[key].totalQty += q;
      groups[key].totalValue += q * p;
      groups[key].prices.push(p);
    }
    console.log(`[getSalesSummary] Groups formed: ${Object.keys(groups).length}`);

    // Prepare summary array
    const summaryArr = Object.values(groups).map(g => {
      const avgPrice = g.prices.length ? (g.prices.reduce((a, b) => a + b, 0) / g.prices.length) : 0;
      return [
        g.date,
        g.itemType,
        g.itemDescription,
        Number(g.totalQty.toFixed(2)),
        Number(avgPrice.toFixed(2)),
        Number(g.totalValue.toFixed(2)),
      ];
    });

    // Sort by Date, Item Type, Item Description
    summaryArr.sort((a, b) => {
      const d = a[0].localeCompare(b[0]);
      if (d !== 0) return d;
      const t = a[1].localeCompare(b[1]);
      if (t !== 0) return t;
      return a[2].localeCompare(b[2]);
    });

    // Clear existing Sales Summary sheet
    console.log('[getSalesSummary] Clearing Sales Summary sheet...');
    try {
      const clearRes = await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${summarySheet}!A2:F`,
      });
      console.log('[getSalesSummary] Clear response:', clearRes.status, clearRes.statusText || '');
    } catch (err) {
      console.error('[getSalesSummary] Error clearing Sales Summary sheet:', err);
    }

    // Write new summary rows
    if (summaryArr.length > 0) {
      console.log(`[getSalesSummary] Writing ${summaryArr.length} summary rows to Sales Summary sheet...`);
      try {
        const updateRes = await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${summarySheet}!A2`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: summaryArr },
        });
        console.log('[getSalesSummary] Update response:', updateRes.status, updateRes.statusText || '', updateRes.data);
      } catch (err) {
        console.error('[getSalesSummary] Error updating Sales Summary sheet:', err);
      }
    } else {
      console.log('[getSalesSummary] No summary rows to write.');
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: true, rows: summaryArr }),
    };
  } catch (err) {
    console.error('[getSalesSummary] Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
