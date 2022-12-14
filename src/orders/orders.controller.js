const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// --- Validations

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
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

// validation that the dish exists
function dishExists(req, res, next){
    const { data: { dishes } = {} } = req.body;
    if(dishes){
        res.locals.dishes = dishes
        return next();
    }
    next({
        status: 400,
        message: "Order must include a dish"
    })
}

// validation that the dish is an array
function dishIsArray(req, res, next){
    if(Array.isArray(res.locals.dishes)){
        return next();
    }

    next({
        status: 400,
        message: "Order must include at least one dish"
    })
}

// falidation that the dish array is not empty
function dishesIsEmpty(req, res, next){
  if(res.locals.dishes.length === 0){
    return next({
      status: 400,
      message: "Order must include at least one dish"
    })
  }
  next();
}

// validation to verify that the quantity exists, is not a zero or less and is an integer
function quantityIsValid(req, res, next) {
    res.locals.dishes.forEach((dish, index) => {
    if (!Number.isInteger(dish.quantity) || dish.quantity <= 0) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

// validation that the order exists
function orderExists(req, res, next){
  const orderId = req.params.orderId;
  const foundOrder = orders.find(order => order.id === orderId)
  if(foundOrder){
    res.locals.order = foundOrder
    return next();
  }
  next({
    status: 404,
    message: `Order id does not exist: ${orderId}`
  })
}

// validation that the orderId matches the id in the data provided
function routeOrderIdMatchesOrderId(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;
  if (orderId === id || id === undefined || id === null || id === "") {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Dish: ${id}, Route: ${orderId}`,
  });
}

// validation for the status property
function statusPropertyIsValid(req, res, next) {
    const { data: { status } = {} } = req.body;
    if ( status === "pending" || status === "preparing" || status === "out-for-delivery" || status === "delivered") {
      return next();
    }
    next({ status: 400, message: "Order must have a status of pending, preparing, out-for-delivery, delivered" });
  };

// validation for the status of delivered
function statusIsNotDelivered(req, res, next) {
  const { data: { status } ={} } = req.body;
  if(status === "delivered"){
    return next({
      status: 400,
      message: "A delivered order cannot be changed"
    })
  }

  next();
}

// validation for the status of pending for deletes
function statusIsPending(req, res, next){
  if(res.locals.order.status !=="pending"){
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending"
    })
  }
  next();
}

// --- Fetch functions for the API

function list(req, res){
  res.status(200).json({ data: orders });
};

function create(req, res){
    const { data: { deliverTo, mobileNumber, dishes} = {} } = req.body;
    const newOrder = {
      id: nextId(),
      deliverTo,
      mobileNumber,
      dishes,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
};

function read(req, res){
  res.json({ data: res.locals.order})
}

function update(req, res){
  const { data: { deliverTo, mobileNumber, status } = {} } = req.body;
  const foundOrder = res.locals.order

  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;

  res.json({ data: foundOrder });
}

function destroy(req, res){
  const { orderId } = req.params;
  const index = orders.findIndex((order)=> order.id === orderId)
  orders.splice(index, 1)
  res.sendStatus(204)
}

// --- Exports
module.exports = {
  list,
  create: [
    hasData,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    dishExists,
    dishIsArray,
    dishesIsEmpty,
    quantityIsValid,
    create,
  ],
  read: [
    orderExists,
    read,
  ],
  update: [
    hasData,
    orderExists,
    dishExists,
    dishIsArray,
    dishesIsEmpty,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    statusPropertyIsValid,
    routeOrderIdMatchesOrderId,
    quantityIsValid,
    statusIsNotDelivered,
    update,
  ],
  delete: [
    orderExists,
    statusIsPending,
    destroy
  ]
};
