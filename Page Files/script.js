// script.js

// --- RESPONSIVE SIDEBAR ---
function toggleSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
}

// --- CONFIGURATION ---
// API routes (proxied through Vercel serverless functions)
const N8N_ORDER_WEBHOOK = "/api/order";
const N8N_ADMIN_DATA_WEBHOOK = "/api/admin-data";
const N8N_UPDATE_STATUS_WEBHOOK = "/api/update-status";
const N8N_CONTACT_WEBHOOK = "/api/contact";

// Inventory API routes
const N8N_INVENTORY_WEBHOOK = "/api/inventory";
const N8N_INVENTORY_UPDATE_WEBHOOK = "/api/inventory-update";

// --- SECURITY & AUTHENTICATION ---

// Admin page protection
if (window.location.pathname.includes("admin")) {
    if (sessionStorage.getItem("isLoggedIn") !== "true") {
        window.location.href = "login.html";
    }
}

// Login Function (credentials verified server-side)
async function handleLogin(e) {
    e.preventDefault();
    const userIn = document.getElementById('username').value;
    const passIn = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');
    const loader = document.getElementById('loader');

    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userIn, password: passIn })
        });
        const result = await response.json();

        if (result.success) {
            errorMsg.style.display = "none";
            if (loader) loader.classList.add('active');
            sessionStorage.setItem("isLoggedIn", "true");
            setTimeout(() => {
                window.location.href = "admin.html";
            }, 2000);
        } else {
            errorMsg.style.display = "block";
            const loginBox = document.querySelector('.login-box');
            if (loginBox) {
                loginBox.style.transform = "translateX(5px)";
                setTimeout(() => loginBox.style.transform = "translateX(0)", 100);
            }
        }
    } catch (error) {
        errorMsg.style.display = "block";
    }
}

// Logout Function
function logout() {
    sessionStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
}

// --- PRODUCT DATA ---
const products = [
    { id: 1, name: "Banana Bread", prices: [10, 20], image: "../brand_assets/Banana bread.png", desc: "Sweet & moist, made with ripe bananas" },
    { id: 2, name: "Coconut Bread", prices: [10, 20], image: "../brand_assets/Coconut Bread.png", desc: "Tropical coconut flavor in every bite" },
    { id: 3, name: "Pawpaw Bread", prices: [10, 20], image: "../brand_assets/pawpaw bread.png", desc: "Rich papaya-infused artisan bread" },
    { id: 4, name: "Banapaw Bread", prices: [10, 20], image: "../brand_assets/Banapaw Bread.png", desc: "Banana & pawpaw fusion delight" },
    { id: 5, name: "Honey Bread", prices: [10, 20], image: "../brand_assets/Honey Bread.png", desc: "Naturally sweetened with pure honey" },
    { id: 6, name: "Plantain Bread", prices: [10, 20], image: "../brand_assets/Plantain Bread.png", desc: "A Ghanaian favorite, soft & hearty" }
];

// --- STOCK AVAILABILITY ---
let stockMap = {}; // { "Banana Bread": 50, "Coconut Bread": 0, ... }

async function fetchStockLevels() {
    try {
        const response = await fetch(N8N_INVENTORY_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) return;
        let raw = await response.json();
        let inventory = Array.isArray(raw) ? raw : (raw.data || raw.items || [raw]);
        stockMap = {};
        inventory.forEach(item => {
            const name = item['Product Name'] || item.product_name || '';
            const qty = parseInt(item.Quantity || item.quantity || 0);
            if (name) stockMap[name] = qty;
        });
        updateProductCardsStock();
    } catch (e) {
        console.error('Stock fetch error:', e);
    }
}

function updateProductCardsStock() {
    products.forEach(product => {
        const card = document.getElementById('product-card-' + product.id);
        if (!card) return;
        const stock = stockMap[product.name];
        const btn = card.querySelector('.add-to-cart-btn');
        const badge = card.querySelector('.stock-badge');

        if (stock !== undefined && stock === 0) {
            if (btn) {
                btn.disabled = true;
                btn.classList.remove('bg-maroon-800');
                btn.classList.add('bg-gray-300', 'cursor-not-allowed');
                btn.innerHTML = '<i class="fa-solid fa-ban"></i> Sold Out';
            }
            if (badge) {
                badge.textContent = 'Out of Stock';
                badge.className = 'stock-badge absolute top-3 right-3 z-10 inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white';
            }
        } else if (stock !== undefined && stock < 5) {
            if (badge) {
                badge.textContent = 'Low Stock';
                badge.className = 'stock-badge absolute top-3 right-3 z-10 inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-amber-400 text-white';
            }
        } else if (stock !== undefined) {
            if (badge) {
                badge.textContent = '';
                badge.className = 'stock-badge hidden';
            }
        }
    });
}

// --- CART LOGIC ---
let cart = JSON.parse(localStorage.getItem('bakeryCart')) || [];

