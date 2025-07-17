// utils/api.js

const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbwkIV3FDxVSSRoWTJ7zIi1Y8MAj2KyNI4Me4AZjfE_Mux7VQYG324f7qlpksPqYXCf10A/exec";

export async function fetchSheetData(sheet) {
  const res = await fetch(`${SHEET_URL}?action=list&sheet=${sheet}`);
  if (!res.ok) throw new Error("Failed to fetch sheet data");
  return res.json();
}

export async function addTransaction(data) {
  const res = await fetch(`${SHEET_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "add",
      sheet: "transactions",
      row: data,
    }),
  });
  if (!res.ok) throw new Error("Failed to add transaction");
  return res.json();
}

export async function fetchCreditLedger() {
  return fetchSheetData("credit");
}

export async function fetchSalesSummary() {
  return fetchSheetData("sales");
}
