const API = "http://localhost:5000/api";

let state = {
  countries: [],
  categories: [],
  foods: [],
  user: null, // Stores { username, role }
  cart: []
};

/* ================= CART LOGIC ================= */
let selectedFoodId = null;

function openFoodDetail(foodId) {
  if (!state.user) {
    alert("Please login to order");
    openAuth();
    return;
  }
  const food = state.foods.find(f => f.id == foodId);
  if (!food) {
    console.error("Food not found for ID:", foodId);
    return;
  }

  selectedFoodId = foodId;

  // Populate Modal
  const nameEl = document.getElementById("detailName");
  const priceEl = document.getElementById("detailPrice");
  const qtyEl = document.getElementById("detailQty");
  const modal = document.getElementById("foodDetailModal");

  if (nameEl) nameEl.textContent = food.name;
  if (priceEl) priceEl.textContent = `₹${food.price}`;
  if (qtyEl) qtyEl.value = 1;

  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("active");
  } else {
    console.error("Missing element: foodDetailModal");
  }
}

function closeFoodDetail() {
  const modal = document.getElementById("foodDetailModal");
  if (!modal) {
    console.error("Missing element: foodDetailModal");
    return;
  }
  modal.classList.remove("active");
  setTimeout(() => modal.classList.add("hidden"), 300);
  selectedFoodId = null;
}

// Make globally accessible
window.confirmAddToOrder = confirmAddToOrder;

function confirmAddToOrder() {
  try {
    if (!selectedFoodId) {
      alert("System Error: No food selected. Please try again.");
      closeFoodDetail();
      return;
    }

    const food = state.foods.find(f => f.id == selectedFoodId);
    if (!food) {
      alert("Error: Food item not found in memory.");
      closeFoodDetail();
      return;
    }

    const qtyInput = document.getElementById("detailQty");
    let qty = parseInt(qtyInput.value);

    if (isNaN(qty) || qty < 1) {
      alert("Please enter a valid quantity (1 or more).");
      return;
    }

    // Clone the food object to avoid reference issues (optional but safer)
    for (let i = 0; i < qty; i++) {
      state.cart.push({ ...food });
    }

    updateCartUI();
    closeFoodDetail();

    // Navigate to Cart
    openCart();
  } catch (err) {
    console.error(err);
    alert("Failed to add to order: " + err.message);
  }
}

function addToCart(foodId) {
  // Explicitly cast to string
  openFoodDetail(String(foodId));
}

function updateCartUI() {
  const count = document.getElementById("cartCount");
  const cartBtn = document.getElementById("cartBtn");

  if (!cartBtn || !count) {
    console.warn("Cart UI elements not found (cartBtn or cartCount)");
    return;
  }

  if (state.cart.length > 0) {
    cartBtn.classList.remove("hidden");
    count.textContent = state.cart.length;
  } else {
    cartBtn.classList.add("hidden");
  }
}

function openCart() {
  const modal = document.getElementById("cartModal");
  const list = document.getElementById("cartList");
  const totalEl = document.getElementById("cartTotal");
  if (!modal || !list || !totalEl) {
    console.error("Missing Cart UI elements", { modal, list, totalEl });
    alert("System Error: Cart components are missing from page.");
    return;
  }

  list.innerHTML = state.cart.map((item, index) => `
    <li>
      <div>
        <strong>${item.name}</strong>
        <div style="font-size:0.8rem; color:#777;">₹${item.price}</div>
      </div>
      <button onclick="removeFromCart(${index})" style="background:#e74c3c; padding:4px 8px; font-size:0.8rem;">×</button>
    </li>
  `).join("");

  const total = state.cart.reduce((sum, item) => sum + parseInt(item.price || 0), 0);
  if (totalEl) totalEl.textContent = `₹${total}`;

  if (modal) {
    modal.classList.add("active");
    modal.classList.remove("hidden");
    populateUserDatalist();
  }
}

function removeFromCart(index) {
  state.cart.splice(index, 1);
  updateCartUI();
  openCart(); // Re-render
}

