const mongoose = require('mongoose');
require('dotenv').config();

const connectionString = process.env.DB_CONNECTION_STRING;

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
  initialize: function() {
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
  getAllRestaurants: function(page, perPage,borough) {
    const skip = (page - 1) * perPage;
    let query = Restaurant.find();
    
    if (borough) {
        query = query.where('borough').equals(borough);
    }
    
    return query.skip(skip).limit(perPage).exec()
        .then(restaurants => {
            return Restaurant.countDocuments().exec().then(total => {
                return { data: restaurants, recordsTotal: total };
            });
        });
  },

  // Function to get a restaurant by its ID
  getRestaurantById: function(id) {
    return Restaurant.findById(id);
  },

  // Function to update a restaurant by its ID
  updateRestaurantById: function(data, id) {
    return Restaurant.findByIdAndUpdate(id, data, { new: true });
  },

  getUniqueBorough: function(){
    return Restaurant.distinct('borough');
  },

  // Function to delete a restaurant by its ID
  deleteRestaurantById: function(id) {
    return Restaurant.findByIdAndDelete(id);
  },

  searchRestaurants: function(keyword, page, perPage) {
    const skip = (page - 1) * perPage;

    const query = keyword ? {
        $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { borough: { $regex: keyword, $options: 'i' } },
            { cuisine: { $regex: keyword, $options: 'i' } },
            { "address.street": { $regex: keyword, $options: 'i' } },
            { "address.building": { $regex: keyword, $options: 'i' } },
            { "address.zipcode": { $regex: keyword, $options: 'i' } }
        ]
    } : {};

    return Restaurant.find(query).limit(perPage).exec()
        .then(restaurants => Restaurant.countDocuments(query).exec().then(total => ({ data: restaurants, recordsTotal: total })));
},

};

module.exports = db;