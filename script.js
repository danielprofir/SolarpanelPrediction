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
    fetch(`https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=ALLSKY_SFC_SW_DWN&community=SB&longitude=${lon}&latitude=${lat}&start=2023&end=2023`)
        .then(response => response.json())
        .then(data => {
            data = data['properties']['parameter']['ALLSKY_SFC_SW_DWN']
            console.log(data)

            const columnNames = [
                "January", "February", "March", "April", "May", "June", 
                "July", "August", "September", "October", "November", "December",
                "Average",
            ];
            
            const tableBody = document.querySelector("#dataTable tbody");

            let sum = 0, count = 0;

            ov_data = [ ["Month", "Solar Radiation", { role: "style" } ]];
            tableBody.innerHTML = "";

            
            for (const [key, value] of Object.entries(data)) {
                const index = parseInt(key.slice(4, 6)) - 1; // Extract month part
                const row = document.createElement("tr");
                row.innerHTML = `<td>${columnNames[index]}</td><td>${value.toFixed(2)}</td>`;
                if (index != 12)
                    ov_data.push(
                        [columnNames[index], parseFloat(value.toFixed(2)), "#000"]
                    );
                if (index == 12){
                    document.getElementById("averageData").innerHTML = "Average" + ": " + value.toFixed(2);
                }
                tableBody.appendChild(row);
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
