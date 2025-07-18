const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

exports.handler = async function (event, context) {
  try {
    const keyPath = path.resolve(__dirname, 'credentials.json');
    console.log("📁 Loading credentials from:", keyPath);

    const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = '1Ow9JvAqOeAcJMqD-aKhkwOYGrdDiF-VeoaUcqacF7KM'; // ✅ Replace with your actual ID
    const range = 'Inventory Summary!A1:I';

    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });

    const [headers, ...rows] = response.data.values;
    const formatted = rows.map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formatted),
    };

  } catch (err) {
    console.error('❌ Error in getInventoryFromGoogle:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
