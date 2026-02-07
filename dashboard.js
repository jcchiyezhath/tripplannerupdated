const DASHBOARD_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlvP8j5dZDbEghxDiom6ByE62ccsp7NNCAa4HrPw58dp4_8A3WKZHqOFFIVMDNoeITTh8CPJbTUvDH/pub?gid=0&single=true&output=csv";
const UPDATES_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlvP8j5dZDbEghxDiom6ByE62ccsp7NNCAa4HrPw58dp4_8A3WKZHqOFFIVMDNoeITTh8CPJbTUvDH/pub?gid=626134898&single=true&output=csv";

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

// --- Updates (table CSV: Date,Title,Message,Link) ---

function parseTableCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (c === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((c === "\n" || c === "\r") && !inQuotes) {
      if (c === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some(v => v.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += c;
  }

  row.push(cell);
  if (row.some(v => v.trim() !== "")) rows.push(row);

  if (!rows.length) return [];

  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(cols => {
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = (cols[idx] || "").trim()));
    return obj;
  });
}

function renderLatestUpdates(items) {
  const wrap = document.getElementById("latest-updates");
  if (!wrap) return;

  if (!items || !items.length) {
    wrap.textContent = "No updates yet.";
    return;
  }

  const sorted = [...items].sort((a, b) =>
    String(b.Date || "").localeCompare(String(a.Date || ""))
  );

  wrap.innerHTML = sorted.slice(0, 5).map(u => {
    const date = u.Date || "";
    const title = u.Title || "";
    const msg = u.Message || "";
    const link = String(u.Link || "").trim();

    const linkHtml =
      link && /^https?:\/\//i.test(link)
        ? `<div style="margin-top:6px;"><a href="${link}" target="_blank" rel="noopener">Open link</a></div>`
        : "";

    return `
      <div style="padding:10px 0;border-bottom:1px solid rgba(0,0,0,.08);">
        <div style="font-weight:600;">${title}</div>
        <div style="font-size:13px;opacity:.7;">${date}</div>
        <div style="margin-top:6px;">${msg}</div>
        ${linkHtml}
      </div>
    `;
  }).join("");
}

fetch(UPDATES_CSV_URL, { cache: "no-store" })
  .then(res => res.text())
  .then(csv => {
    const items = parseTableCSV(csv);
    renderLatestUpdates(items);
  })
  .catch(err => {
    console.error("Updates error:", err);

    const wrap = document.getElementById("latest-updates");
    if (wrap) wrap.textContent = "Could not load updates.";

    const p = document.getElementById("updates-error");
    if (p) {
      p.style.display = "block";
      p.textContent = "Could not load updates. Check the publish link.";
    }
  });

