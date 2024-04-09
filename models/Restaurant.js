const mongoose = require('mongoose');

// Define the schema for the Restaurant collection
const restaurantSchema = new mongoose.Schema({
  name: String,
  borough: String,
  cuisine: String,
  address: {
    building: String,
    coord: [Number],
    street: String,
    zipcode: String
  },
  grades: [{
    date: Date,
    grade: String,
    score: Number
  }],
  restaurant_id: String
});

// Create a model based on the schema
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

const db = {
  // Function to initialize the MongoDB connection and Restaurant model
  initialize: function(connectionString) {
    return new Promise((resolve, reject) => {
      mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
          console.log("Connected to MongoDB Atlas");
          resolve();
        })
        .catch(err => {
          console.error("Error connecting to MongoDB Atlas:", err);
          reject(err);
        });
    });
  },

  // Function to add a new restaurant to the collection
  addNewRestaurant: function(data) {
    return Restaurant.create(data);
  },

  // Function to get all restaurants for a specific page and optionally filter by borough
  getAllRestaurants: function(page, perPage, borough) {
    const skip = (page - 1) * perPage;
    const query = borough ? { borough: borough } : {};
    return Restaurant.find(query).skip(skip).limit(perPage).sort({ restaurant_id: 1 });
  },

  // Function to get a restaurant by its ID
  getRestaurantById: function(id) {
    return Restaurant.findById(id);
  },

  // Function to update a restaurant by its ID
  updateRestaurantById: function(data, id) {
    return Restaurant.findByIdAndUpdate(id, data, { new: true });
  },

  // Function to delete a restaurant by its ID
  deleteRestaurantById: function(id) {
    return Restaurant.findByIdAndDelete(id);
  }
};

module.exports = db;