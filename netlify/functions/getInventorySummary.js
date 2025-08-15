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
    const summarySheet = 'Inventory Summary';

    // Fetch summary sheet rows including Markup (J) and Margin (K)
    const summaryRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${summarySheet}!A2:K`, // A-K includes Markup (J) and Margin (K)
    });
    const rows = summaryRes.data.values || [];
    const headers = ['Item Type', 'Item Description', 'In Stock', 'Total Purchased', 'Avg Purchase Price', 'Total Purchase Value', 'Total Sold', 'Avg Sale Price', 'Total Sales Value', 'Markup', 'Margin'];
    const data = rows.map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      return obj;
    });
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error('[getInventorySummary] Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
