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

    // Get all rows to find the row index of the transaction
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Transaction History!A2:A',
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

    // Use batchUpdate to delete the entire row
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

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('❌ Error deleting transaction:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
