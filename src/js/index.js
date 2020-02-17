// Global app controller
import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./Views/searchView";
import * as recipeView from "./Views/recipeView";
import * as listView from "./Views/listView";
import * as likesView from "./Views/likesView";
import { elements, renderLoader, clearLoader } from "./Views/base";
/*
    -Search Object
    -Current recipe object
    -Shopping list object
    -liked recipes
  */
const state = {};

/*
SEARCH CONTROLLER
*/
const controlSearch = async () => {
  // 1.- Get the query from the view
  const query = searchView.getInput();

  if (query) {
    //2) New search object and add to state
    state.search = new Search(query);
    //3) Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    try {
      //4) Search for recipes
      await state.search.getResults();

      //5) Render sedults on UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (error) {
      console.log("Something wrong with the search...");
      clearLoader();
    }
  }
};

elements.searchForm.addEventListener("submit", e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener("click", e => {
  const btn = e.target.closest(".btn-inline"); //To be able to click on the span or icon but target the button

  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/**
 * RECIPE CONTROLLER
 */

const controlRecipe = async () => {
  //Get ID from the url
  const id = window.location.hash.replace("#", "");

  if (id) {
    //Prepare the UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    //highligh selected search item
    if (state.search) searchView.highlightSelected(id);

    //Create your recipe object
    state.recipe = new Recipe(id);

    try {
      //Get the recipe data
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      //Calculate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      //render the recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      alert("Error processing the recipe");
      console.log(error);
    }
  }
};

//window.addEventListener("hashchange", controlRecipe);
//window.addEventListener("load", controlRecipe);

["hashchange", "load"].forEach(event => {
  window.addEventListener(event, controlRecipe);
});

/**
 * LIST CONTROLLER
 */
const controlList = () => {
  //Create a new List if there in none yet
  if (!state.list) state.list = new List();

  //Add reach ingredient to the list
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

//Handle delete and update list items events

elements.shopping.addEventListener("click", e => {
  const id = e.target.closest(".shopping__item").dataset.itemid;

  //Handle the delete button
  if (e.target.matches(".shopping__delete, .shopping__delete *")) {
    //Delete from state
    state.list.deleteItem(id);

    // Delete from UI
    listView.deleteItem(id);

    //Handle the count update
  } else if (e.target.matches(".shopping__count-value")) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

/**
 * LIKE CONTROLLER
 */

const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;

  //user has NOT yet liked currente recipe
  if (!state.likes.isLiked(currentID)) {
    //Add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    //toggle the like button
    likesView.toggleLikeBtn(true);
    //add to the UI like list
    likesView.renderLike(newLike);
  } else {
    //remove like to the state
    state.likes.deleteLike(currentID);
    //toggle the like button
    likesView.toggleLikeBtn(false);
    //remove to the UI like list
    likesView.deleteLike(currentID);
  }

  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//Restore liked recipes on page reload or load
window.addEventListener("load", () => {
  state.likes = new Likes();
  //restore likes
  state.likes.readStorage();

  //toggle like menu button
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  //Render the existing likes
  state.likes.likes.forEach(like => likesView.renderLike(like));
});

//Handling recipe button clicks
elements.recipe.addEventListener("click", e => {
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    // Decrease btn is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches(".btn-decrease, .btn-increase *")) {
    //Increase btn is clicked
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
    controlList();
  } else if (e.target.matches(".recipe__love, .recipe__love *")) {
    //Call the like controlle
    controlLike();
  }
});
