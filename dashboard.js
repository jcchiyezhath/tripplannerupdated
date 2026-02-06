const DASHBOARD_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlvP8j5dZDbEghxDiom6ByE62ccsp7NNCAa4HrPw58dp4_8A3WKZHqOFFIVMDNoeITTh8CPJbTUvDH/pub?gid=0&single=true&output=csv";

function clean(v) {
  if (!v) return "";
  v = v.trim();
  // remove wrapping quotes if present
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  // unescape double quotes
  v = v.replace(/""/g, '"');
  return v.trim();
}

// Parses a 2-column CSV: Key,Value
// Works even if Value contains commas (because we split only on the first comma)
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const data = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const idx = line.indexOf(",");
    if (idx === -1) continue;

    const key = clean(line.slice(0, idx));
    const value = clean(line.slice(idx + 1));

    if (key) data[key] = value;
  }

  return data;
}

fetch(DASHBOARD_CSV_URL, { cache: "no-store" })
  .then((res) => res.text())
  .then((csv) => {
    const data = parseCSV(csv);

    document.getElementById("trip-overview").innerHTML = `
      <div><strong>${data.trip_name || ""}</strong></div>
      <div>${data.start_date || ""} → ${data.end_date || ""}</div>
      <div>Destination: ${data.destination || ""}</div>
      <div>People confirmed: ${data.confirmed_people || ""}</div>
    `;

    const maps = data.maps_link || "#";
    document.getElementById("stay-location").innerHTML = `
      <div>${data.primary_stay || ""}</div>
      <div>${data.primary_address || ""}</div>
      <div><a href="${maps}" target="_blank" rel="noopener">Open in Google Maps</a></div>
    `;

    document.getElementById("cost-summary").innerHTML = `
      <div>Total: $${data.estimated_total_cost || ""}</div>
      <div>Per person: $${data.per_person_cost || ""}</div>
    `;
  })
  .catch((err) => {
    console.error("Dashboard CSV error:", err);
    const el = document.getElementById("trip-overview");
    if (el) el.innerHTML = "Could not load dashboard data.";
  });
