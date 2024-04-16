// Import required modules
const express = require("express");
const app = express();
const { body, validationResult } = require("express-validator");
const PORT = process.env.PORT || 3000;
const bodyParser = require("body-parser");
const handlebars = require("express-handlebars");
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const restaurant = require("./models/Restaurant");
const user = require("./models/User");

// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: "true" }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

// View engine setup
app.engine("hbs", handlebars.engine({ extname: ".hbs", defaultLayout: "main" }));
app.set("view engine", "hbs");
dotenv.config();

// Token verification middleware
function verifyToken(req, res, next) {
  const bearerHeader = req.cookies.token;
  if (typeof bearerHeader !== "undefined" && bearerHeader != "") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next(); 
  } else {
    res.send(`<script>alert('Unathorized Access!'); window.location.href='/login'</script>`); 
  }
}

restaurant
  .initialize()
  .then(() => {
    console.log("Successfully connected to MongoDB!");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(() => {
    console.log("Something went wrong while connecting to MongoDB!");
  });



app.get("/",verifyToken, (req, res) => {
  res.render("index");
});

// register

app.get("/register",(req,res)=>{
  res.render("register.hbs",{
    layout:'secondary'
  })
})

app.post("/register",(req,res)=>{
  var email = req.body.email;
  var password = req.body.password;
  var newuser = req.body;
  user.register(newuser)
      .then((result) =>{
          res.json(result);
        })
      .catch((err) => {
        console.log(err)
      });

});

// login
app.get("/login",(req,res)=>{
  res.render("login.hbs",{
    layout:'secondary'
  })
})

app.post("/login",(req,res)=>{
var email = req.body.email;
var password = req.body.password;
  user.login(email,password)
      .then((result)=>{
        res.send(result);
      })
      .catch((err)=>{
        res.json(err);
      })
})



// route to search restaurant by ID

app.get("/search/restaurant", verifyToken, (req, res) => {
  res.render("searchRestaurant");
});

app.get("/api/restaurants/:id", verifyToken, (req, res) => {
  // Extract the _id parameter from the request
  const restaurantId = req.params.id;
  // Fetch the restaurant by _id from the database
  restaurant
  .getRestaurantById(restaurantId)
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

// route to get all restaurants
app.get("/all/restaurants", verifyToken, (req, res) => {
  res.render("allRestaurants");
});

app.get("/api/restaurants", verifyToken, (req, res) => {
  // Extract query parameters
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;

  // Validate query parameters (optional, you can use express-validator or similar middleware)
  if (!page || !perPage || isNaN(parseInt(page)) || isNaN(parseInt(perPage))) {
    return res.status(400).json({ error: "Invalid query parameters" });
  }

  // Fetch restaurants from the database
  restaurant
    .getAllRestaurants(parseInt(page), parseInt(perPage))
    .then((restaurants) => {
      // Return the restaurants to the client
      res.json(restaurants);
    })
    .catch((error) => {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});





// routes to add a new restaurant
app.get("/add/restaurant", verifyToken, (req, res) => {
  res.render("addRestaurant");
});

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
  console.log(req.body);
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
app.delete("/api/restaurants/:id", (req, res) => {
  const restaurantId = req.params.id;
  console.log(restaurantId);
  restaurant
    .deleteRestaurantById(restaurantId)
    .then((deletedRestaurant) => {
      if (!deletedRestaurant) {
        return res.status(404).json({ error: "Restaurant not found" });
      }
      res.json({ message: "Restaurant deleted successfully" });
    })
    .catch((error) => {
      console.error("Error deleting restaurant:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});


app.get("/api/restaurant", (req, res) => {
  const query = req.query.query;
  restaurant
    .searchRestaurants(query, 1, 10)
    .then((searchResult) => {
      if (!searchResult) {
        return res.json({ error: "No records found!" });
      }
      console.log(searchResult);
      res.json(searchResult);
    })
    .catch((error) => {
      console.log("error searching a restaurant!");
      res.status(500).json({ error: "Internal server error" });
    });
});

app.get("/logout",(req,res)=>{
  res.cookie('token', '', { expires: new Date(0), httpOnly: true });
  
  // Redirect to the login page or any other appropriate page
  res.redirect('/login');
})
