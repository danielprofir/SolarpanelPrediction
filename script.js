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
function stopLoading() {
    var loadingCircle = document.getElementById('loadingCircle');
    loadingCircle.style.display = 'none'; // Hides the loading circle
}
function updateNumbers(lat, lon) {
    fetch(`https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&longitude=${lon}&latitude=${lat}&start=2023&end=2023`)
        .then(response => response.json())
        .then(data => {
            data = data['properties']['parameter']['ALLSKY_SFC_SW_DWN']
            stopLoading();
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
                //const row = document.createElement("tr");
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
                    document.getElementById("averageData").innerHTML = "Annual" + ": " + AC_energy.toFixed(2) + "kWh";
                }
                //row.innerHTML = `<td>${columnNames[index]}</td><td>${AC_energy.toFixed(2)}</td>`;
                //tableBody.appendChild(row);
                sum += AC_energy;
            }
            
            drawChart(ov_data);

        })
        .catch(error => console.error("Error fetching data:", error));
}

function getColorGradient(value, minValue, maxValue) {
    // Normalize the value to a range between 0 and 1
    const normalized = (value - minValue) / (maxValue - minValue);

    // Create a gradient from yellow (#FFFF00) to red (#FF0000)
    const g = Math.round(255 * normalized); // Red increases from 255 to 255
    const r = Math.round(255 * (1 - normalized)); // Green decreases from 255 to 0
    const b = 0; // Blue remains 0

    return rgbToHex(r, g, b);
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
  

      function drawChart(ov_data) {
        const values = ov_data.slice(1).map(row => row[1]);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        let ignore_first = false;
        const coloredData = ov_data.map(row => {
            if (ignore_first) {
                const value = row[1];
                const color = getColorGradient(value, minValue, maxValue);
                return [row[0], value, color]; // [Month, Value, Color]
            }
            ignore_first = true;
            return row; // Keep header row unchanged
        });
        
        var data = google.visualization.arrayToDataTable(coloredData);

        var view = new google.visualization.DataView(data);

        view.setColumns([0, 1,
                         { calc: "stringify",
                           sourceColumn: 1,
                           type: "string",
                           role: "annotation" },
                         2]);
  
        var options = {
          title: "Amount of Power, in kWh",
          width: "100%",
          height: "100%",
          bar: {groupWidth: "95%"},
          legend: { position: "none" },
          colors: coloredData.slice(1).map(row => row[2])
        };
        var chart = new google.visualization.ColumnChart(document.getElementById("columnchart_values"));
        chart.draw(view, options);
    }


    document.getElementById('startButton').addEventListener('click', function() {
        var loadingCircle = document.getElementById('loadingCircle');
        loadingCircle.style.display = 'block'; // Show the loading circle
    });
