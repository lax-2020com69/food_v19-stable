const express = require("express");
const router = express.Router();
const db = require("../data");

router.get("/", (req, res) => res.json(db.categories));

router.post("/", (req, res) => {
  const cat = {
    id: Date.now(),
    countryId: req.body.countryId,
    name: req.body.name
  };
  db.categories.push(cat);
  db.save();
  res.json(cat);
});

router.put("/:id", (req, res) => {
  const cat = db.categories.find(c => c.id == req.params.id);
  cat.name = req.body.name;
  db.save();
  res.json(cat);
});

router.delete("/:id", (req, res) => {
  db.categories = db.categories.filter(c => c.id != req.params.id);
  db.save();
  res.json({ message: "Category deleted" });
});

module.exports = router;
