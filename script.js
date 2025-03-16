
var map = L.map('map').setView([51.505, -0.09], 13);


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

function handleSearch(event){
    event.preventDefault();

    const searchInput = document.getElementById("searchInput").value.trim();

    if(searchInput == "") {
        return;
    }

}