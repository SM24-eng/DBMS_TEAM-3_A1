from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

# 🔹 MySQL connection
db = mysql.connector.connect(
    host="localhost",
    user="root",          # <-- your MySQL username
    password="Sampath@2006",  # <-- your MySQL password
    database="vehicle_rental"
)
cursor = db.cursor(dictionary=True)

# 🚗 Get all vehicles
@app.route('/vehicles', methods=['GET'])
def get_vehicles():
    cursor.execute("SELECT * FROM vehicles")
    vehicles = cursor.fetchall()
    return jsonify(vehicles)

# 👤 Get all customers
@app.route('/customers', methods=['GET'])
def get_customers():
    cursor.execute("SELECT * FROM customers")
    customers = cursor.fetchall()
    return jsonify(customers)

# ➕ Add a customer
@app.route('/customers', methods=['POST'])
def add_customer():
    data = request.json
    name = data.get('name')
    contact = data.get('contact')
    cursor.execute("INSERT INTO customers (name, contact) VALUES (%s, %s)", (name, contact))
    db.commit()
    return jsonify({"message": "Customer added successfully!"})

# 📑 Get all bookings
@app.route('/bookings', methods=['GET'])
def get_bookings():
    cursor.execute("""
        SELECT b.id, c.name as customer, v.name as vehicle, b.days, b.total_rent
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN vehicles v ON b.vehicle_id = v.id
    """)
    bookings = cursor.fetchall()
    return jsonify(bookings)

# ➕ Add a booking
@app.route('/bookings', methods=['POST'])
def add_booking():
    data = request.json
    vehicle_id = data.get('vehicle_id')
    customer_id = data.get('customer_id')
    days = data.get('days')

    cursor.execute("SELECT rent_per_day FROM vehicles WHERE id = %s", (vehicle_id,))
    result = cursor.fetchone()
    if not result:
        return jsonify({"error": "Vehicle not found"}), 404

    rent_per_day = result['rent_per_day']
    total_rent = rent_per_day * days

    cursor.execute(
        "INSERT INTO bookings (vehicle_id, customer_id, days, total_rent) VALUES (%s, %s, %s, %s)",
        (vehicle_id, customer_id, days, total_rent)
    )
    db.commit()
    return jsonify({"message": "Booking added successfully!", "total_rent": total_rent})

# ✅ This is the critical part that starts Flask
if __name__ == '__main__':
    app.run(debug=True)
