require("dotenv").config();
import express, { json, urlencoded, static as expressStatic } from "express";
import { join } from "path";
import logger from "morgan";
import session from "client-sessions";
import { execQuery } from "./routes/utils/DButils.js";
import cors from 'cors';
import user from "./routes/user.js"; // Ensure all imports include .js
import recipes from "./routes/recipes.js"; // Ensure all imports include .js
import auth from "./routes/auth.js"; // Ensure all imports include .js

const app = express();
app.use(logger("dev"));
app.use(json());
app.use(
  session({
    cookieName: "session",
    secret: process.env.COOKIE_SECRET || "template",
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5,
    cookie: { httpOnly: false },
  })
);
app.use(urlencoded({ extended: false }));
app.use(expressStatic(join(__dirname, "public")));
app.use(expressStatic(join(__dirname, "dist")));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

const corsConfig = {
  origin: true,
  credentials: true
};
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

const port = process.env.PORT || "80";

app.use((req, res, next) => {
  if (req.session && req.session.user_id) {
    execQuery("SELECT user_id FROM users")
      .then((users) => {
        if (users.find((x) => x.user_id === req.session.user_id)) {
          req.user_id = req.session.user_id;
        }
        next();
      })
      .catch((error) => {
        console.error("Error checking session user:", error);
        next();
      });
  } else {
    next();
  }
});

app.get("/alive", (req, res) => res.send("I'm alive"));

// Route definitions
app.use("/users", user);
app.use("/recipes", recipes);
app.use(auth);

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).send({ message: err.message, success: false });
});

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

process.on("SIGINT", function () {
  if (server) {
    server.close(() => console.log("Server closed"));
  }
  process.exit();
});
