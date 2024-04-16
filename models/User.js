const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
require("dotenv").config();

const connectionString = process.env.DB_CONNECTION_STRING;
const jwtSecret = process.env.ACCESS_TOKEN_SECRET;
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
});

const User = mongoose.model("User", userSchema);

const db = {
  initialize: function () {
    return new Promise((resolve, reject) => {
      mongoose
        .connect(connectionString, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        })
        .then(() => {
          console.log("Connected to MongoDB Atlas");
          resolve();
        })
        .catch((err) => {
          console.error("Error connecting to MongoDB Atlas:", err);
          reject(err);
        });
    });
  },

  register: function (userData) {
    var email = userData.email;
    return bcrypt
      .genSalt(10)
      .then((salt) => bcrypt.hash(userData.password, salt))
      .then((hash) => User.create({ email, password: hash }));
  },

  login: function (email, password) {
    return User.findOne({ email }).then((user) => {
      if (!user) throw new Error("User not found");
      return bcrypt.compare(password, user.password).then((match) => {
        if (!match) {
          return {status:"invalid"};
        }
        const token = jwt.sign({ email: email }, jwtSecret, {
          expiresIn: "1h",
        });
        return {status:"success", user, token };
      });
    });
  },

  verifyToken: function (token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) reject(err);
        resolve(decoded);
      });
    });
  },
};

module.exports = db;
