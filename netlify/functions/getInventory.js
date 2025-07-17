export async function handler(event, context) {
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycby4uqRjezllKgWUE6RoDCVWiosedhF4U0dL8l5CUh4kNoc2Ltox6p99HWU6vHfoaPTP7w/exec');

    const html = await response.text();
    console.log("🧾 Full response preview:\n", html.slice(0, 500)); // log first 500 characters

    const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const jsonText = match ? match[1] : '[]';

    const json = JSON.parse(jsonText); // fails here if it wasn't real JSON

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json),
    };
  } catch (err) {
    console.error("❌ Error in getInventory:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
