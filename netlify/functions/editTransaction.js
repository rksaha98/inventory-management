const { google } = require('googleapis');
const path = require('path');

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const updated = JSON.parse(event.body);
    const { id } = updated;
    if (!id) {
      return { statusCode: 400, body: 'Missing transaction ID' };
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: path.resolve(__dirname, 'credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
    const spreadsheetId = '1Ow9JvAqOeAcJMqD-aKhkwOYGrdDiF-VeoaUcqacF7KM';

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Transaction History!A2:A',
    });

    const rows = res.data.values;
    const rowIndex = rows.findIndex(row => row[0] === id);
    if (rowIndex === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Transaction ID not found' }) };
    }

    const rowNumber = rowIndex + 2; // +2 because A2 is first data row

    // Ensure all fields are present and in correct order
    const updatedRow = [
      updated.id || '',
      updated.transactionType || '',
      updated.itemType || '',
      updated.itemDescription || '',
      updated.quantity || '',
      updated.price || '',
      updated.timestamp || '',
      updated.mode || '',
      updated.note || ''
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Transaction History!A${rowNumber}:I${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updatedRow]
      }
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('❌ Error editing transaction:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
