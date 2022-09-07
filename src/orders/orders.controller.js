const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    res.locals.orderId = orderId;
    return next();
  }
  return next({
    status: 404,
    message: `Order ID: ${orderId} does not exist.`,
  });
}

function hasDeliver(req, res, next) {
  const { data: {deliverTo} = {} } = req.body;
  if (deliverTo) {
   return next();
  }
  return next({
    status: 400,
    message: "Order must include a deliverTo.",
  });
}

function hasMobile(req, res, next) {
    const { data: {mobileNumber} = {} } = req.body;
    if (mobileNumber) {
     return next();
    }
    return next({
      status: 400,
      message: "Order must include a mobileNumber.",
    });
  }

  function validDish(req, res, next) {
   const {data: { dishes } = {} } = req.body;
    if (!dishes) {
      return next({
        status: 400,
        message: "Order must include a dish",
      });
    }
  
    if (dishes.length === 0 || !Array.isArray(dishes)) {
      return next({
        status: 400,
        message: "Order must include at least one dish",
      });
    }
  
    if (dishes) {
      return next();
    }
    return next({ status: 400, message: "Order must include a dish" });
  };

function validStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (!status || status === "invalid") {
    res
      .status(400)
      .json({
        error:
          "Invalid order status: Order must have a status of pending, preparing, out-for-delivery, delivered.",
      });
  } else if (status === "delivered") {
    res.status(400).json({ error: "A delivered order cannot be changed." });
  }
  return next();
}

function dishQuantity(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.forEach((dish, index) => {
    if (
      dish.quantity < 0 ||
      !dish.quantity ||
      !Number.isInteger(dish.quantity)
    ) {
      res
        .status(400)
        .json({
          error: `Dish ${index} must have a quantity that is an integer greater than 0`,
        });
    }
  });
  return next();
}

function orderPending(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    res
      .status(400)
      .json({ error: "An order cannot be deleted unless it is pending." });
  }
  next();
}

function idsMatch(req, res, next) {
  const { data: { id } = {} } = req.body;
  if (!id || typeof id === "undefined") {
    return next();
  } else if (id !== res.locals.orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${res.locals.orderId}`,
    });
  }
  return next();
}

function list(req, res, next) {
  res.json({ data: orders });
}

function read(req, res) {
  const foundOrder = res.locals.order;
  res.json({ data: foundOrder });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res) {
  const { data: { deliverTo, mobileNumber, quantity, dishes } = {} } = req.body;
  const foundOrder = res.locals.order;

  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.dishes = dishes;
  foundOrder.quantity = quantity;

  res.status(200).json({ data: foundOrder });
}

function destroy(req, res) {
  const index = orders.findIndex((order) => order.id === res.locals.orderId);

  if (index > -1) {
    orders.splice(index, 1);
    res.sendStatus(204);
  }
}

module.exports = {
  list,
  create: [
    hasDeliver,
    hasMobile,
    validDish,
    dishQuantity,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    hasDeliver,
    hasMobile,
    validDish,
    dishQuantity,
    idsMatch,
    validStatus,
    update,
  ],
  delete: [orderExists, orderPending, destroy],
};
