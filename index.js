// server.js
const express = require("express");
const cors = require("cors");
const db = require("./config/database"); // Import MongoDB connection module

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize MongoDB connection
const mongoConnectionString =
  "mongodb+srv://deep-adin:admin@deeplad.lhjutto.mongodb.net/sample_restaurants?retryWrites=true&w=majority&appName=DeepLad";

db.initialize(mongoConnectionString);

// route to get all restaurants
app.get("/api/restaurants", async (req, res) => {
  try {
    // Extract query parameters
    const { page, perPage, borough } = req.query;

    // Validate query parameters (optional, you can use express-validator or similar middleware)
    if (
      !page ||
      !perPage ||
      isNaN(parseInt(page)) ||
      isNaN(parseInt(perPage))
    ) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }

    // Fetch restaurants from the database
    const restaurants = await db.getAllRestaurants(
      parseInt(page),
      parseInt(perPage),
      borough
    );

    // Return the restaurants to the client
    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// route 
app.get("/api/restaurants/:id", async (req, res) => {
  try {
    // Extract the _id parameter from the request
    const restaurantId = req.params.id;

    // Fetch the restaurant by _id from the database
    const restaurant = await db.getRestaurantById(restaurantId);

    // If the restaurant is not found, return a 404 Not Found response
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Return the restaurant to the client
    res.json(restaurant);
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
