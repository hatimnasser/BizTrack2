import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
const sqlite = new SQLiteConnection(CapacitorSQLite);
let db;

export const DBService = {
    async init() {
        // Use try-catch to identify exactly where it fails
        try {
            db = await sqlite.createConnection("biztrack_db", false, "no-encryption", 1, false);
            await db.open();
            
            await db.execute(`
                CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, biz_name TEXT, currency TEXT);
                CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price REAL, cost REAL, stock INTEGER, low_stock_alert INTEGER);
                CREATE TABLE IF NOT EXISTS sales (id TEXT PRIMARY KEY, item_id INTEGER, qty INTEGER, total REAL, cost REAL, profit REAL, customer_name TEXT, status TEXT, date DATETIME DEFAULT CURRENT_TIMESTAMP);
                CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, category TEXT, amount REAL, supplier TEXT, date TEXT);
            `);
            
            // Insert default settings if missing
            await db.run("INSERT OR IGNORE INTO settings (id, biz_name, currency) VALUES (1, 'My Business', 'UGX')");
        } catch (e) {
            throw new Error("DB Init Failed: " + e.message);
        }
    },
    async query(sql, params = []) { return await db.query(sql, params); },
    async run(sql, params = []) { return await db.run(sql, params); }
};
