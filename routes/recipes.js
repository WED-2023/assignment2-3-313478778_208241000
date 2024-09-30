var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));

/**
 * This path is for searching a recipe
 */
router.get("/search", async (req, res, next) => {
  try {
    const recipeName = req.query.recipeName;
    const cuisine = req.query.cuisine;
    const diet = req.query.diet;
    const intolerance = req.query.intolerance;
    const number = req.query.number || 5;
    const results = await recipes_utils.searchRecipe(recipeName, cuisine, diet, intolerance, number);
    res.send(results);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns a full details of a recipe by its id
 */
// router.get("/:recipeId", async (req, res, next) => {
//   try {
//     const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
//     res.send(recipe);
//   } catch (error) {
//     next(error);
//   }
// });


/**
 * This path retrieves three random recipes and checks if they are favorites for the logged-in user
 */
router.get("/random", async (req, res, next) => {
  try {
    const user_id = req.session.user_id; // Retrieve user ID from session
    const numberOfRecipesToDisplay = parseInt(req.query.number) || 1
    const recipes = await recipes_utils.getRandomRecipes(user_id, numberOfRecipesToDisplay);
    console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    console.log(recipes)
    console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    res.send(recipes);
  } catch (error) {
    next(error);
  }
});



module.exports = router;
