const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlvP8j5dZDbEghxDiom6ByE62ccsp7NNCAa4HrPw58dp4_8A3WKZHqOFFIVMDNoeITTh8CPJbTUvDH/pub?gid=1247934290&single=true&output=csv";

function parseCSV(text) {
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

  if (!rows.length) return { headers: [], items: [] };

  const headers = rows[0].map(h => h.trim());
  const items = rows.slice(1).map(cols => {
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = (cols[idx] || "").trim()));
    return obj;
  });

  return { headers, items };
}

function escapeHTML(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isHttpUrl(v) {
  return /^https?:\/\//i.test(String(v || "").trim());
}

function renderPlaces(headers, items, targetId) {
  const wrap = document.getElementById(targetId);
  if (!wrap) return;

  if (!items.length) {
    wrap.innerHTML = `<div class="card col-12"><h2>No places yet</h2></div>`;
    return;
  }

  wrap.innerHTML = items
    .map(row => {
      const title = row[headers[0]] || "Place";

      const lines = headers
        .slice(1)
        .map(h => {
          const v = row[h];
          if (!v) return "";

          // If it looks like a URL, render a clickable link
          if (isHttpUrl(v)) {
            const url = v.trim();
            return `<div><span style="opacity:.7">${escapeHTML(h)}:</span> <a href="${escapeHTML(
              url
            )}" target="_blank" rel="noopener">Open link</a></div>`;
          }

          return `<div><span style="opacity:.7">${escapeHTML(h)}:</span> ${escapeHTML(v)}</div>`;
        })
        .filter(Boolean)
        .join("");

      return `
        <div class="card col-12">
          <h2>${escapeHTML(title)}</h2>
          ${lines}
        </div>
      `;
    })
    .join("");
}

fetch(CSV_URL)
  .then(res => res.text())
  .then(csv => {
    const { headers, items } = parseCSV(csv);
    renderPlaces(headers, items, "places-list");
  })
  .catch(err => {
    console.error("Places CSV error:", err);
    const p = document.getElementById("places-error");
    if (p) {
      p.style.display = "block";
      p.textContent = "Could not load places list.";
    }
  });
