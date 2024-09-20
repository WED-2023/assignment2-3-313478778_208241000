var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");

router.post("/register", async (req, res, next) => {
  const connection = await MySql.connection();
  try {
    const { username, firstname, lastname, country, password, email, profilePic } = req.body;

    // Check if all required fields are provided
    if (!username || !firstname || !lastname || !country || !password || !email) {
      throw { status: 400, message: "All fields are required." };
    }

    // Check for existing username
    let users = await DButils.execQuery("SELECT username FROM users");
    if (users.find((x) => x.username === username)) {
      throw { status: 409, message: "Username taken" };
    }

    // Hash password
    let hash_password = bcrypt.hashSync(password, parseInt(process.env.bcrypt_saltRounds));

    // Insert new user
    console.log("Inserting user with data:", [username, firstname, lastname, country, hash_password, email]);
    await connection.query(
      `INSERT INTO users (username, firstname, lastname, country, password, email) VALUES (?, ?, ?, ?, ?, ?)`,
      [username, firstname, lastname, country, hash_password, email]
    );

    // Commit the transaction
    await connection.query("COMMIT");
    console.log("User inserted successfully");

    res.status(201).send({ message: "User created", success: true });
  } catch (error) {
    await connection.query("ROLLBACK");
    console.error("Error during registration:", error); // Log the error
    next(error);
  } finally {
    await connection.release();
  }
});

router.post("/login", async (req, res, next) => {
  try {
    // check that username exists
    const users = await DButils.execQuery("SELECT username FROM users");
    if (!users.find((x) => x.username === req.body.username))
      throw { status: 401, message: "Username or Password incorrect" };

    // check that the password is correct
    const user = (
      await DButils.execQuery(
        `SELECT * FROM users WHERE username = '${req.body.username}'`
      )
    )[0];

    if (!bcrypt.compareSync(req.body.password, user.password)) {
      throw { status: 401, message: "Username or Password incorrect" };
    }

    // Set cookie
    req.session.user_id = user.user_id;

    // return cookie
    res.status(200).send({ message: "login succeeded", success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", function (req, res) {
  req.session.reset(); // reset the session info --> send cookie when req.session == undefined!!
  res.send({ success: true, message: "logout succeeded" });
});

module.exports = router;
