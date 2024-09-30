// require("dotenv").config();
// var express = require("express");
// var path = require("path");
// var logger = require("morgan");
// const session = require("client-sessions");
// const DButils = require("./routes/utils/DButils");
// const axios = require('axios'); // Import axios for making HTTP requests
// var cors = require('cors');

// var app = express();
// app.use(logger("dev")); //logger
// app.use(express.json()); // parse application/json
// app.use(
//   session({
//     cookieName: "session", // the cookie key name
//     secret: "template", // the encryption key
//     duration: 24 * 60 * 60 * 1000, // expired after 24 hours
//     activeDuration: 1000 * 60 * 5, // if expiresIn < activeDuration,
//     cookie: {
//       httpOnly: false,
//     }
//   })
// );
// app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
// app.use(express.static(path.join(__dirname, "public"))); // To serve static files such as images, CSS files, and JavaScript files
// app.use(express.static(path.join(__dirname, "dist"))); // Serve static files from the 'dist' directory

// const corsConfig = {
//   origin: true,
//   credentials: true
// };

// app.use(cors(corsConfig));
// app.options("*", cors(corsConfig));

// // ----> Add the image proxy route here
// app.get('/api/proxy/image', async (req, res) => {
//   const imageUrl = req.query.url; // Get the image URL from query parameters

//   if (!imageUrl) {
//     return res.status(400).send('Image URL is required');
//   }

//   try {
//     const response = await axios.get(imageUrl, {
//       responseType: 'arraybuffer', // Ensure we get the raw data
//     });
//     res.set('Content-Type', response.headers['content-type']);
//     res.send(response.data); // Send the image data back
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error fetching the image');
//   }
// });

// // Your existing routes and middleware below this line
// app.get("/", function (req, res) {
//   res.sendFile(__dirname + "/index.html");
// });

// // Route handlers
// const user = require("./routes/user");
// const recipes = require("./routes/recipes");
// const auth = require("./routes/auth");

// // Cookie middleware
// app.use(function (req, res, next) {
//   if (req.session && req.session.user_id) {
//     DButils.execQuery("SELECT user_id FROM users")
//       .then((users) => {
//         if (users.find((x) => x.user_id === req.session.user_id)) {
//           req.user_id = req.session.user_id;
//         }
//         next();
//       })
//       .catch((error) => next());
//   } else {
//     next();
//   }
// });

// // ----> For checking that our server is alive
// app.get("/alive", (req, res) => res.send("I'm alive"));

// // Routings
// app.use("/user", user);
// app.use("/recipes", recipes);
// app.use("/auth", auth);

// // Default error handler
// app.use(function (err, req, res, next) {
//   console.error(err);
//   res.status(err.status || 500).send({ message: err.message, success: false });
// });

// const server = app.listen(port, () => {
//   console.log(`Server listening on port ${port}`);
// });

// process.on("SIGINT", function () {
//   if (server) {
//     server.close(() => console.log("server closed"));
//   }
//   process.exit();
// });
