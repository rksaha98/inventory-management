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
    const spreadsheetId = '1Ow9JvAqOeAcJMqD-aKhkwOYGrdDiF-VeoaUcqacF7KM';
    const transactionSheet = 'Transaction History';
    const summarySheet = 'Sales Summary';

    // Fetch all transactions
    const txRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${transactionSheet}!A2:G`, // A:ID, B:Type, C:ItemType, D:ItemDesc, E:Qty, F:Price, G:Timestamp
    });
    const txRows = txRes.data.values || [];
    // Parse transactions
    const sales = [];
    const purchases = [];
    for (const row of txRows) {
      const [id, type, itemType, itemDesc, qty, price, timestamp] = row;
      if ((type || '').toLowerCase() === 'add') {
        purchases.push({ id, itemType, itemDesc, qty: Number(qty), price: Number(price), timestamp });
      } else if ((type || '').toLowerCase() === 'sell') {
        sales.push({ id, itemType, itemDesc, qty: Number(qty), price: Number(price), timestamp });
      }
    }
    // Group sales by date, itemType, itemDesc
    const grouped = {};
    for (const sale of sales) {
      let date = '';
      if (sale.timestamp) {
        // Try ISO format first
        let d = new Date(sale.timestamp);
        if (!isNaN(d.getTime())) {
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          date = `${dd}-${mm}-${yyyy}`;
        } else {
          // Try custom format: D/M/YYYY, h:mm:ss am/pm
          const match = sale.timestamp.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),/);
          if (match) {
            const dd = match[1].padStart(2, '0');
            const mm = match[2].padStart(2, '0');
            const yyyy = match[3];
            date = `${dd}-${mm}-${yyyy}`;
          } else {
            // Try splitting by space or T, then by -
            let datePart = sale.timestamp.split('T')[0].split(' ')[0];
            const parts = datePart.split('-');
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                // YYYY-MM-DD
                date = `${parts[2]}-${parts[1]}-${parts[0]}`;
              } else if (parts[2].length === 4) {
                // DD-MM-YYYY
                date = datePart;
              } else {
                date = '';
              }
            } else {
              date = '';
            }
          }
        }
      }
      // If still empty, fallback to empty string
      const key = `${date}|${sale.itemType}|${sale.itemDesc}`;
      if (!grouped[key]) grouped[key] = { date, itemType: sale.itemType, itemDesc: sale.itemDesc, sales: [], totalQty: 0, totalSales: 0 };
      grouped[key].sales.push(sale);
      grouped[key].totalQty += sale.qty;
      grouped[key].totalSales += sale.qty * sale.price;
    }
    // FIFO cost calculation
    const results = [];
    for (const key in grouped) {
      const group = grouped[key];
      let remainingQty = group.totalQty;
      let costTotal = 0;
      let costQty = 0;
      // Match sales to purchases FIFO
      for (const purchase of purchases.filter(p => p.itemType === group.itemType && p.itemDesc === group.itemDesc).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))) {
        if (remainingQty <= 0) break;
        const batchQty = Math.min(remainingQty, purchase.qty);
        costTotal += batchQty * purchase.price;
        costQty += batchQty;
        remainingQty -= batchQty;
      }
      const costPrice = costQty > 0 ? costTotal / costQty : 0;
      const margin = costTotal > 0 ? ((group.totalSales - costTotal) / costTotal) * 100 : 0;
      results.push({
        date: group.date,
        itemType: group.itemType,
        itemDesc: group.itemDesc,
        sellQty: group.totalQty,
        sellTotal: group.totalSales,
        costPrice: Number(costPrice.toFixed(2)),
        costTotal: Number(costTotal.toFixed(2)),
        margin: Number(margin.toFixed(2)),
      });
    }
    // Write results to Sales Summary sheet
  const headers = ['Date', 'Item Type', 'Item Description', 'Sell Quantity', 'Sell Price', 'Sell Total', 'Cost Price', 'Cost Total', 'Margin'];
  const values = [headers].concat(results.map(r => [r.date, r.itemType, r.itemDesc, r.sellQty, r.sellTotal / r.sellQty || 0, r.sellTotal, r.costPrice, r.costTotal, r.margin]));
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${summarySheet}!A1:I`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(results),
    };
  } catch (err) {
    console.error('[salesSummary] Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
