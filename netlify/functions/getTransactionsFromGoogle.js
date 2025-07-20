// File: netlify/functions/getTransactionsFromGoogle.js
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

exports.handler = async function () {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.resolve(__dirname, 'credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
    const spreadsheetId = '1Ow9JvAqOeAcJMqD-aKhkwOYGrdDiF-VeoaUcqacF7KM';
    const range = 'Transaction History!A1:I';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) return { statusCode: 200, body: JSON.stringify([]) };

    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const entry = {};
      headers.forEach((header, idx) => {
        entry[header] = row[idx] || '';
      });
      return entry;
    });

    // Sort data from latest to oldest based on Timestamp
    data.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('❌ Error in getTransactionsFromGoogle:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
