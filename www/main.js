import { DBService } from './db.js';

let currency = 'UGX';

document.addEventListener('DOMContentLoaded', async () => {
    await DBService.init();
    const settings = await DBService.query("SELECT * FROM settings WHERE id=1");
    currency = settings.values[0].currency;
    document.getElementById('h-bizname').innerText = settings.values[0].biz_name;
    
    updateDashboard();
    initClock();
});

// NAVIGATION
window.showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    
    if(pageId === 'inventory') renderInventory();
    if(pageId === 'sales-add') populateProductSelect();
    if(pageId === 'dashboard') updateDashboard();
};

// INVENTORY LOGIC
window.saveProduct = async () => {
    const data = [
        document.getElementById('p-name').value,
        parseFloat(document.getElementById('p-price').value),
        parseFloat(document.getElementById('p-cost').value),
        parseInt(document.getElementById('p-stock').value),
        parseInt(document.getElementById('p-alert').value)
    ];

    await DBService.run(
        "INSERT INTO products (name, price, cost, stock, low_stock_alert) VALUES (?,?,?,?,?)",
        data
    );
    alert("Product Saved");
    showPage('inventory');
};

async function renderInventory() {
    const res = await DBService.query("SELECT * FROM products ORDER BY name ASC");
    const list = document.getElementById('inventory-list');
    list.innerHTML = res.values.map(p => `
        <div class="card">
            <div style="display:flex; justify-content:space-between;">
                <strong>${p.name}</strong>
                <span style="color:${p.stock <= p.low_stock_alert ? 'var(--danger)' : 'var(--success)'}">
                    Qty: ${p.stock}
                </span>
            </div>
            <small>${currency} ${p.price}</small>
        </div>
    `).join('');
}

// SALES LOGIC
async function populateProductSelect() {
    const res = await DBService.query("SELECT id, name, price FROM products WHERE stock > 0");
    const select = document.getElementById('s-product-select');
    select.innerHTML = res.values.map(p => `<option value="${p.id}">${p.name} (${currency} ${p.price})</option>`).join('');
}

window.processSale = async () => {
    const pid = document.getElementById('s-product-select').value;
    const qty = parseInt(document.getElementById('s-qty').value);
    const customer = document.getElementById('s-customer').value || 'Cash Customer';

    const pRes = await DBService.query("SELECT * FROM products WHERE id=?", [pid]);
    const p = pRes.values[0];
    
    const total = p.price * qty;
    const cost = p.cost * qty;
    const profit = total - cost;

    await DBService.run(
        "INSERT INTO sales (id, item_id, qty, total, cost, profit, customer_name, status) VALUES (?,?,?,?,?,?,?,?)",
        [Date.now().toString(), pid, qty, total, cost, profit, customer, 'PAID']
    );
    await DBService.run("UPDATE products SET stock = stock - ? WHERE id = ?", [qty, pid]);
    
    alert("Sale Completed");
    showPage('dashboard');
};

async function updateDashboard() {
    const res = await DBService.query("SELECT SUM(total) as rev, SUM(profit) as prof FROM sales");
    document.getElementById('kpi-rev').innerText = (res.values[0].rev || 0).toLocaleString();
    document.getElementById('kpi-profit').innerText = (res.values[0].prof || 0).toLocaleString();
}

function initClock() {
    const update = () => {
        document.getElementById('current-date').innerText = new Date().toLocaleDateString();
    };
    update();
}
