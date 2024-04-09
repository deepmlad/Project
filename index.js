// server.js
const express = require("express");
// const cors = require("cors");
const database = require("./config/database"); // Import MongoDB connection module
const mongoose = require("mongoose");
const app = express();
const express_validator = require('express-validator');
const PORT = process.env.PORT || 3000;
var bodyParser = require('body-parser');         // pull information from HTML POST (express4)

// Middleware
// app.use(cors());
app.use(express.json());
 
var port     = process.env.PORT || 8000;
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json


const restaurant = require('./models/Restaurant');

restaurant.initialize(database.url)
  .then(() => {
    console.log("Successfully connected to MongoDB!");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(() => {
    console.log("Something went wrong while connecting to MongoDB!");
  })

// route to get all restaurants
app.get("/api/restaurants", (req, res) => {
  // Extract query parameters
  const { page, perPage, borough } = req.query;

  // Validate query parameters (optional, you can use express-validator or similar middleware)
  if (!page || !perPage || isNaN(parseInt(page)) || isNaN(parseInt(perPage))) {
    return res.status(400).json({ error: "Invalid query parameters" });
  }

  // Fetch restaurants from the database
  restaurant.getAllRestaurants(parseInt(page), parseInt(perPage), borough)
    .then(restaurants => {
      // Return the restaurants to the client
      res.json(restaurants);
    })
    .catch(error => {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});


// route 
app.get("/api/restaurants/:id", (req, res) => {
  // Extract the _id parameter from the request
  const restaurantId = req.params.id;

  // Fetch the restaurant by _id from the database
  db.getRestaurantById(restaurantId)
    .then(restaurant => {
      // If the restaurant is not found, return a 404 Not Found response
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      // Return the restaurant to the client
      res.json(restaurant);
    })
    .catch(error => {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});

app.post('/api/restaurants',(req,res) => {

})