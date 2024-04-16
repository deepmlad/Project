const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const connectionString = process.env.DB_CONNECTION_STRING;
const jwtSecret = process.env.JWT_SECRET;

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

userSchema.pre('create', function(next) {
  const user = this;
  if (!user.isModified('password')) {
    return next();
  }

  bcrypt.genSalt(10)
    .then(salt => bcrypt.hash(user.password, salt))
    .then(hash => {
      user.password = hash;
      next();
    })
    .catch(err => next(err));
});

userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ _id: this._id }, jwtSecret);
  return token;
};

userSchema.statics.findByCredentials = function(email, password) {
  return this.findOne({ email }).then(user => {
    if (!user) {
      throw new Error('Invalid login credentials');
    }

    return bcrypt.compare(password, user.password).then(isMatch => {
      if (!isMatch) {
        throw new Error('Invalid login credentials');
      }
      return user;
    });
  });
};

const User = mongoose.model('User', userSchema);

const db = {
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

  register: function(userData) {
    const user = new User(userData);
    console.log(user);
    return User.create(user);
  },

  login: function(email, password) {
    return User.findByCredentials(email, password).then(user => {
      const token = user.generateAuthToken();
      return { user, token };
    });
  }
};

module.exports = db;