function saveCart() {
    localStorage.setItem('bakeryCart', JSON.stringify(cart));
    updateCartUI();
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Check stock availability
    const stock = stockMap[product.name];
    if (stock !== undefined && stock === 0) {
        showToast(`${product.name} is out of stock.`);
        return;
    }

    // Get selected price from the product card's price selector
    const priceSelect = document.getElementById('price-select-' + productId);
    const selectedPrice = priceSelect ? parseFloat(priceSelect.value) : product.prices[0];

    // Use a unique cart key combining product id and price
    const cartKey = productId + '-' + selectedPrice;
    const existingItem = cart.find(item => item.cartKey === cartKey);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, price: selectedPrice, cartKey, quantity: 1 });
    }
    saveCart();

    showToast(`${product.name} (GH₵ ${selectedPrice.toFixed(2)}) added to cart!`);
}

function removeFromCart(cartKey) {
    cart = cart.filter(item => (item.cartKey || item.id) !== cartKey);
    saveCart();
}

function updateCartUI() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.querySelector('#cart-total');

    if (cartItemsContainer && cartTotalElement) {
        cartItemsContainer.innerHTML = '';
        let totalPrice = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-center text-gray-400 mt-12">Your cart is empty.</p>';
        } else {
            cart.forEach(item => {
                totalPrice += item.price * item.quantity;
                const div = document.createElement('div');
                div.className = 'flex items-center gap-4 p-3 bg-cream-50 rounded-xl';
                div.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="w-14 h-14 object-cover rounded-lg">
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-semibold text-gray-800 truncate">${item.name}</h4>
                        <p class="text-xs text-gray-500">GH₵ ${item.price.toFixed(2)} × ${item.quantity}</p>
                    </div>
                    <button class="remove-item text-gray-400 p-1" onclick="removeFromCart('${item.cartKey || item.id}')" aria-label="Remove item">
                        <i class="fa-solid fa-trash-can text-sm"></i>
                    </button>
                `;
                cartItemsContainer.appendChild(div);
            });
        }
        cartTotalElement.textContent = `GH₵ ${totalPrice.toFixed(2)}`;
    }
}

// --- TOAST NOTIFICATION ---
function showToast(message) {
    // Remove existing toast
    const existing = document.getElementById('toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);
        background: #6B1D2A; color: white; padding: 12px 24px; border-radius: 12px;
        font-family: Inter, sans-serif; font-size: 14px; font-weight: 500;
        box-shadow: 0 4px 16px rgba(107,29,42,0.25); z-index: 9999;
        opacity: 0; transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
    `;
    toast.innerHTML = `<i class="fa-solid fa-check-circle" style="margin-right:8px; color:#D4A017;"></i>${message}`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// --- CHECKOUT ---
async function checkout() {
    if (cart.length === 0) {
        showToast("Your cart is empty!");
        return;
    }

    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('customer-phone');
    const emailInput = document.getElementById('customer-email');
    const paymentInput = document.getElementById('payment-method');

    const customerName = nameInput ? nameInput.value.trim() : "";
    const customerPhone = phoneInput ? phoneInput.value.trim() : "";
    const customerEmail = emailInput ? emailInput.value.trim() : "";
    const paymentMethod = paymentInput ? paymentInput.value : "";

    if (!customerName || !customerPhone || !customerEmail || !paymentMethod) {
        showToast("Please fill in your Name, Phone, Email, and Payment Method.");
        return;
    }

    const checkoutBtn = document.querySelector('.checkout-btn');
    const originalText = checkoutBtn.innerHTML;

    checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Processing...';
    checkoutBtn.disabled = true;

    const orderData = {
        customer_id: customerName,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        payment_type: paymentMethod,
        items: cart,
        total_price: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        date: new Date().toISOString()
    };

    try {
        const response = await fetch(N8N_ORDER_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            if (nameInput) nameInput.value = "";
            if (phoneInput) phoneInput.value = "";
            if (emailInput) emailInput.value = "";
            if (paymentInput) paymentInput.value = "";

            cart = [];
            saveCart();

            document.getElementById('cart-overlay').classList.remove('open');

            const successOverlay = document.getElementById('success-overlay');
            if (successOverlay) {
                successOverlay.classList.add('active');
            } else {
                showToast("Order completed! You will be called shortly.");
            }
        } else {
            showToast("Error connecting to server. Please try again.");
        }
    } catch (error) {
        console.error("n8n Connection Error:", error);
        showToast("Could not connect to the Bakery System.");
    } finally {
        checkoutBtn.innerHTML = originalText;
        checkoutBtn.disabled = false;
    }
}

function closeSuccessModal() {
    document.getElementById('success-overlay').classList.remove('active');
}

// --- ADMIN DASHBOARD LOGIC ---
let dashboardOrders = []; // cached for search filtering

async function loadAdminData() {
    const orderTableBody = document.getElementById('order-rows');
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = refreshBtn ? refreshBtn.querySelector('i') : null;

    if (!orderTableBody) return;

    orderTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#94a3b8;">Connecting to n8n...</td></tr>';
    if (refreshBtn) refreshBtn.disabled = true;
    if (refreshIcon) refreshIcon.classList.add('fa-spin');

    try {
        // Fetch orders and inventory in parallel
        const [orderResponse, inventoryResponse] = await Promise.all([
            fetch(N8N_ADMIN_DATA_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' } }),
            fetch(N8N_INVENTORY_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' } }).catch(() => null)
        ]);

        if (!orderResponse.ok) throw new Error(`HTTP error! status: ${orderResponse.status}`);

        let allOrders = await orderResponse.json();
        if (!Array.isArray(allOrders)) allOrders = [allOrders];

        // Filter to today's orders only
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = allOrders.filter(o => {
            const orderDate = (o.Date || o.date || '').split('T')[0];
            return orderDate === today;
        });

        dashboardOrders = todayOrders;

        // Calculate today's stats (only Ready orders count toward revenue)
        let totalRevenue = 0;
        let pendingCount = 0;
        let completedCount = 0;
        todayOrders.forEach(o => {
            const status = (o.Status || 'Pending');
            if (status === 'Pending') pendingCount++;
            if (status === 'Ready') {
                totalRevenue += parseFloat(o['Total Price'] || o.total_price || 0);
                completedCount++;
            }
        });

        // Update order count stat
        const orderCountEl = document.getElementById('stat-orders-today');
        const orderSubEl = document.getElementById('stat-orders-sub');
        if (orderCountEl) orderCountEl.textContent = todayOrders.length;
        if (orderSubEl) {
            if (pendingCount > 0) {
                orderSubEl.innerHTML = `<i class="fa-solid fa-clock text-xs mr-1"></i>${pendingCount} pending`;
                orderSubEl.className = 'text-amber-500 text-sm font-medium mt-1 font-body';
            } else if (todayOrders.length > 0) {
                orderSubEl.innerHTML = `<i class="fa-solid fa-check text-xs mr-1"></i>All processed`;
                orderSubEl.className = 'text-emerald-500 text-sm font-medium mt-1 font-body';
            } else {
                orderSubEl.textContent = 'No orders yet today';
                orderSubEl.className = 'text-gray-400 text-sm font-medium mt-1 font-body';
            }
        }

        // Update revenue stat
        const revenueEl = document.getElementById('stat-revenue');
        const revenueSubEl = document.getElementById('stat-revenue-sub');
        if (revenueEl) revenueEl.textContent = `GH₵ ${totalRevenue.toFixed(2)}`;
        if (revenueSubEl) {
            if (completedCount > 0) {
                const avg = totalRevenue / completedCount;
                revenueSubEl.innerHTML = `<i class="fa-solid fa-receipt text-xs mr-1"></i>From ${completedCount} completed order${completedCount !== 1 ? 's' : ''}`;
                revenueSubEl.className = 'text-emerald-500 text-sm font-medium mt-1 font-body';
            } else {
                revenueSubEl.textContent = 'No completed orders yet';
                revenueSubEl.className = 'text-gray-400 text-sm font-medium mt-1 font-body';
            }
        }

        // Update low stock stat from inventory data
        const lowStockEl = document.getElementById('stat-low-stock');
        const lowStockSubEl = document.getElementById('stat-low-stock-sub');
        if (inventoryResponse && inventoryResponse.ok) {
            let raw = await inventoryResponse.json();
            let inventory = Array.isArray(raw) ? raw : (raw.data || raw.items || [raw]);
            let lowStockCount = 0;
            let outOfStockCount = 0;
            inventory.forEach(item => {
                const qty = parseInt(item.Quantity || item.quantity || 0);
                if (qty === 0) outOfStockCount++;
                else if (qty < 5) lowStockCount++;
            });
            const alertCount = lowStockCount + outOfStockCount;
            if (lowStockEl) lowStockEl.textContent = alertCount;
            if (lowStockSubEl) {
                if (outOfStockCount > 0) {
                    lowStockSubEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-xs mr-1"></i>${outOfStockCount} out of stock`;
                    lowStockSubEl.className = 'text-red-500 text-sm font-medium mt-1 font-body';
                } else if (lowStockCount > 0) {
                    lowStockSubEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-xs mr-1"></i>Items need restocking`;
                    lowStockSubEl.className = 'text-amber-500 text-sm font-medium mt-1 font-body';
                } else {
                    lowStockSubEl.innerHTML = `<i class="fa-solid fa-check text-xs mr-1"></i>All products well stocked`;
                    lowStockSubEl.className = 'text-emerald-500 text-sm font-medium mt-1 font-body';
                }
            }
        } else {
            if (lowStockEl) lowStockEl.textContent = '—';
            if (lowStockSubEl) {
                lowStockSubEl.textContent = 'Could not load inventory';
                lowStockSubEl.className = 'text-gray-400 text-sm font-medium mt-1 font-body';
            }
        }

        renderDashboardOrders(todayOrders);
    } catch (error) {
        console.error("n8n Load Error:", error);
        orderTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color:#ef4444;">Error: ${error.message}</td></tr>`;
    } finally {
        if (refreshBtn) refreshBtn.disabled = false;
        if (refreshIcon) refreshIcon.classList.remove('fa-spin');
    }
}

function renderDashboardOrders(orders) {
    const orderTableBody = document.getElementById('order-rows');
    if (!orderTableBody) return;

    if (orders.length === 0) {
        orderTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#94a3b8;">No orders for today.</td></tr>';
    } else {
        // ⚡ Bolt: Accumulate HTML in a string rather than updating innerHTML in a loop
        // This avoids O(N^2) parsing/rendering overhead for long lists of orders
        let rowsHtml = '';
        orders.forEach(order => {
            const rowNum = order.row_number || order.id;
            const customerName = order.Name || order['Customer Name'] || order.customer || 'Guest';
            const orderItems = order['Product Name'] || order.items || 'Unknown Items';
            const currentStatus = order.Status || 'Pending';

            const statusOptions = ['Pending', 'Ready', 'Cancelled'];
            let optionsHtml = '';
            statusOptions.forEach(opt => {
                const isSelected = (opt === currentStatus) ? 'selected' : '';
                optionsHtml += `<option value="${opt}" ${isSelected}>${opt}</option>`;
            });

            const row = `
                <tr class="hover:bg-cream-50/50 transition-colors">
                    <td class="px-6 py-4 text-sm font-medium text-gold-600">#${rowNum}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">${customerName}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${orderItems}</td>
                    <td class="px-6 py-4">
                        <select onchange="updateOrderStatus('${rowNum}', this.value)"
                                class="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-400/30">
                            ${optionsHtml}
                        </select>
                    </td>
                    <td class="px-6 py-4">
                        <i class="fa-regular fa-eye text-gray-400 hover:text-maroon-800 cursor-pointer transition-colors" title="View Details"></i>
                    </td>
                </tr>`;
            rowsHtml += row;
        });
        orderTableBody.innerHTML = rowsHtml;
    }
}

function filterDashboardOrders(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
        renderDashboardOrders(dashboardOrders);
        return;
    }
    const filtered = dashboardOrders.filter(o => {
        const name = (o.Name || o['Customer Name'] || o.customer || '').toLowerCase();
        const items = (o['Product Name'] || o.items || '').toLowerCase();
        return name.includes(q) || items.includes(q);
    });
    renderDashboardOrders(filtered);
}

// Update Order Status
async function updateOrderStatus(rowNumber, newStatus) {
    const originalTitle = document.title;
    document.title = "Updating...";

    try {
        const response = await fetch(N8N_UPDATE_STATUS_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                row_number: rowNumber,
                status: newStatus
            })
        });

        if (response.ok) {
            console.log("Status updated successfully");
        } else {
            alert("Failed to update status on server.");
        }
    } catch (error) {
        console.error("Update Error:", error);
        alert("Could not connect to update server.");
    } finally {
        document.title = originalTitle;
    }
}

// --- CONTACT FORM LOGIC ---
async function handleContactSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const message = document.getElementById('contact-message').value;
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Sending...';
    btn.disabled = true;

    try {
        const response = await fetch(N8N_CONTACT_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                email: email,
                message: message,
                date: new Date().toISOString()
            })
        });

        if (response.ok) {
            showToast("Message sent! We'll get back to you shortly.");
            document.getElementById('contact-form').reset();
        } else {
            showToast("Something went wrong. Please try again.");
        }
    } catch (error) {
        console.error("Contact Error:", error);
        showToast("Could not connect to the server.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- ORDER MANAGEMENT PAGE LOGIC ---
let allOrders = []; // cached orders for filtering
let filteredOrdersByDate = []; // filtered by date, for search

async function loadOrdersByDate() {
    const dateInput = document.getElementById('order-date-picker');
    const tableBody = document.getElementById('orders-table-body');
    const loadBtn = document.getElementById('load-orders-btn');
    if (!tableBody) return;

    const selectedDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];

    tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-12 text-gray-400 text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Loading orders...</td></tr>';
    if (loadBtn) loadBtn.disabled = true;

    try {
        const response = await fetch(N8N_ADMIN_DATA_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        let orders = await response.json();
        if (!Array.isArray(orders)) orders = [orders];
        allOrders = orders;

        // Filter by selected date
        const filtered = orders.filter(o => {
            const orderDate = (o.Date || o.date || '').split('T')[0];
            return orderDate === selectedDate;
        });

        filteredOrdersByDate = filtered;
        updateOrderSummary(filtered);
        renderOrdersTable(filtered);
    } catch (error) {
        console.error("Load orders error:", error);
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-12 text-red-500 text-sm">Error: ${error.message}</td></tr>`;
    } finally {
        if (loadBtn) loadBtn.disabled = false;
    }
}

function updateOrderSummary(orders) {
    const countEl = document.getElementById('summary-order-count');
    const revenueEl = document.getElementById('summary-revenue');
    const pendingEl = document.getElementById('summary-pending');

    let totalRevenue = 0;
    let pendingCount = 0;
    orders.forEach(o => {
        const status = (o.Status || 'Pending');
        if (status === 'Ready') {
            totalRevenue += parseFloat(o['Total Price'] || o.total_price || 0);
        }
        if (status === 'Pending') pendingCount++;
    });

    if (countEl) countEl.textContent = orders.length;
    if (revenueEl) revenueEl.textContent = `GH₵ ${totalRevenue.toFixed(2)}`;
    if (pendingEl) pendingEl.textContent = pendingCount;
}

function renderOrdersTable(orders) {
    const tableBody = document.getElementById('orders-table-body');
    if (!tableBody) return;

    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-12 text-gray-400 text-sm">No orders found.</td></tr>';
        return;
    }

    // ⚡ Bolt: Accumulate HTML in a string rather than updating innerHTML in a loop
    // This avoids O(N^2) parsing/rendering overhead for long lists of orders
    let rowsHtml = '';
    orders.forEach(order => {
        const rowNum = order.row_number || order.id || '—';
        const name = order.Name || order['Customer Name'] || order.customer_name || 'Guest';
        const phone = order['Phone Number'] || order.Phone || order['Customer Phone'] || order.customer_phone || '—';
        const items = order['Product Name'] || order.items || '—';
        const total = order['Total Price'] || order.total_price || '—';
        const payment = order['Payment Type'] || order.payment_type || '—';
        const status = order.Status || 'Pending';
        const dateStr = order.Date || order.date || '';
        const time = dateStr ? new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';

        const statusOptions = ['Pending', 'Ready', 'Cancelled'];
        let optionsHtml = statusOptions.map(opt =>
            `<option value="${opt}" ${opt === status ? 'selected' : ''}>${opt}</option>`
        ).join('');

        rowsHtml += `
            <tr class="hover:bg-cream-50/50 transition-colors">
                <td class="px-6 py-4 text-sm font-medium" style="color:#b8860b">#${rowNum}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${name}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${phone}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${items}</td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-700">GH₵ ${parseFloat(total).toFixed(2)}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${payment}</td>
                <td class="px-6 py-4">
                    <select onchange="updateOrderStatus('${rowNum}', this.value)"
                            class="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-400/30">
                        ${optionsHtml}
                    </select>
                </td>
                <td class="px-6 py-4 text-sm text-gray-400">${time}</td>
            </tr>`;
    });
    tableBody.innerHTML = rowsHtml;
}

function filterOrdersBySearch(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
        renderOrdersTable(filteredOrdersByDate);
        return;
    }
    const filtered = filteredOrdersByDate.filter(o => {
        const name = (o.Name || o['Customer Name'] || o.customer_name || '').toLowerCase();
        const items = (o['Product Name'] || o.items || '').toLowerCase();
        const phone = (o['Phone Number'] || o.Phone || '').toLowerCase();
        return name.includes(q) || items.includes(q) || phone.includes(q);
    });
    renderOrdersTable(filtered);
}

