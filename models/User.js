const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Hash password before saving
userSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

// Define static methods for user model
userSchema.statics.register = function (userData) {
  return new Promise((resolve, reject) => {
    const user = new User(userData);
    return this.create(user)
  });
};

userSchema.statics.login = function (email, password) {
  return new Promise((resolve, reject) => {
    User.findOne({ email }, (err, user) => {
      if (err) {
        return reject(err);
      }
      if (!user) {
        return reject(new Error("User not found"));
      }
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          return reject(err);
        }
        if (!result) {
          return reject(new Error("Invalid password"));
        }
        resolve(user);
      });
    });
  });
};

const User = mongoose.model("User", userSchema);

module.exports = User;
