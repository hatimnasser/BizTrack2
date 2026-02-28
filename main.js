import { DBService } from './db.js';

// App State
let currencySymbol = 'UGX';

document.addEventListener('DOMContentLoaded', async () => {
    await DBService.init();
    await loadSettings();
    await renderDashboard();
});

async function loadSettings() {
    const res = await DBService.query("SELECT biz_name, currency FROM settings WHERE id = 1");
    if (res.values.length > 0) {
        document.getElementById('h-bizname').innerText = res.values[0].biz_name;
        currencySymbol = res.values[0].currency;
    }
}

async function renderDashboard() {
    // Replace array reduce methods with efficient SQLite aggregations
    const salesRes = await DBService.query("SELECT SUM(total) as revenue, SUM(profit) as profit FROM sales");
    const rev = salesRes.values[0].revenue || 0;
    const prof = salesRes.values[0].profit || 0;

    document.getElementById('kpi-rev').innerText = `${currencySymbol} ${rev.toLocaleString()}`;
    document.getElementById('kpi-profit').innerText = `${currencySymbol} ${prof.toLocaleString()}`;

    // Load recent sales
    const recentSales = await DBService.query("SELECT * FROM sales ORDER BY date DESC LIMIT 5");
    const listEl = document.getElementById('sales-list');
    
    listEl.innerHTML = recentSales.values.map(s => {
        // UTF-8 rendering handled automatically by DOM insertion + Meta charset
        const badge = s.status === 'OVERDUE' ? `<span class="badge-overdue">Overdue</span>` : '';
        return `
            <div style="background: white; padding: 12px; margin-bottom: 8px; border-radius: 8px;">
                <strong>${s.customer_name}</strong> - ${currencySymbol} ${s.total}
                <div style="float: right;">${badge}</div>
            </div>
        `;
    }).join('');
}

// Global scope mapping for UI buttons
window.showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`page-${pageId}`).classList.add('active');
    event.currentTarget.classList.add('active');
};
