var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

router.post('/addRecipe', async (req, res, next) => {
  try {
    const user_id = req.session.user_id; // Get the logged-in user ID
    const {
      recipe_name,
      cuisine,
      diet,
      instructions,
      ingredients,
      image_url,
      prep_time,
      cook_time,
      is_private
    } = req.body; // Extract recipe details from the request body

    // Join the ingredients and instructions arrays into a string
    const instructionsText = instructions.join("\n");  // Join instructions with newline characters
    const ingredientsText = ingredients.join(", ");    // Join ingredients with a comma separator

    // Check that all required fields are provided
    if (!recipe_name || !instructionsText || !ingredientsText || !image_url) {
      throw { status: 400, message: "Recipe name, instructions, ingredients, and image_url are required." };
    }

    // Insert the recipe into the user_recipes table
    await DButils.execQuery(`
      INSERT INTO user_recipes
      (user_id, recipe_name, cuisine, diet, instructions, ingredients, image_url, prep_time, cook_time, is_private)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, recipe_name, cuisine, diet, instructionsText, ingredientsText, image_url, prep_time, cook_time, is_private]
    );

    res.status(201).send({ message: "Recipe added successfully", success: true });
  } catch (error) {
    next(error);
  }
});




module.exports = router;
