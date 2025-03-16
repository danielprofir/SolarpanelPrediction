// Initialize the map
        var map = L.map('map').setView([52.3676, 4.9041], 13); // Default to Amsterdam

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        var marker; // Variable to hold the marker

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
                    } else {
                        alert("Address not found.");
                    }
                })
                .catch(error => console.error("Error fetching location:", error));
        }