function closeCart() {
  const modal = document.getElementById("cartModal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => modal.classList.add("hidden"), 300);
  }
}

function openPayment() {
  closeCart();
  const pModal = document.getElementById("paymentModal");
  if (pModal) {
    pModal.classList.add("active");
    pModal.classList.remove("hidden");
  } else {
    console.error("Missing element: paymentModal");
  }
}

function closePayment() {
  const modal = document.getElementById("paymentModal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => modal.classList.add("hidden"), 300);
  }
}

async function processPayment(method) {
  const total = state.cart.reduce((sum, item) => sum + parseInt(item.price), 0);

  let targetUser = state.user.username;
  let tableName = "Takeaway"; // Default for users

  // Admin/Steward Proxy Logic or User Self-Assignment
  const proxyNameEl = document.getElementById("orderForName");
  if (proxyNameEl && proxyNameEl.value.trim()) {
    const val = proxyNameEl.value.trim();
    targetUser = val;
    tableName = val; // Location label
  } else {
    // Default fallback
    if (state.user) {
      targetUser = state.user.username;
      tableName = "Takeaway";
    }
  }
  try {
    await fetch(`${API}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: state.cart,
        total,
        paymentMethod: method,
        userId: targetUser,
        tableName
      })
    });

    alert(`Order Placed Successfully via ${method === 'card' ? 'ATM Card' : 'Cash'} for ${tableName}!`);
    state.cart = [];

    updateCartUI();
    closePayment();

    // If Staff, go to Kitchen View to see the order
    if (state.user.role !== 'user') {
      showSection('dashboard');
      // renderOrders is called by showSection -> refreshDashboard
    }
  } catch (err) {
    alert("Order failed: " + err.message);
  }
}


/* ================= TABLE MANAGEMENT (Admin/Steward) ================= */


/* ================= USER MANAGEMENT ================= */
let isSignup = false;

function openAuth() {
  const modal = document.getElementById("authModal");
  if (modal) {
    modal.classList.add("active");
    modal.classList.remove("hidden");
  }
}

function closeAuth() {
  const modal = document.getElementById("authModal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.classList.add("hidden");
    }, 300);
  }
}

function toggleAuthMode() {
  isSignup = !isSignup;
  const title = document.getElementById("authTitle");
  const msg = document.getElementById("authMessage");
  const btn = document.getElementById("authBtn");
  const toggle = document.getElementById("authToggle");
  // Role selector removed from UI


  if (isSignup) {
    title.textContent = "Sign Up";
    msg.textContent = "Create a new account.";
    btn.textContent = "Sign Up";
    toggle.textContent = "Already have an account? Login";
  } else {
    title.textContent = "Login";
    msg.textContent = "Welcome back, please login.";
    btn.textContent = "Login";
    toggle.textContent = "Don't have an account? Sign Up";
  }
}

async function handleAuth() {
  const username = document.getElementById("authUsername").value.trim();
  const password = document.getElementById("authPassword").value.trim();

  if (!username || !password) {
    alert("Please enter username and password");
    return;
  }

  const endpoint = isSignup ? "/auth/register" : "/auth/login";
  const body = { username, password }; // Role is handle by backend default now

  try {
    const res = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Auth failed");

    if (isSignup) {
      alert("Registration successful! Please login.");
      toggleAuthMode();
    } else {
      // Login Success
      state.user = data;
      localStorage.setItem("user", JSON.stringify(state.user));
      updateAuthUI();
      closeAuth();
      if (state.user.role !== 'user') {
        showSection('dashboard');
      } else {
        alert("Welcome! You are logged in as User.");
      }
    }
  } catch (err) {
    alert(err.message);
  }
}

function logout() {
  state.user = null;
  localStorage.removeItem("user");
  updateAuthUI();
  showSection('hero');
}

function updateAuthUI() {
  const user = state.user;
  const navLogin = document.getElementById("navLogin");
  const navLogout = document.getElementById("navLogout");
  const navDashboard = document.getElementById("navDashboard");
  const navUsers = document.getElementById("navUsers");

  if (user) {
    if (navLogin) navLogin.classList.add("hidden");
    if (navLogout) navLogout.classList.remove("hidden");

    // Only show dashboard link if not a basic user
    if (user.role !== 'user') {
      if (navDashboard) navDashboard.classList.remove("hidden");
    } else {
      if (navDashboard) navDashboard.classList.add("hidden");
    }

    // Only show Users link for Admin
    if (user.role === 'admin') {
      if (navUsers) navUsers.classList.remove("hidden");
    } else {
      if (navUsers) navUsers.classList.add("hidden");
    }



  } else {
    if (navLogin) navLogin.classList.remove("hidden");
    if (navLogout) navLogout.classList.add("hidden");
    if (navDashboard) navDashboard.classList.add("hidden");
    if (navUsers) navUsers.classList.add("hidden");

  }
}

function checkSession() {
  const stored = localStorage.getItem("user");
  if (stored) {
    state.user = JSON.parse(stored);
    updateAuthUI();
  }
}

/* ================= SPA NAVIGATION ================= */
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
  const target = document.getElementById(id);
  if (target) {
    target.classList.remove("hidden");
  } else {
    console.warn("Section not found:", id);
  }

  // Highlight navbar
  document.querySelectorAll(".navbar a").forEach(a => a.classList.remove("active"));
  const navLink = document.querySelector(`.navbar a[onclick="showSection('${id}')"]`);
  if (navLink) navLink.classList.add("active");

  if (id === "menu") renderMenu();
  if (id === "dashboard") refreshDashboard();
  if (id === "users-mgmt") renderUsers();
}

// function updateRole() removed - handled by auth

/* ================= DATA FETCHING ================= */
async function fetchData() {
  try {
    const [cRes, catRes, fRes] = await Promise.all([
      fetch(`${API}/countries`),
      fetch(`${API}/categories`),
      fetch(`${API}/foods`)
    ]);

    state.countries = await cRes.json();
    state.categories = await catRes.json();
    state.foods = await fRes.json();
  } catch (err) {
    console.error("Failed to fetch data", err);
  }
}

/* ================= DASHBOARD LOGIC ================= */
/* ================= DASHBOARD ELEMENT VISIBILITY ================= */
function applyPermissions() {
  const role = state.user ? state.user.role : 'guest';

  // 1. Reset: Hide everything that is role-dependent
  document.querySelectorAll('.admin-only, .chef-allow, .btn-delete').forEach(el => el.style.display = 'none');

  // 2. Apply rules
  if (role === 'admin') {
    // Admin sees everything
    document.querySelectorAll('.admin-only').forEach(el => {
      if (el.tagName === 'SELECT' || el.tagName === 'BUTTON') {
        el.style.display = 'inline-block';
      } else {
        el.style.display = 'flex'; // Default for divs in this design
      }
    });
    document.querySelectorAll('.chef-allow').forEach(el => el.style.display = 'grid'); // Grid for forms
    document.querySelectorAll('.btn-delete').forEach(el => el.style.display = 'inline-block');
  }
  else if (role === 'chef') {
    // Chef: Manage Food Only
    document.querySelectorAll('.chef-allow').forEach(el => el.style.display = 'grid');
    // Show delete buttons ONLY in food list
    document.querySelectorAll('#foodList .btn-delete').forEach(el => el.style.display = 'inline-block');
  }
  else if (role === 'steward') {
    // Steward calls "read only" - effectively sees lists but no forms/buttons
    // Since we hid everything in step 1, we are good.
  }
}

/* ================= DASHBOARD LOGIC ================= */
async function refreshDashboard() {
  if (!state.user) return; // Should not happen if guided correctly

  await fetchData();

  const dashboard = document.getElementById("dashboard");
  const grid = document.querySelector(".dashboard-grid");

  // User View: Access Denied
  if (state.user.role === 'user') {
    grid.style.display = 'none';
    if (!document.getElementById('access-denied-msg')) {
      const msg = document.createElement('div');
      msg.id = 'access-denied-msg';
      msg.innerHTML = "<h3>Access Denied</h3><p>Users cannot access the dashboard.</p>";
      dashboard.insertBefore(msg, grid);
    }
    return;
  }

  // Restore Access
  grid.style.display = 'grid';
  const deniedMsg = document.getElementById('access-denied-msg');
  if (deniedMsg) deniedMsg.remove();

  // Render Lists
  renderCountries();
  renderCategories();
  renderFoodsAdmin();
  renderUsers(); // Admin only
  renderOrders(); // All staff

  // Populate dropdowns for adding food
  populateSelects();

  // Apply RBAC Visibility
  applyPermissions();
}

async function renderOrders() {
  if (!state.user || state.user.role === 'user') return; // Users don't see kitchen orders here

  try {
    const res = await fetch(`${API}/orders`);
    const orders = await res.json();
    console.log("Fetched orders:", orders);

    const list = document.getElementById("ordersList");
    const loading = document.getElementById("orders-loading");

    if (orders.length === 0) {
      loading.style.display = 'block';
      loading.textContent = "No active orders.";
      list.innerHTML = "";
      return;
    }
    loading.style.display = 'none';

    // Reversed to show newest first
    list.innerHTML = orders.slice().reverse().map(o => {
      const itemsStr = o.items.map(i => `${i.name} (x1)`).join(", ");

      // Status Logic
      let statusColor = "#f39c12"; // Pending (Orange)
      let statusText = "Pending";
      let actionBtn = "";

      if (o.status === 'cooking') {
        statusColor = "#e67e22"; // Cooking (Darker Orange)
        statusText = "Cooking 👨‍🍳";
        actionBtn = `<button onclick="updateOrderStatus(${o.id}, 'ready')" style="background:#2ecc71; color:white; padding:5px 10px; border:none; border-radius:4px; font-size:0.8rem; cursor:pointer;">Mark Ready ✅</button>`;
      } else if (o.status === 'ready') {
        statusColor = "#2ecc71"; // Ready (Green)
        statusText = "Ready 🍽️";
        actionBtn = `<button onclick="updateOrderStatus(${o.id}, 'served')" style="background:#3498db; color:white; padding:5px 10px; border:none; border-radius:4px; font-size:0.8rem; cursor:pointer;">Serve 🚀</button>`;
      } else if (o.status === 'served') {
        statusColor = "#95a5a6"; // Served (Grey)
        statusText = "Served";
        actionBtn = `<span style="font-size:0.8rem; color:#7f8c8d;">Completed</span>`;
      } else {
        // Pending
        actionBtn = `<button onclick="updateOrderStatus(${o.id}, 'cooking')" style="background:#e67e22; color:white; padding:5px 10px; border:none; border-radius:4px; font-size:0.8rem; cursor:pointer;">Start Cooking 🔥</button>`;
      }

      return `
            <div style="background:#fff; border:1px solid #eee; padding:15px; border-radius:8px; border-left:4px solid ${statusColor};">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <strong>${o.tableName || "Takeaway"}</strong>
                    <span style="font-size:0.8rem; color:#666;">${new Date(o.timestamp).toLocaleTimeString()}</span>
                </div>
                <div style="margin-bottom:8px; font-size:0.9rem; color:#333;">
                   User: <strong>${o.userId}</strong>
                </div>
                <div style="background:#f9f9f9; padding:8px; border-radius:4px; font-size:0.85rem; margin-bottom:8px;">
                   ${itemsStr}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <span style="font-weight:600;">₹${o.total}</span>
                    <span class="tag" style="background:${o.paymentMethod === 'card' ? '#fff3e0' : '#e8f5e9'}; color:#333;">${o.paymentMethod}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #eee; padding-top:10px;">
                    <span style="color:${statusColor}; font-weight:bold; font-size:0.9rem;">${statusText}</span>
                    ${actionBtn}
                </div>
            </div>
            `;
    }).join("");

  } catch (e) {
    console.error("Order fetch error", e);
  }
}

async function updateOrderStatus(id, status) {
  await apiCall(`${API}/orders/${id}/status`, "PUT", { status });
  renderOrders(); // Refresh to show new status
}

function renderCountries() {
  const list = document.getElementById("countryList");
  if (!list) return;
  list.innerHTML = state.countries.map(c => `
    <li>
      ${c.name}
      <button class="btn-sm btn-delete" onclick="deleteItem('countries', '${c.id}')">×</button>
    </li>
  `).join("");
}

function renderCategories() {
  const list = document.getElementById("categoryList");
  if (!list) return;
  list.innerHTML = state.categories.map(c => `
    <li>
      ${c.name}
      <button class="btn-sm btn-delete" onclick="deleteItem('categories', '${c.id}')">×</button>
    </li>
  `).join("");
}

function renderFoodsAdmin() {
  const list = document.getElementById("foodList");
  if (!list) return;
  list.innerHTML = state.foods.map(f => `
    <li>
      <div style="display: flex; flex-direction: column;">
        <span style="font-weight: 600;">${f.name}</span>
        <span style="font-size: 0.8rem; color: #666;">
          Price: ₹${f.price} | 
          Cat: ${state.categories.find(c => c.id == f.categoryId)?.name || 'Unknown'} | 
          Origin: ${state.countries.find(c => c.id == f.countryId)?.name || 'Unknown'}
        </span>
      </div>
      <button class="btn-sm btn-delete" onclick="deleteItem('foods', '${f.id}')">×</button>
    </li>
  `).join("");
}

function populateSelects() {
  const countrySelect = document.getElementById("foodCountrySelect");
  const categorySelect = document.getElementById("foodCategorySelect");

  if (countrySelect) {
    countrySelect.innerHTML = `<option value="">Select Country</option>` +
      state.countries.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  }

  if (categorySelect) {
    categorySelect.innerHTML = `<option value="">Select Category</option>` +
      state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  }
}

/* ================= ACTIONS ================= */
async function addCountry() {
  const input = document.getElementById("newCountryName");
  const name = input.value.trim();
  if (!name) return;

  await apiCall(`${API}/countries`, "POST", { name });
  input.value = "";
  refreshDashboard();
}

async function addCategory() {
  const input = document.getElementById("newCategoryName");
  const name = input.value.trim();
  if (!name) return;

  await apiCall(`${API}/categories`, "POST", { name });
  input.value = "";
  refreshDashboard();
}

async function addFood() {
  const name = document.getElementById("newFoodName").value.trim();
  const price = document.getElementById("newFoodPrice").value;
  const countryId = document.getElementById("foodCountrySelect").value;
  const categoryId = document.getElementById("foodCategorySelect").value;

  if (!name || !price || !countryId || !categoryId) {
    alert("Please fill all fields");
    return;
  }

  await apiCall(`${API}/foods`, "POST", { name, price, countryId, categoryId });

  // Clear inputs
  document.getElementById("newFoodName").value = "";
  document.getElementById("newFoodPrice").value = "";
  refreshDashboard();
}

/* ================= CUSTOM CONFIRM MODAL ================= */
function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmModal");
    const msgEl = document.getElementById("modalMessage");
    const btnConfirm = document.getElementById("btnConfirm");
    const btnCancel = document.getElementById("btnCancel");

    if (msgEl) msgEl.textContent = message;
    if (modal) {
      modal.classList.add("active");
      modal.classList.remove("hidden");
    }

    // Clean up previous listeners to avoid duplicates if reused rapidly (basic approach)
    const cleanup = () => {
      if (btnConfirm) btnConfirm.onclick = null;
      if (btnCancel) btnCancel.onclick = null;
      if (modal) modal.classList.remove("active");
    };

    btnConfirm.onclick = () => {
      cleanup();
      resolve(true);
    };

    btnCancel.onclick = () => {
      cleanup();
      resolve(false);
    };
  });
}

async function deleteItem(endpoint, id) {
  // Use custom modal
  const confirmed = await showConfirm("Are you sure you want to delete this item?");
  if (!confirmed) return;

  await apiCall(`${API}/${endpoint}/${id}`, "DELETE");
  refreshDashboard();
}

async function apiCall(url, method, body) {
  try {
    const opts = {
      method,
      headers: { "Content-Type": "application/json" }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  } catch (err) {
    console.error(err);
    alert(err.message);
    throw err; // Propagate to caller if needed
  }
}

/* ================= MENU ================= */
async function renderMenu() {
  await fetchData();
  const div = document.getElementById("menuCards");

  if (!state.foods.length) {
    div.innerHTML = "<p class='empty-msg'>No food items available yet.</p>";
    return;
  }

  div.innerHTML = state.foods.map(f => {
    const cat = state.categories.find(c => c.id == f.categoryId)?.name || "General";
    const country = state.countries.find(c => c.id == f.countryId)?.name || "Global";

    // Using a random placeholder image for better aesthetics
    return `
    <div class="card fade-in">
      <div class="card-img" style="background-color: #eee; height: 150px; display:flex; align-items:center; justify-content:center;">
         <span style="font-size: 3rem;">🥘</span>
      </div>
      <div class="card-content">
        <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
           <span class="tag">${cat}</span>
           <span class="tag" style="background: #e1f5fe; color: #0288d1;">${country}</span>
        </div>
        <h4>${f.name}</h4>
        <div class="price-row">
          <span class="price">₹${f.price}</span>
          <button class="btn-add" onclick="addToCart('${f.id}')">Order</button>
        </div>
      </div>
    </div>`;
  }).join("");
}

/* ================= USER MANAGEMENT ================= */
async function renderUsers() {
  if (state.user.role !== 'admin') return;

  try {
    const res = await fetch(`${API}/auth/users`);
    state.users = await res.json();

    const list = document.getElementById("userList");
    if (!list) return;

    list.innerHTML = state.users.map(u => `
      <li>
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
             <strong>${u.username}</strong>
             ${u.username === state.user.username ? '<span style="font-size:0.8rem; color:var(--primary);">(You)</span>' : ''}
          </div>
          <span class="tag" style="background:${getRoleColor(u.role)}; color:#fff;">${u.role}</span>
        </div>
        
        <div style="width:100%; border-top:1px solid #eee; margin-top:5px; padding-top:10px;">
            ${u.username === 'admin' ? '<span style="color:#aaa; font-style:italic;">Cannot change role</span>' : `
            <label style="font-size:0.8rem; display:block; margin-bottom:5px;">Change Role:</label>
            <select onchange="updateUserRole('${u.username}', this.value)" style="padding: 8px;">
                <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
                <option value="steward" ${u.role === 'steward' ? 'selected' : ''}>Steward</option>
                <option value="chef" ${u.role === 'chef' ? 'selected' : ''}>Chef</option>
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>`}
        </div>
      </li>
    `).join("");
  } catch (err) {
    console.error("Failed to load users", err);
  }
}

async function updateUserRole(username, newRole) {
  if (!confirm(`Change role for ${username} to ${newRole}?`)) {
    refreshDashboard(); // Revert selection
    return;
  }

  try {
    await fetch(`${API}/auth/users/${username}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    });
    alert(`Role updated for ${username}`);
    refreshDashboard();
  } catch (err) {
    alert("Failed to update role");
    refreshDashboard();
  }
}

async function deleteTable(id, event) {
  if (event) event.stopPropagation();
  if (!confirm("Delete this table?")) return;

  await apiCall(`${API}/tables/${id}`, "DELETE");
  renderTables();
}

function getRoleColor(role) {
  switch (role) {
    case 'admin': return '#e74c3c';
    case 'chef': return '#e67e22';
    case 'steward': return '#3498db';
    default: return '#95a5a6';
  }
}

async function populateUserDatalist() {
  const datalist = document.getElementById("userListData");
  if (!datalist) return;

  // Try to fetch users if not loaded (might fail if not admin, which is fine)
  if (!state.users || state.users.length === 0) {
    try {
      const res = await fetch(`${API}/auth/users`);
      if (res.ok) {
        state.users = await res.json();
      }
    } catch (e) { /* Ignore permission errors */ }
  }

  if (state.users) {
    datalist.innerHTML = state.users.map(u => `<option value="${u.username}">`).join("");
  }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  checkSession();
  showSection("hero");
  // Initial fetch
  fetchData();
});
