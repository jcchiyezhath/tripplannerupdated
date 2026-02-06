const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlvP8j5dZDbEghxDiom6ByE62ccsp7NNCAa4HrPw58dp4_8A3WKZHqOFFIVMDNoeITTh8CPJbTUvDH/pub?gid=32708188&single=true&output=csv";

// Better CSV parser (handles commas inside quotes)
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

function isDayHeader(text) {
  return /^day\s*\d+\s*:/i.test(String(text || "").trim());
}

// order for time blocks
const TIME_ORDER = ["Early Morning", "Morning", "Late Morning", "Afternoon", "Evening", "Night"];

function timeRank(t) {
  const val = String(t || "").trim().toLowerCase();
  const idx = TIME_ORDER.findIndex(x => x.toLowerCase() === val);
  return idx === -1 ? 999 : idx;
}

function renderItineraryGrouped(headers, items, targetId) {
  const wrap = document.getElementById(targetId);
  if (!wrap) return;

  if (!items.length) {
    wrap.innerHTML = `<div class="card col-12"><h2>No data yet</h2><p>Add rows in the sheet.</p></div>`;
    return;
  }

  // Expect headers: Date, Activity, Details, Notes (based on your sheet)
  const hDate = headers.find(h => h.toLowerCase() === "date") || headers[0];
  const hActivity = headers.find(h => h.toLowerCase() === "activity") || headers[1];
  const hDetails = headers.find(h => h.toLowerCase() === "details") || headers[2];
  const hNotes = headers.find(h => h.toLowerCase() === "notes") || headers[3];

  // Build groups
  const groups = [];
  let current = null;

  for (const row of items) {
    const dateCell = (row[hDate] || "").trim();
    const activity = (row[hActivity] || "").trim();
    const details = (row[hDetails] || "").trim();
    const notes = (row[hNotes] || "").trim();

    // skip fully empty
    if (!dateCell && !activity && !details && !notes) continue;

    if (isDayHeader(dateCell)) {
      // start new day group
      current = {
        dayTitle: dateCell,
        dayMain: activity || "",     // the main activity line on the day header row
        dayMainDetails: details || "",
        dayMainNotes: notes || "",
        items: []
      };
      groups.push(current);
      continue;
    }

    // time block row
    if (!current) {
      // if sheet starts without a day header, create a fallback group
      current = { dayTitle: "Itinerary", dayMain: "", dayMainDetails: "", dayMainNotes: "", items: [] };
      groups.push(current);
    }

    current.items.push({
      timeBlock: dateCell,  // Morning/Evening/etc
      activity,
      details,
      notes
    });
  }

  // Render HTML
  wrap.innerHTML = groups
    .map(g => {
      // sort time items
      const sorted = [...g.items].sort((a, b) => timeRank(a.timeBlock) - timeRank(b.timeBlock));

      const mainLine = g.dayMain
        ? `<div style="margin-top:8px; opacity:.9;">
             <div><span style="opacity:.7;">Activity:</span> ${escapeHTML(g.dayMain)}</div>
             ${g.dayMainDetails ? `<div><span style="opacity:.7;">Details:</span> ${escapeHTML(g.dayMainDetails)}</div>` : ""}
             ${g.dayMainNotes ? `<div><span style="opacity:.7;">Notes:</span> ${escapeHTML(g.dayMainNotes)}</div>` : ""}
           </div>`
        : "";

      const subItems = sorted
        .map(it => {
          return `
            <div style="border:1px solid rgba(0,0,0,.08); border-radius:12px; padding:10px; background: rgba(0,0,0,.02); margin-top:10px;">
              <div style="font-weight:700; margin-bottom:6px;">${escapeHTML(it.timeBlock || "Plan")}</div>
              <div><span style="opacity:.7;">Activity:</span> ${escapeHTML(it.activity)}</div>
              ${it.details ? `<div><span style="opacity:.7;">Details:</span> ${escapeHTML(it.details)}</div>` : ""}
              ${it.notes ? `<div><span style="opacity:.7;">Notes:</span> ${escapeHTML(it.notes)}</div>` : ""}
            </div>
          `;
        })
        .join("");

      return `
        <div class="card col-12">
          <h2>${escapeHTML(g.dayTitle)}</h2>
          ${mainLine}
          ${subItems}
        </div>
      `;
    })
    .join("");
}

fetch(CSV_URL)
  .then(res => res.text())
  .then(csv => {
    const { headers, items } = parseCSV(csv);
    renderItineraryGrouped(headers, items, "itinerary-list");
  })
  .catch(err => {
    console.error("Itinerary CSV error:", err);
    const p = document.getElementById("itinerary-error");
    if (p) {
      p.style.display = "block";
      p.textContent = "Could not load itinerary. Check the CSV link + publish settings.";
    }
  });
