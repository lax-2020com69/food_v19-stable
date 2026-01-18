const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const countryRoutes = require("./routes/country");
const categoryRoutes = require("./routes/category");
const foodRoutes = require("./routes/food");

const app = express();

app.use(cors());
app.use(bodyParser.json());

/* ================= API ROUTES ================= */
app.use("/api/countries", countryRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/auth", require("./routes/auth"));
app.use("/api/orders", require("./routes/order"));


/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("Restaurant Backend API is running 🚀");
});

/* ============ SERVE FRONTEND SPA ============ */
app.use(express.static(path.join(__dirname, "frontend")));

/* ✅ CORRECT SPA FALLBACK (Node 22 SAFE) */
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

/* ================= SERVER ================= */
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
