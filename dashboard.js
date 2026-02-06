const DASHBOARD_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlvP8j5dZDbEghxDiom6ByE62ccsp7NNCAa4HrPw58dp4_8A3WKZHqOFFIVMDNoeITTh8CPJbTUvDH/pub?gid=0&single=true&output=csv";
function csvToRows(csvText) {
  return csvText.trim().split("\n").map(line =>
    line.split(",").map(cell => cell.replace(/^"|"$/g, "").trim())
  );
}

async function loadDashboard() {
  const res = await fetch(DASHBOARD_CSV_URL, { cache: "no-store" });
  const text = await res.text();
  const rows = csvToRows(text);

  // expects 2 columns: Key, Value
  const data = {};
  for (let i = 1; i < rows.length; i++) {
    const key = rows[i][0];
    const val = rows[i][1];
    if (key) data[key] = val;
  }

  // fill placeholders (these IDs must exist in index.html)
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "—";
  };

  set("trip_name", data.trip_name);
  set("dates", `${data.start_date || ""} to ${data.end_date || ""}`.trim());
  set("destination", data.destination);
  set("confirmed_people", data.confirmed_people);
  set("estimated_total_cost", data.estimated_total_cost);
  set("per_person_cost", data.per_person_cost);
  set("primary_stay", data.primary_stay);
  set("primary_address", data.primary_address);

  const mapEl = document.getElementById("maps_link");
  if (mapEl) {
    if (data.maps_link) {
      mapEl.href = data.maps_link;
      mapEl.textContent = "Open in Google Maps";
    } else {
      mapEl.removeAttribute("href");
      mapEl.textContent = "—";
    }
  }
}

loadDashboard().catch(console.error);