// --- INVENTORY PAGE LOGIC ---
let editingProduct = null;

async function loadInventory() {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-12 text-gray-400 text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Loading inventory...</td></tr>';

    if (!N8N_INVENTORY_WEBHOOK) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-12 text-amber-500 text-sm"><i class="fa-solid fa-triangle-exclamation mr-2"></i> Inventory webhook not configured yet. Please set up the n8n inventory workflow.</td></tr>';
        return;
    }

    try {
        const response = await fetch(N8N_INVENTORY_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        let raw = await response.json();

        // Handle various response formats from n8n respondToWebhook
        let inventory = [];
        if (Array.isArray(raw)) {
            inventory = raw;
        } else if (raw && typeof raw === 'object') {
            // n8n might wrap in {data: [...]}, or return a single object
            if (Array.isArray(raw.data)) {
                inventory = raw.data;
            } else if (Array.isArray(raw.items)) {
                inventory = raw.items;
            } else {
                inventory = [raw];
            }
        }

        if (inventory.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-12 text-gray-400 text-sm">No inventory data found.</td></tr>';
            return;
        }

        // ⚡ Bolt: Accumulate HTML in a string rather than updating innerHTML in a loop
        // This avoids O(N^2) parsing/rendering overhead for long lists of inventory items
        let rowsHtml = '';
        inventory.forEach(item => {
            const name = item['Product Name'] || item.product_name || '—';
            const qty = parseInt(item.Quantity || item.quantity || 0);
            const lastUpdated = item['Last Updated'] || item.last_updated || '—';
            const escapedName = name.replace(/'/g, "\\'");

            let statusBadge;
            if (qty === 0) {
                statusBadge = '<span class="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Out of Stock</span>';
            } else if (qty < 5) {
                statusBadge = '<span class="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Low Stock</span>';
            } else {
                statusBadge = '<span class="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">In Stock</span>';
            }

            rowsHtml += `
                <tr class="hover:bg-cream-50/50 transition-colors">
                    <td class="px-6 py-4 text-sm font-medium text-gray-800">${name}</td>
                    <td class="px-6 py-4 text-sm font-bold text-maroon-800">${qty}</td>
                    <td class="px-6 py-4">${statusBadge}</td>
                    <td class="px-6 py-4 text-sm text-gray-400">${lastUpdated}</td>
                    <td class="px-6 py-4">
                        <button onclick="openStockModal('${escapedName}', ${qty})" class="text-sm text-gold-600 hover:text-maroon-800 font-semibold transition-colors">
                            <i class="fa-solid fa-pen-to-square mr-1"></i> Edit
                        </button>
                    </td>
                </tr>`;
        });
        tableBody.innerHTML = rowsHtml;
    } catch (error) {
        console.error("Inventory load error:", error);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-12 text-red-500 text-sm">Error: ${error.message}</td></tr>`;
    }
}

function openStockModal(productName, currentQty) {
    editingProduct = productName;
    const modal = document.getElementById('stock-modal');
    const nameEl = document.getElementById('stock-modal-product');
    const qtyEl = document.getElementById('stock-modal-quantity');
    if (nameEl) nameEl.textContent = productName;
    if (qtyEl) qtyEl.value = currentQty;
    if (modal) modal.classList.add('active');
}

function closeStockModal() {
    const modal = document.getElementById('stock-modal');
    if (modal) modal.classList.remove('active');
    editingProduct = null;
}

async function saveStockUpdate() {
    const qtyEl = document.getElementById('stock-modal-quantity');
    const newQty = parseInt(qtyEl.value);
    if (isNaN(newQty) || newQty < 0) { alert("Please enter a valid quantity."); return; }
    if (!editingProduct) return;

    if (!N8N_INVENTORY_UPDATE_WEBHOOK) {
        alert("Inventory update webhook not configured.");
        return;
    }

    try {
        const response = await fetch(N8N_INVENTORY_UPDATE_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_name: editingProduct,
                quantity: newQty,
                last_updated: new Date().toISOString()
            })
        });
        if (response.ok) {
            closeStockModal();
            loadInventory();
        } else {
            alert("Failed to update stock.");
        }
    } catch (error) {
        console.error("Stock update error:", error);
        alert("Could not connect to server.");
    }
}

