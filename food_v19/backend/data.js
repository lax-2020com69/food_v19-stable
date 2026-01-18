const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');
const USERS_FILE = path.join(__dirname, 'users.json');


// Initial Data Structure
let data = {
    countries: [],
    categories: [],
    foods: [],
    orders: [],
    users: []
};

/* ================= HELPERS ================= */
function loadFile(file, defaultData) {
    try {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf-8');
            return content ? JSON.parse(content) : defaultData;
        }
    } catch (err) {
        console.error(`Error loading ${file}`, err);
    }
    return defaultData;
}

function saveFile(file, content) {
    try {
        fs.writeFileSync(file, JSON.stringify(content, null, 2));
    } catch (err) {
        console.error(`Error saving ${file}`, err);
    }
}

/* ================= LOAD ================= */
// Load Main Data (Menu, Orders)
const mainData = loadFile(DATA_FILE, { countries: [], categories: [], foods: [], orders: [] });
data.countries = mainData.countries || [];
data.categories = mainData.categories || [];
data.foods = mainData.foods || [];
data.orders = mainData.orders || [];

// Load Users
data.users = loadFile(USERS_FILE, [
    { username: "admin", password: "123", role: "admin" }
]);



/* ================= SAVE METHODS ================= */
data.save = () => {
    saveFile(DATA_FILE, {
        countries: data.countries,
        categories: data.categories,
        foods: data.foods,
        orders: data.orders
    });
    saveFile(USERS_FILE, data.users);

};

module.exports = data;
