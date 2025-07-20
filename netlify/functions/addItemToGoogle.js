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
      'Add',                     // Transaction Type
      body.itemType,             // Item Type
      body.itemDescription,      // Item Description
      body.quantity,
      body.price,
      new Date().toLocaleString(),
      body.mode || '',
      body.note || ''
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Add item logged successfully' }),
    };
  } catch (error) {
    console.error('❌ Error in addItemToGoogle:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
