const express = require("express");
const router = express.Router();
const db = require("../data");

router.get("/", (req, res) => res.json(db.countries));

router.post("/", (req, res) => {
  const country = { id: Date.now(), name: req.body.name };
  db.countries.push(country);
  db.save();
  res.json(country);
});

router.put("/:id", (req, res) => {
  const country = db.countries.find(c => c.id == req.params.id);
  country.name = req.body.name;
  db.save();
  res.json(country);
});

router.delete("/:id", (req, res) => {
  db.countries = db.countries.filter(c => c.id != req.params.id);
  db.save();
  res.json({ message: "Country deleted" });
});

module.exports = router;
