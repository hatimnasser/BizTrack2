import { DBService } from './db.js';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log("Initializing Database...");
        await DBService.init();
        
        // Setup UI
        await renderDashboard();
        await populateProductSelect();
        
        console.log("Engine Online");
    } catch (err) {
        console.error("CRITICAL ERROR:", err);
        alert("Database Error: " + err.message);
    }
});

// --- NAVIGATION (Fixes Unresponsive Tabs) ---
const showPage = (pageId) => {
    console.log("Navigating to:", pageId);
    // Hide all
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    // Show target
    const target = document.getElementById(`page-${pageId}`);
    if (target) {
        target.style.display = 'block';
    } else {
        console.error("Page ID not found:", pageId);
    }

    // Tab Bar Highlight
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.outerHTML.includes(pageId)) btn.classList.add('active');
    });

    // Refresh data based on page
    if (pageId === 'inventory') renderInventory();
    if (pageId === 'dashboard') renderDashboard();
};

// --- SALES LOGIC ---
const processSale = async () => {
    const pid = document.getElementById('s-product-select').value;
    const qty = parseInt(document.getElementById('s-qty').value);
    const customer = document.getElementById('s-customer').value || 'Cash Customer';
    const paidAmt = parseFloat(document.getElementById('s-paid').value) || 0;

    if (!pid || isNaN(qty)) return alert("Select product and quantity");

    try {
        const pRes = await DBService.query("SELECT * FROM products WHERE id=?", [pid]);
        const p = pRes.values[0];
        
        const total = p.price * qty;
        const cost = p.cost * qty;
        const profit = total - cost;
        const status = paidAmt < total ? 'PARTIAL' : 'PAID';

        await DBService.run(
            "INSERT INTO sales (id, item_id, qty, total, cost, profit, customer_name, status) VALUES (?,?,?,?,?,?,?,?)",
            [Date.now().toString(), pid, qty, total, cost, profit, customer, status]
        );
        
        await DBService.run("UPDATE products SET stock = stock - ? WHERE id = ?", [qty, pid]);
        
        alert("Sale Recorded!");
        showPage('dashboard');
    } catch (e) {
        alert("Sale Failed: " + e.message);
    }
};

// --- INVENTORY LOGIC ---
const saveProduct = async () => {
    const name = document.getElementById('p-name').value;
    const price = parseFloat(document.getElementById('p-price').value);
    const cost = parseFloat(document.getElementById('p-cost').value);
    const stock = parseInt(document.getElementById('p-stock').value);
    const alertAt = parseInt(document.getElementById('p-alert').value);

    if (!name || isNaN(price)) return alert("Missing Info");

    await DBService.run(
        "INSERT INTO products (name, price, cost, stock, low_stock_alert) VALUES (?,?,?,?,?)",
        [name, price, cost, stock, alertAt]
    );
    alert("Product Added");
    showPage('inventory');
};

// --- DATA RENDERING ---
async function renderDashboard() {
    const res = await DBService.query("SELECT SUM(total) as rev, SUM(profit) as prof FROM sales");
    const rev = res.values[0].rev || 0;
    const prof = res.values[0].prof || 0;
    
    document.getElementById('kpi-rev').innerText = rev.toLocaleString();
    document.getElementById('kpi-profit').innerText = prof.toLocaleString();
}

async function renderInventory() {
    const res = await DBService.query("SELECT * FROM products ORDER BY name ASC");
    const list = document.getElementById('inventory-list');
    list.innerHTML = res.values.map(p => `
        <div class="card" style="margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between;">
                <strong>${p.name}</strong>
                <span style="color:${p.stock <= p.low_stock_alert ? 'red' : 'green'}">Qty: ${p.stock}</span>
            </div>
        </div>
    `).join('');
}

async function populateProductSelect() {
    const res = await DBService.query("SELECT id, name FROM products");
    const select = document.getElementById('s-product-select');
    if (select) {
        select.innerHTML = res.values.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
}

// --- IMPORTANT: GLOBAL MAPPING (The "Bridge") ---
// This makes the functions visible to your HTML buttons
window.showPage = showPage;
window.processSale = processSale;
window.saveProduct = saveProduct;