// --- SALES REPORTS PAGE LOGIC ---
let salesChart = null;
let salesData = [];
let currentPeriod = 'daily';

async function loadSalesData() {
    const chartLoading = document.getElementById('chart-loading');
    const chartCanvas = document.getElementById('sales-chart');
    if (!chartCanvas) return;

    if (chartLoading) chartLoading.style.display = 'block';
    chartCanvas.style.display = 'none';

    try {
        const response = await fetch(N8N_ADMIN_DATA_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        let orders = await response.json();
        if (!Array.isArray(orders)) orders = [orders];
        salesData = orders;

        if (chartLoading) chartLoading.style.display = 'none';
        chartCanvas.style.display = 'block';
        renderSalesChart(currentPeriod);
    } catch (error) {
        console.error("Sales data error:", error);
        if (chartLoading) chartLoading.style.display = 'none';
        chartCanvas.style.display = 'block';
    }
}

function switchReportTab(period) {
    currentPeriod = period;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });
    if (salesData.length > 0) renderSalesChart(period);
}

function renderSalesChart(period) {
    // Replace the canvas element entirely to prevent stale Chart.js state
    const oldCanvas = document.getElementById('sales-chart');
    if (!oldCanvas) return;

    if (salesChart) {
        salesChart.destroy();
        salesChart = null;
    }

    const parent = oldCanvas.parentNode;
    oldCanvas.remove();
    const newCanvas = document.createElement('canvas');
    newCanvas.id = 'sales-chart';
    parent.appendChild(newCanvas);

    const ctx = newCanvas.getContext('2d');

    // Aggregate data by period (no date filtering — show ALL data)
    const aggregated = aggregateByPeriod(salesData, period);

    // Update summary cards with period totals
    const totalRevenue = aggregated.revenues.reduce((s, v) => s + v, 0);
    const totalOrders = aggregated.orderCounts.reduce((s, v) => s + v, 0);
    const avgOrder = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    const revenueEl = document.getElementById('report-revenue');
    const ordersEl = document.getElementById('report-orders');
    const avgEl = document.getElementById('report-avg');
    const topEl = document.getElementById('report-top-product');

    if (revenueEl) revenueEl.textContent = `GH₵ ${totalRevenue.toFixed(2)}`;
    if (ordersEl) ordersEl.textContent = totalOrders;
    if (avgEl) avgEl.textContent = `GH₵ ${avgOrder.toFixed(2)}`;

    // Find top product across all data (exclude cancelled orders)
    const productMap = {};
    salesData.filter(o => (o.Status || 'Pending') !== 'Cancelled').forEach(o => {
        const name = o['Product Name'] || o.items || '';
        name.split(', ').forEach(p => {
            const t = p.trim();
            if (t) productMap[t] = (productMap[t] || 0) + 1;
        });
    });
    const topProduct = Object.entries(productMap).sort((a, b) => b[1] - a[1])[0];
    if (topEl) topEl.textContent = topProduct ? topProduct[0] : '—';

    const hasData = aggregated.labels.length > 0;
    const isMobile = window.innerWidth < 768;

    salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hasData ? aggregated.labels : ['No data'],
            datasets: [
                {
                    label: 'Revenue (GH₵)',
                    data: hasData ? aggregated.revenues : [0],
                    backgroundColor: 'rgba(107, 29, 42, 0.75)',
                    hoverBackgroundColor: 'rgba(107, 29, 42, 0.95)',
                    borderRadius: isMobile ? 4 : 8,
                    borderSkipped: false,
                    order: 2,
                    yAxisID: 'y',
                    barPercentage: isMobile ? 0.8 : 0.6,
                    categoryPercentage: isMobile ? 0.85 : 0.7
                },
                {
                    label: 'Orders',
                    data: hasData ? aggregated.orderCounts : [0],
                    type: 'line',
                    borderColor: '#D4A017',
                    borderWidth: isMobile ? 2 : 3,
                    backgroundColor: 'rgba(212, 160, 23, 0.08)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#D4A017',
                    pointBorderColor: '#fff',
                    pointBorderWidth: isMobile ? 1 : 2,
                    pointRadius: isMobile ? 3 : 5,
                    pointHoverRadius: isMobile ? 5 : 7,
                    order: 1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: !isMobile,
            aspectRatio: isMobile ? undefined : 2.5,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: isMobile ? 'bottom' : 'top',
                    align: isMobile ? 'center' : 'end',
                    labels: {
                        font: { family: 'Inter', size: isMobile ? 11 : 13, weight: '500' },
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: isMobile ? 12 : 24,
                        color: '#6B1D2A',
                        boxWidth: isMobile ? 8 : 12
                    }
                },
                tooltip: {
                    backgroundColor: '#3a0a14',
                    titleFont: { family: 'Inter', size: isMobile ? 11 : 13, weight: '600' },
                    bodyFont: { family: 'Inter', size: isMobile ? 10 : 12 },
                    padding: isMobile ? 8 : 14,
                    cornerRadius: 10,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.label === 'Revenue (GH₵)') {
                                return '  Revenue: GH₵ ' + context.parsed.y.toFixed(2);
                            }
                            return '  Orders: ' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear', position: 'left',
                    beginAtZero: true,
                    title: { display: !isMobile, text: 'Revenue (GH₵)', font: { family: 'Inter', size: 12, weight: '600' }, color: '#6B1D2A' },
                    grid: { color: 'rgba(107, 29, 42, 0.06)', drawBorder: false },
                    ticks: {
                        font: { family: 'Inter', size: isMobile ? 9 : 11 },
                        color: '#999',
                        callback: function(value) { return isMobile ? '₵' + value : 'GH₵ ' + value; },
                        padding: isMobile ? 4 : 8,
                        maxTicksLimit: isMobile ? 5 : 8
                    },
                    border: { display: false }
                },
                y1: {
                    type: 'linear', position: 'right',
                    beginAtZero: true,
                    title: { display: !isMobile, text: 'Orders', font: { family: 'Inter', size: 12, weight: '600' }, color: '#D4A017' },
                    grid: { drawOnChartArea: false, drawBorder: false },
                    ticks: {
                        font: { family: 'Inter', size: isMobile ? 9 : 11 },
                        color: '#999',
                        stepSize: 1,
                        padding: isMobile ? 4 : 8,
                        maxTicksLimit: isMobile ? 5 : 8
                    },
                    border: { display: false }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: {
                        font: { family: 'Inter', size: isMobile ? 8 : 11 },
                        color: '#666',
                        maxRotation: isMobile ? 60 : 45,
                        autoSkip: true,
                        maxTicksLimit: isMobile ? 7 : (period === 'daily' ? 15 : 20),
                        padding: isMobile ? 4 : 8
                    },
                    border: { display: false }
                }
            }
        }
    });

    // Set explicit height for mobile
    if (isMobile) {
        newCanvas.style.height = '280px';
    }
}

