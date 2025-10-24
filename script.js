const API_URL = "http://127.0.0.1:5000";

// Load customers
function loadCustomers() {
    fetch(`${API_URL}/customers`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector("#customersTable tbody");
            tbody.innerHTML = "";
            const customerSelect = document.getElementById("customerId");
            customerSelect.innerHTML = "";
            data.forEach(c => {
                tbody.innerHTML += `<tr><td>${c.id}</td><td>${c.name}</td><td>${c.contact}</td></tr>`;
                customerSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });
        });
}

// Load vehicles
function loadVehicles() {
    fetch(`${API_URL}/vehicles`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector("#vehiclesTable tbody");
            tbody.innerHTML = "";
            const vehicleSelect = document.getElementById("vehicleId");
            vehicleSelect.innerHTML = "";
            data.forEach(v => {
                tbody.innerHTML += `<tr><td>${v.id}</td><td>${v.name}</td><td>${v.type}</td><td>${v.rent_per_day}</td></tr>`;
                vehicleSelect.innerHTML += `<option value="${v.id}">${v.name} (₹${v.rent_per_day}/day)</option>`;
            });
        });
}

// Load bookings
function loadBookings() {
    fetch(`${API_URL}/bookings`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector("#bookingsTable tbody");
            tbody.innerHTML = "";
            data.forEach(b => {
                tbody.innerHTML += `<tr>
                    <td>${b.id}</td>
                    <td>${b.customer}</td>
                    <td>${b.vehicle}</td>
                    <td>${b.days}</td>
                    <td>${b.total_rent}</td>
                </tr>`;
            });
        });
}

// Add customer
function addCustomer() {
    const name = document.getElementById("customerName").value;
    const contact = document.getElementById("customerContact").value;
    if (!name || !contact) { alert("Enter name and contact"); return; }

    fetch(`${API_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        document.getElementById("customerName").value = "";
        document.getElementById("customerContact").value = "";
        loadCustomers();
    })
    .catch(err => console.error(err));
}

// Add booking
function addBooking() {
    const vehicle_id = document.getElementById("vehicleId").value;
    const customer_id = document.getElementById("customerId").value;
    const days = document.getElementById("days").value;
    if (!vehicle_id || !customer_id || !days) { alert("Select all fields"); return; }

    fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle_id, customer_id, days })
    })
    .then(res => res.json())
    .then(data => {
        alert(`Booking added! Total Rent: ₹${data.total_rent}`);
        loadBookings();
    })
    .catch(err => console.error(err));
}

// Initial load
loadCustomers();
loadVehicles();
loadBookings();
