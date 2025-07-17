import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export async function handler(event, context) {
  try {
    // Load credentials from the JSON key
    const keyPath = path.resolve('netlify/functions/credentials.json');
    const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = '1Ow9JvAqOeAcJMqD-aKhkwOYGrdDiF-VeoaUcqacF7KM'; // <-- replace with your actual Sheet ID
    const range = 'Inventory Summary!A1:I';       // Adjust range based on your sheet layout

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

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
    console.error('❌ Google Sheets fetch error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
