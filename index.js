const express = require("express");
const app = express();
//const port = 4000;
require("dotenv").config();
const port=process.env.port
app.use(express.json());

// In-memory storage for rooms and bookings 
let rooms = [];
let bookings = [];
let customers = [];

// Endpoint to create a new room
app.post("/rooms", (req, res) => {
  const { number_of_seats, amenities, price_per_hour } = req.body;

  // Create a new room object
  const newRoom = {
    id: rooms.length + 1,
    number_of_seats:10,
    amenities:"wifi,projecter,whiteboard",
    price_per_hour:1000,
  };

  // Add the room to the rooms array
  rooms.push(newRoom);

  res.status(201).json({ message: "Room created successfully", room: newRoom });
});

// Endpoint to create a new booking
app.post("/bookings", (req, res) => {
  const { customer_name, date, start_time, end_time, room_id } = req.body;

  // Check if room exists
  const room = rooms.find((r) => r.id === room_id);
  if (!room) {
    return res.status(404).json({ error: `Room with id ${room_id} not found` });
  }

  // Check for time overlap with existing bookings for the same room
  for (let booking of bookings) {
    if (booking.room_id === room_id && date === booking.date) {
      if (!(end_time <= booking.start_time || start_time >= booking.end_time)) {
        return res
          .status(400)
          .json({
            error: `Room ${room_id} is already booked for ${date} from ${booking.start_time} to ${booking.end_time}`,
          });
      }
    }
  }

  // Create a new booking object
  const newBooking = {
    id: bookings.length + 1,
    customer_name,
    date,
    start_time,
    end_time,
    room_id,
  };

  // Add the booking to the bookings array
  bookings.push(newBooking);

  // Add customer to customers array if not already added
  if (!customers.some((c) => c.customer_name === customer_name)) {
    customers.push({ customer_name });
  }

  res
    .status(201)
    .json({ message: "Booking created successfully", booking: newBooking });
});

// Endpoint to list all rooms with booked data
app.get("/rooms/booked-data", (req, res) => {
  const roomsWithBookedData = rooms.map((room) => {
    const bookedData = bookings.filter(
      (booking) => booking.room_id === room.id
    );
    return {
      room_id: room.id,
      amenities: room.amenities,
      number_of_seats: room.number_of_seats,
      booked_data: bookedData.map((booking) => ({
        customer_name: booking.customer_name,
        date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
      })),
    };
  });

  res.status(200).json(roomsWithBookedData);
});

// Endpoint to list all customers with booked data
app.get("/customers/booked-data", (req, res) => {
  const customersWithBookedData = customers.map((customer) => {
    const customerBookings = bookings.filter(
      (booking) => booking.customer_name === customer.customer_name
    );
    return {
      customer_name: customer.customer_name,
      booked_data: customerBookings.map((booking) => ({
        room_id: booking.room_id,
        date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
      })),
    };
  });

  res.status(200).json(customersWithBookedData);
});

// Endpoint to list how many times a customer has booked a room
app.get("/customers/booking-count", (req, res) => {
  const bookingCounts = [];
  customers.forEach((customer) => {
    const customerBookings = bookings.filter(
      (booking) => booking.customer_name === customer.customer_name
    );
    bookingCounts.push({
      customer_name: customer.customer_name,
      booking_count: customerBookings.length,
      bookings: customerBookings.map((booking) => ({
        room_id: booking.room_id,
        date: booking.date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        booking_id: booking.id,
        booking_date: booking.booking_date,
        booking_status: booking.booking_status,
      })),
    });
  });

  res.status(200).json(bookingCounts);
});

// Start the server
app.listen(port, () => {
  console.log(
    `Hall booking API listening at http://localhost:${port}/rooms/booked-data`
  );
});
