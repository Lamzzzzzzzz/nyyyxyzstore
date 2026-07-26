/* ============================================================
   BACKEND / MODELS / TRANSACTION.JS
   NyyyxyzModzOfc - Transaction Model
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../../database/data.json');

// ============================================================
//  HELPER: Baca database
// ============================================================
function readDB() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { products: [], buyers: [], transactions: [] };
    }
}

// ============================================================
//  HELPER: Tulis database
// ============================================================
function writeDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        return false;
    }
}

// ============================================================
//  TRANSACTION MODEL
// ============================================================
class Transaction {
    constructor(data) {
        this.id = data.id || `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        this.productId = data.productId || null;
        this.productName = data.productName || 'Unknown Product';
        this.amount = parseInt(data.amount) || 0;
        this.buyerName = data.buyerName || 'Anonymous';
        this.buyerEmail = data.buyerEmail || null;
        this.status = data.status || 'pending'; // pending | paid | failed | refunded
        this.paymentMethod = data.paymentMethod || 'QRIS';
        this.qrisData = data.qrisData || null;
        this.metadata = data.metadata || {};
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.paidAt = data.paidAt || null;
        this.refundedAt = data.refundedAt || null;
    }

    // Simpan ke database
    save() {
        const db = readDB();
        db.transactions = db.transactions || [];

        const existingIndex = db.transactions.findIndex(t => t.id === this.id);
        if (existingIndex !== -1) {
            db.transactions[existingIndex] = this.toJSON();
        } else {
            db.transactions.push(this.toJSON());
        }

        return writeDB(db);
    }

    // Cari transaksi by ID
    static findById(id) {
        const db = readDB();
        const transaction = db.transactions.find(t => t.id === id);
        return transaction ? new Transaction(transaction) : null;
    }

    // Cari transaksi by buyer name
    static findByBuyer(name) {
        const db = readDB();
        const transactions = db.transactions.filter(t =>
            t.buyerName.toLowerCase() === name.toLowerCase()
        );
        return transactions.map(t => new Transaction(t));
    }

    // Cari transaksi by status
    static findByStatus(status) {
        const db = readDB();
        const transactions = db.transactions.filter(t => t.status === status);
        return transactions.map(t => new Transaction(t));
    }

    // Semua transaksi
    static findAll() {
        const db = readDB();
        return (db.transactions || []).map(t => new Transaction(t));
    }

    // Update status
    updateStatus(status, paidAt = null) {
        this.status = status;
        this.updatedAt = new Date().toISOString();
        if (status === 'paid' && !this.paidAt) {
            this.paidAt = paidAt || new Date().toISOString();
        }
        if (status === 'refunded') {
            this.refundedAt = new Date().toISOString();
        }
        return this.save();
    }

    // Konversi ke JSON
    toJSON() {
        return {
            id: this.id,
            productId: this.productId,
            productName: this.productName,
            amount: this.amount,
            buyerName: this.buyerName,
            buyerEmail: this.buyerEmail,
            status: this.status,
            paymentMethod: this.paymentMethod,
            qrisData: this.qrisData,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            paidAt: this.paidAt,
            refundedAt: this.refundedAt
        };
    }
}

// ============================================================
//  EXPORT
// ============================================================
module.exports = Transaction;
