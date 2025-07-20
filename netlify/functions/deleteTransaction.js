// File: netlify/functions/deleteTransaction.js
const { google } = require('googleapis');
const fs = require('fs');
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
    const range = 'Transaction History!A2:A';

    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = res.data.values;

    const rowIndex = rows.findIndex(r => r[0] === id);
    if (rowIndex === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Transaction ID not found' }) };
    }

    const deleteRange = `Transaction History!A${rowIndex + 2}:I${rowIndex + 2}`;
    const emptyRow = new Array(9).fill('');

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: deleteRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [emptyRow] }
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('❌ Error deleting transaction:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
