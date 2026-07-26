/* ============================================================
   BACKEND / CONTROLLERS / PRODUCTCONTROLLER.JS
   NyyyxyzModzOfc - Product Controller
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
        console.error('❌ Gagal baca database:', err.message);
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
        console.error('❌ Gagal tulis database:', err.message);
        return false;
    }
}

// ============================================================
//  CONTROLLERS
// ============================================================

// GET semua produk
exports.getAllProducts = (req, res) => {
    const db = readDB();
    const products = db.products || [];
    res.status(200).json({
        success: true,
        count: products.length,
        data: products
    });
};

// GET produk by ID
exports.getProductById = (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const product = db.products.find(p => p.id === id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Produk tidak ditemukan'
        });
    }

    res.status(200).json({
        success: true,
        data: product
    });
};

// GET produk by kategori (game)
exports.getProductsByCategory = (req, res) => {
    const { game } = req.params;
    const db = readDB();
    const products = db.products.filter(p =>
        p.game && p.game.toLowerCase() === game.toLowerCase()
    );

    res.status(200).json({
        success: true,
        count: products.length,
        category: game,
        data: products
    });
};

// POST tambah produk (admin only)
exports.createProduct = (req, res) => {
    const {
        name,
        game,
        platform,
        price,
        sold = 0,
        image = null,
        tags = [],
        discount = null,
        category = 'general'
    } = req.body;

    // Validasi
    if (!name || !game || !platform || !price) {
        return res.status(400).json({
            success: false,
            message: 'Field wajib: name, game, platform, price'
        });
    }

    const db = readDB();
    const newProduct = {
        id: uuidv4(),
        name,
        game,
        platform,
        price: parseInt(price),
        sold: parseInt(sold),
        image,
        tags,
        discount: discount ? parseInt(discount) : null,
        category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    db.products.push(newProduct);
    writeDB(db);

    res.status(201).json({
        success: true,
        message: 'Produk berhasil ditambahkan',
        data: newProduct
    });
};

// PUT update produk (admin only)
exports.updateProduct = (req, res) => {
    const { id } = req.params;
    const {
        name,
        game,
        platform,
        price,
        sold,
        image,
        tags,
        discount,
        category
    } = req.body;

    const db = readDB();
    const index = db.products.findIndex(p => p.id === id);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: 'Produk tidak ditemukan'
        });
    }

    // Update hanya field yang dikirim
    const updated = { ...db.products[index] };
    if (name) updated.name = name;
    if (game) updated.game = game;
    if (platform) updated.platform = platform;
    if (price) updated.price = parseInt(price);
    if (sold !== undefined) updated.sold = parseInt(sold);
    if (image) updated.image = image;
    if (tags) updated.tags = tags;
    if (discount !== undefined) updated.discount = discount ? parseInt(discount) : null;
    if (category) updated.category = category;
    updated.updatedAt = new Date().toISOString();

    db.products[index] = updated;
    writeDB(db);

    res.status(200).json({
        success: true,
        message: 'Produk berhasil diupdate',
        data: updated
    });
};

// DELETE hapus produk (admin only)
exports.deleteProduct = (req, res) => {
    const { id } = req.params;

    const db = readDB();
    const index = db.products.findIndex(p => p.id === id);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: 'Produk tidak ditemukan'
        });
    }

    const deleted = db.products.splice(index, 1);
    writeDB(db);

    res.status(200).json({
        success: true,
        message: 'Produk berhasil dihapus',
        data: deleted[0]
    });
};

// PATCH update sold count
exports.updateSoldCount = (req, res) => {
    const { id } = req.params;
    const { increment = 1 } = req.body;

    const db = readDB();
    const index = db.products.findIndex(p => p.id === id);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: 'Produk tidak ditemukan'
        });
    }

    db.products[index].sold = (db.products[index].sold || 0) + parseInt(increment);
    db.products[index].updatedAt = new Date().toISOString();
    writeDB(db);

    res.status(200).json({
        success: true,
        message: 'Sold count updated',
        data: {
            id: db.products[index].id,
            sold: db.products[index].sold
        }
    });
};
