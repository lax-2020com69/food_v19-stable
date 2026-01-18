const express = require("express");
const router = express.Router();
const db = require("../data");

router.get("/", (req, res) => res.json(db.foods));

router.post("/", (req, res) => {
  const food = {
    id: Date.now(),
    categoryId: req.body.categoryId,
    countryId: req.body.countryId, // Capture countryId
    name: req.body.name,
    price: req.body.price
  };
  db.foods.push(food);
  db.save();
  res.json(food);
});

router.put("/:id", (req, res) => {
  const food = db.foods.find(f => f.id == req.params.id);
  food.name = req.body.name;
  food.price = req.body.price;
  db.save();
  res.json(food);
});

router.delete("/:id", (req, res) => {
  db.foods = db.foods.filter(f => f.id != req.params.id);
  db.save();
  res.json({ message: "Food deleted" });
});

module.exports = router;