function aggregateByPeriod(orders, period) {
    const map = {};
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    orders.forEach(o => {
        const dateStr = o.Date || o.date || '';
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        let key, sortKey;

        if (period === 'daily') {
            key = d.toISOString().split('T')[0];
            sortKey = key;
        } else if (period === 'weekly') {
            // Get Monday of the week
            const day = d.getDay();
            const mondayOffset = day === 0 ? -6 : 1 - day;
            const monday = new Date(d);
            monday.setDate(d.getDate() + mondayOffset);
            sortKey = monday.toISOString().split('T')[0];
            const sundayDate = new Date(monday);
            sundayDate.setDate(monday.getDate() + 6);
            key = monday.getDate() + ' ' + monthNames[monday.getMonth()] + ' – ' + sundayDate.getDate() + ' ' + monthNames[sundayDate.getMonth()];
        } else if (period === 'monthly') {
            sortKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            key = monthNames[d.getMonth()] + ' ' + d.getFullYear();
        } else {
            // yearly
            sortKey = String(d.getFullYear());
            key = String(d.getFullYear());
        }

        if (!map[sortKey]) map[sortKey] = { label: key, revenue: 0, count: 0 };
        const status = (o.Status || 'Pending');
        if (status === 'Ready') {
            map[sortKey].revenue += parseFloat(o['Total Price'] || o.total_price || 0);
        }
        if (status !== 'Cancelled') {
            map[sortKey].count += 1;
        }
    });

    const sortedKeys = Object.keys(map).sort();

    return {
        labels: sortedKeys.map(k => map[k].label),
        revenues: sortedKeys.map(k => parseFloat(map[k].revenue.toFixed(2))),
        orderCounts: sortedKeys.map(k => map[k].count)
    };
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);

    // --- Admin Dashboard page ---
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadAdminData);
        // Wire up dashboard search
        const dashSearch = document.getElementById('dashboard-search');
        if (dashSearch) {
            let debounceTimer;
            dashSearch.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => filterDashboardOrders(e.target.value), 200);
            });
            dashSearch.addEventListener('keyup', (e) => {
                if (e.key === 'Escape') { dashSearch.value = ''; filterDashboardOrders(''); }
            });
        }
        loadAdminData();
        return;
    }

    // --- Order Management page ---
    const loadOrdersBtn = document.getElementById('load-orders-btn');
    if (loadOrdersBtn) {
        const datePicker = document.getElementById('order-date-picker');
        if (datePicker) datePicker.value = new Date().toISOString().split('T')[0];
        loadOrdersBtn.addEventListener('click', loadOrdersByDate);
        // Wire up order search
        const orderSearch = document.getElementById('order-search');
        if (orderSearch) {
            let debounceTimer;
            orderSearch.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => filterOrdersBySearch(e.target.value), 200);
            });
            orderSearch.addEventListener('keyup', (e) => {
                if (e.key === 'Escape') { orderSearch.value = ''; filterOrdersBySearch(''); }
            });
        }
        loadOrdersByDate();
        return;
    }

    // --- Inventory page ---
    const refreshInventoryBtn = document.getElementById('refresh-inventory-btn');
    if (refreshInventoryBtn) {
        refreshInventoryBtn.addEventListener('click', loadInventory);
        loadInventory();
        return;
    }

    // --- Sales Reports page ---
    const salesChartEl = document.getElementById('sales-chart');
    if (salesChartEl) {
        loadSalesData();
        return;
    }

    // --- Customer page logic ---
    updateCartUI();

    // Render product cards
    const productContainer = document.getElementById('product-list');
    if (productContainer) {
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.id = 'product-card-' + product.id;
            card.innerHTML = `
                <div class="bg-white rounded-2xl overflow-hidden card-shadow">
                    <div class="relative overflow-hidden">
                        <img src="${product.image}" alt="${product.name}" class="w-full h-60 object-cover">
                        <div class="absolute inset-0 bg-gradient-to-t from-maroon-900/50 to-transparent"></div>
                        <div class="absolute inset-0 bg-maroon-800/10 mix-blend-multiply"></div>
                        <span class="stock-badge hidden"></span>
                    </div>
                    <div class="p-6">
                        <h3 class="text-lg font-bold text-maroon-800 mb-1">${product.name}</h3>
                        <p class="text-gray-400 text-sm mb-4">${product.desc}</p>
                        <div class="flex items-center justify-between">
                            <select id="price-select-${product.id}"
                                    class="text-lg font-bold text-gold-600 bg-transparent border border-gold-300 rounded-lg px-3 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-400"
                                    style="color: #B8860B; border-color: #D4A017;">
                                ${product.prices.map(p => `<option value="${p}">GH₵ ${p.toFixed(2)}</option>`).join('')}
                            </select>
                            <button onclick="addToCart(${product.id})"
                                    class="add-to-cart-btn btn-maroon bg-maroon-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                                <i class="fa-solid fa-cart-plus"></i> Add
                            </button>
                        </div>
                    </div>
                </div>
            `;
            productContainer.appendChild(card);
        });

        // Fetch stock levels to update badges
        fetchStockLevels();
    }

    // Cart listeners
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);

    const cartOpenBtn = document.getElementById('cart-open-btn');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart');

    if (cartOpenBtn && cartOverlay && closeCartBtn) {
        cartOpenBtn.addEventListener('click', () => cartOverlay.classList.add('open'));
        closeCartBtn.addEventListener('click', () => cartOverlay.classList.remove('open'));
        cartOverlay.addEventListener('click', (e) => {
            if (e.target === cartOverlay) cartOverlay.classList.remove('open');
        });
    }

    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon && cartOverlay) {
        cartIcon.addEventListener('click', () => cartOverlay.classList.add('open'));
    }
});
