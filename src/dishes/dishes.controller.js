const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function hasValidPrice(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  } else if (price) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a price.",
  });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (!foundDish) {
    return next({
      status: 404,
      message: `Dish does not exist: ${dishId}.`,
    });
  }
  res.locals.dish = foundDish;
  next();
}

function hasName(req, res, next) {
  const {
    data: { name },
  } = req.body;
  if (name) {
    return next();
  }
  next({
    status: 400,
    message: "Dish must include a name.",
  });
}

function hasDesc(req, res, next) {
  const { data: { description } = {} } = req.body;
  if (description) {
    return next();
  }
  return next({
    status: 400,
    message: "Dish must include a description.",
  });
}

function hasImage_Url(req, res, next) {
  const { data: { image_url } = {} } = req.body;
  if (image_url) {
    return next();
  }
  next({ status: 400, message: "Dish must include a image_url" });
}

function idsMatch(req, res, next) {
  const dishId = res.locals.dish.id;
  const { data: { id } = {} } = req.body;

  if (!id || typeof id === "undefined") {
    next();
  } else if (id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

function list(req, res, next) {
  res.json({ data: dishes });
}

function read(req, res) {
  const foundDish = res.locals.dish;
  res.json({ data: foundDish });
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function update(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const dish = res.locals.dish;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.status(200).json({ data: dish });
}

module.exports = {
  list,
  read: [dishExists, read],
  create: [hasName, hasDesc, hasValidPrice, hasImage_Url, create],
  update: [
    dishExists,
    hasName,
    hasDesc,
    hasValidPrice,
    hasImage_Url,
    idsMatch,
    update,
  ],
};
