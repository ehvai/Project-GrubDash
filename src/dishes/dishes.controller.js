const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// --- Validations ---

// validation to verify that there is data in the request
function hasData(req, res, next) {
  const { data = {} } = req.body;
  if (data) {
    return next();
  }

  next({
    status: 400,
    message: "Missing data",
  });
}

// validation to verify that each property is present
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

// validation to verify that the price is an integer and greater than zero
function priceIsValidNumber(req, res, next) {
  const {
    data: { price },
  } = req.body;
  if (!Number.isInteger(price) || price <= 0) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  next();
}

// validation that the dishId matches an id in the dishes data file
function dishIdIsValid(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (!foundDish) {
    return next({
      status: 404,
      message: `Dish does not exist: ${dishId}`,
    });
  }

  res.locals.dish = foundDish;
  next();
}

// validation that the dishId matches the id in the data provided
function routeDishIdMatchesDishId(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  if (dishId === id || id === undefined || id === null || id === "") {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

// --- Functions to responde to fetches for API

function list(req, res){
  res.json({ data: dishes });
};

function create(req, res){
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
};

function read(req, res){
  res.status(200).json({ data: res.locals.dish });
};

function update(req, res){
  const { data: { name, description, price, image_url } = {} } = req.body;
  const foundDish = res.locals.dish

  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;

  res.json({ data: foundDish });
};

module.exports = {
  list,
  create: [
    hasData,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    priceIsValidNumber,
    bodyDataHas("image_url"),
    create,
  ],
  read: [dishIdIsValid, read],
  update: [
    hasData,
    dishIdIsValid,
    routeDishIdMatchesDishId,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    priceIsValidNumber,
    bodyDataHas("image_url"),
    update,
  ],
};
