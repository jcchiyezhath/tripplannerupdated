const DASHBOARD_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlvP8j5dZDbEghxDiom6ByE62ccsp7NNCAa4HrPw58dp4_8A3WKZHqOFFIVMDNoeITTh8CPJbTUvDH/pub?gid=0&single=true&output=csv";

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const data = {};
  for (let i = 1; i < lines.length; i++) {
    const [key, value] = lines[i].split(",");
    data[key.trim()] = value?.trim() || "";
  }
  return data;
}

fetch(DASHBOARD_CSV_URL)
  .then((res) => res.text())
  .then((csv) => {
    const data = parseCSV(csv);

    document.getElementById("trip-overview").innerHTML = `
      <strong>${data.trip_name}</strong><br>
      ${data.start_date} → ${data.end_date}<br>
      Destination: ${data.destination}<br>
      People confirmed: ${data.confirmed_people}
    `;

    document.getElementById("stay-location").innerHTML = `
      ${data.primary_stay}<br>
      ${data.primary_address}<br>
      <a href="${data.maps_link}" target="_blank">Open in Google Maps</a>
    `;

    document.getElementById("cost-summary").innerHTML = `
      Total: $${data.estimated_total_cost}<br>
      Per person: $${data.per_person_cost}
    `;
  })
  .catch((err) => {
    console.error("Dashboard CSV error:", err);
  });
