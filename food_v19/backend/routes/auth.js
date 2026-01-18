const express = require("express");
const router = express.Router();
const db = require("../data");

// Register
router.post("/register", (req, res) => {
    const { username, password } = req.body; // Ignore role from body

    if (db.users.find(u => u.username === username)) {
        return res.status(400).json({ message: "User already exists" });
    }

    const newUser = {
        username,
        password, // In a real app, hash this!
        role: 'user' // Always default to user
    };

    db.users.push(newUser);
    if (db.save) db.save();
    res.json({ message: "Registered successfully" });
});

// Login
router.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.users.find(u => u.username === username && u.password === password);

    if (user) {
        res.json({ username: user.username, role: user.role });
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
});

// Get All Users (Admin only in production, but for now simple)
router.get("/users", (req, res) => {
    // Ideally verify admin here
    res.json(db.users.map(u => ({ username: u.username, role: u.role })));
});

// Update User Role
router.put("/users/:username/role", (req, res) => {
    const { role } = req.body;
    const user = db.users.find(u => u.username === req.params.username);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    if (db.save) db.save();
    res.json(user);
});

module.exports = router;
