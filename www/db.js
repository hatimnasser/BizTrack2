import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db;

export const DBService = {
    async init() {
        try {
            db = await sqlite.createConnection("biztrack_db", false, "no-encryption", 1, false);
            await db.open();

            // Explicitly set UTF-8 encoding to fix text rendering issues
            await db.execute("PRAGMA encoding = 'UTF-8';");

            const schema = `
                CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY, 
                    biz_name TEXT, 
                    currency TEXT, 
                    tax_rate REAL
                );
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    name TEXT, 
                    price REAL, 
                    cost REAL, 
                    stock INTEGER, 
                    low_stock_alert INTEGER
                );
                CREATE TABLE IF NOT EXISTS sales (
                    id TEXT PRIMARY KEY, 
                    item_id INTEGER, 
                    qty INTEGER, 
                    total REAL, 
                    cost REAL, 
                    profit REAL, 
                    customer_name TEXT, 
                    status TEXT, 
                    date DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS expenses (
                    id TEXT PRIMARY KEY, 
                    category TEXT, 
                    amount REAL, 
                    date DATETIME DEFAULT CURRENT_TIMESTAMP, 
                    supplier TEXT
                );
            `;
            await db.execute(schema);
            
            // Seed default settings if empty
            const res = await db.query("SELECT COUNT(*) as cnt FROM settings");
            if (res.values[0].cnt === 0) {
                await db.run("INSERT INTO settings (id, biz_name, currency, tax_rate) VALUES (1, 'BizTrack Pro', 'UGX', 0)");
            }
        } catch (error) {
            console.error("SQLite Init Error:", error);
        }
    },

    async query(sql, params = []) {
        return await db.query(sql, params);
    },

    async run(sql, params = []) {
        return await db.run(sql, params);
    }
};
