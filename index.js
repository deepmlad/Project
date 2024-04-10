// server.js
const express = require("express");
// const cors = require("cors");
const database = require("./config/database"); // Import MongoDB connection module
const mongoose = require("mongoose");
const app = express();
const { body, validationResult } = require("express-validator");
const PORT = process.env.PORT || 3000;
var bodyParser = require("body-parser"); // pull information from HTML POST (express4)
const handlebars = require( 'express-handlebars');
// Middleware
// app.use(cors());
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: "true" })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({ type: "application/vnd.api+json" })); // parse application/vnd.api+json as json

const restaurant = require("./models/Restaurant");

app.engine('hbs',hand)

restaurant
  .initialize(database.url)
  .then(() => {
    console.log("Successfully connected to MongoDB!");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(() => {
    console.log("Something went wrong while connecting to MongoDB!");
  });

// route to get all restaurants
app.get("/api/restaurants", (req, res) => {
  // Extract query parameters
  const { page, perPage, borough } = req.query;

  // Validate query parameters (optional, you can use express-validator or similar middleware)
  if (!page || !perPage || isNaN(parseInt(page)) || isNaN(parseInt(perPage))) {
    return res.status(400).json({ error: "Invalid query parameters" });
  }

  // Fetch restaurants from the database
  restaurant
    .getAllRestaurants(parseInt(page), parseInt(perPage), borough)
    .then((restaurants) => {
      // Return the restaurants to the client
      res.json(restaurants);
    })
    .catch((error) => {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});

// route
app.get("/api/restaurants/:id", (req, res) => {
  // Extract the _id parameter from the request
  const restaurantId = req.params.id;

  // Fetch the restaurant by _id from the database
  restaurant.getRestaurantById(restaurantId)
    .then((restaurant) => {
      // If the restaurant is not found, return a 404 Not Found response
      if (!restaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      // Return the restaurant to the client
      res.json(restaurant);
    })
    .catch((error) => {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});

// route to add a new restaurant
app.post(
  "/api/restaurants",
  [
    // Validate request body fields
    body("name").notEmpty().withMessage("Name is required"),
    body("borough").notEmpty().withMessage("Borough is required"),
    body("cuisine").notEmpty().withMessage("Cuisine is required"),
    body("address.building").notEmpty().withMessage("Building is required"),
    body("address.street").notEmpty().withMessage("Street is required"),
    body("address.zipcode").notEmpty().withMessage("Zipcode is required"),
    body("grades").isArray().withMessage("Grades must be an array"),
    body("grades.*.date").isISO8601().withMessage("Invalid date format"),
    body("grades.*.grade").isIn(["A", "B", "C"]).withMessage("Invalid grade"),
    body("grades.*.score")
      .isInt({ min: 0, max: 100 })
      .withMessage("Score must be an integer between 0 and 100"),
  ],
  (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const newRestaurantData = req.body;

    restaurant
      .addNewRestaurant(newRestaurantData)
      .then((restaurant) => {
        res.status(201).json(restaurant);
      })
      .catch((error) => {
        console.error("Error adding new restaurant:", error);
        res.status(500).json({ error: "Internal server error" });
      });
  }
);

// route to update a restaurant by id
app.put("/api/restaurants/:id", (req, res) => {
  const restaurantId = req.params.id;
  const updatedRestaurantData = req.body;

  restaurant
    .updateRestaurantById(updatedRestaurantData, restaurantId)
    .then((updatedRestaurant) => {
      if (!updatedRestaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      res.json({
        message: "Restaurant updated successfully",
        updatedRestaurant,
      });
    })
    .catch((error) => {
      console.error("Error updating restaurant:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});

// route to delete a restaurant by id
app.delete('/api/restaurants/:id', (req, res) => {
  const restaurantId = req.params.id;

  restaurant.deleteRestaurantById(restaurantId)
    .then(deletedRestaurant => {
      if (!deletedRestaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      res.json({ message: "Restaurant deleted successfully" });
    })
    .catch(error => {
      console.error("Error deleting restaurant:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});
