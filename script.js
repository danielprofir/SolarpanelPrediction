// Initialize the map
        var map = L.map('map').setView([52.3676, 4.9041], 13); // Default to Amsterdam

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

var marker; // Variable to hold the marker
let ov_data = [["Month", "Solar Radiation", { role: "style" }]]; // Global chart data

google.charts.load("current", { packages: ['corechart'] });


// Function to get coordinates from an address
function searchLocation() {
    var address = document.getElementById("addressInput").value;
    if (address.trim() === "") {
        alert("Please enter an address.");
        return;
    }

    // Fetch coordinates from Nominatim API
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                var lat = data[0].lat;
                var lon = data[0].lon;

                // Move the map to the new location
                map.setView([lat, lon], 13);

                // Remove old marker if it exists
                if (marker) {
                    map.removeLayer(marker);
                }

                // Add new marker at searched location
                marker = L.marker([lat, lon]).addTo(map)
                    .bindPopup(`Location: ${address}`)
                    .openPopup();

                updateNumbers(lat, lon);
            } else {
                alert("Address not found.");
            }
        })
        .catch(error => console.error("Error fetching location:", error));
}

function updateNumbers(lat, lon) {
    fetch(`https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon}&latitude=${lat}&start=2023&end=2023`)
        .then(response => response.json())
        .then(data => {
            data = data['properties']['parameter']['ALLSKY_SFC_SW_DWN']
            console.log(data)

            const columnNames = [
                "January", "February", "March", "April", "May", "June", 
                "July", "August", "September", "October", "November", "December",
                "Annual",
            ];

            const nrOfDays = [
                31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
            ]
            
            const tableBody = document.querySelector("#dataTable tbody");

            ov_data = [ ["Month", "Solar Radiation", { role: "style" } ]];
            tableBody.innerHTML = "";
            let sum = 0;
            
            for (const [key, value] of Object.entries(data)) {
                const index = parseInt(key.slice(4, 6)) - 1; // Extract month part
                const row = document.createElement("tr");
                /** 
                 * We assume the industry standards, where the array size is 20 m2
                 * The efficiency of a solar panel is 0.18
                 * The invertor efficiency from DC to AC energy is 0.9
                 */
                var AC_energy;
                if (index < 12) {
                    AC_energy = value * 20 * 0.18 * 0.9 * nrOfDays[index];
                    ov_data.push(
                        [columnNames[index], parseFloat(AC_energy.toFixed(2)), "#000"]
                    );
                }
                else {
                    AC_energy = sum;
                    document.getElementById("averageData").innerHTML = "Average" + ": " + AC_energy.toFixed(2);
                }
                row.innerHTML = `<td>${columnNames[index]}</td><td>${AC_energy.toFixed(2)}</td>`;
                tableBody.appendChild(row);
                sum += AC_energy;
            }
            
            drawChart(ov_data);

        })
        .catch(error => console.error("Error fetching data:", error));
}


function drawChart(ov_data) {
    var data = google.visualization.arrayToDataTable(ov_data);

    var view = new google.visualization.DataView(data);
    view.setColumns([0, 1,
                        { calc: "stringify",
                        sourceColumn: 1,
                        type: "string",
                        role: "annotation" },
                        2]);

    var options = {
        title: "Amount of Power, in g/cm^3",
        width: "100%",
        height: "100%",
        bar: {groupWidth: "95%"},
        legend: { position: "none" },
    };
    var chart = new google.visualization.ColumnChart(document.getElementById("columnchart_values"));
    chart.draw(view, options);
}
