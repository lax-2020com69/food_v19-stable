const express = require("express");
const router = express.Router();
const db = require("../data");

// Place Order
router.post("/", (req, res) => {
    const { items, total, paymentMethod, userId } = req.body;
    let { tableId = null, tableName = "Takeaway" } = req.body;


    if (!items || items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
    }

    const newOrder = {
        id: Date.now(),
        items,
        total,
        paymentMethod,
        tableId,
        userId, // Who ordered (or who the table is assigned to)
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    db.orders.push(newOrder);
    if (db.save) db.save();
    res.json({ message: "Order placed successfully", orderId: newOrder.id });
});

// Get Orders (Admin/Chef view)
router.get("/", (req, res) => {
    res.json(db.orders);
});

// Update Order Status
router.put("/:id/status", (req, res) => {
    const { status } = req.body;
    const order = db.orders.find(o => o.id == req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Valid transitions could be checked here, but trusting frontend for now
    order.status = status;

    if (db.save) db.save();
    res.json({ message: "Order status updated", order });
});

module.exports = router;
