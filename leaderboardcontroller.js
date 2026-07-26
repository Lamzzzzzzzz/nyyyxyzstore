const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../database/data.json');

// ============================================================
//  HELPERS
// ============================================================
function readDB() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { products: [], buyers: [], transactions: [] };
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        return false;
    }
}

// ============================================================
//  CONTROLLERS
// ============================================================

// GET all leaderboard
exports.getLeaderboard = (req, res) => {
    const db = readDB();
    const buyers = db.buyers || [];

    // Sort by total descending
    buyers.sort((a, b) => b.total - a.total);

    res.status(200).json({
        success: true,
        count: buyers.length,
        data: buyers
    });
};

// GET top 10 buyers
exports.getTopBuyers = (req, res) => {
    const db = readDB();
    const buyers = db.buyers || [];

    buyers.sort((a, b) => b.total - a.total);
    const top10 = buyers.slice(0, 10);

    res.status(200).json({
        success: true,
        count: top10.length,
        data: top10
    });
};

// GET buyer by name
exports.getBuyerByName = (req, res) => {
    const { name } = req.params;

    const db = readDB();
    const buyer = db.buyers.find(b =>
        b.name.toLowerCase() === name.toLowerCase()
    );

    if (!buyer) {
        return res.status(404).json({
            success: false,
            message: 'Buyer not found'
        });
    }

    res.status(200).json({
        success: true,
        data: buyer
    });
};

// POST add buyer (auto from payment)
exports.addBuyer = (req, res) => {
    const { name, email, amount } = req.body;

    if (!name || !amount) {
        return res.status(400).json({
            success: false,
            message: 'Field wajib: name, amount'
        });
    }

    const db = readDB();
    db.buyers = db.buyers || [];

    let buyer = db.buyers.find(b =>
        b.name.toLowerCase() === name.toLowerCase()
    );

    if (buyer) {
        buyer.total += parseInt(amount);
        buyer.count += 1;
    } else {
        buyer = {
            id: `B-${Date.now()}`,
            name: name.trim(),
            email: email || `${name.toLowerCase().replace(/\s/g, '')}@gmail.com`,
            total: parseInt(amount),
            count: 1
        };
        db.buyers.push(buyer);
    }

    writeDB(db);

    res.status(201).json({
        success: true,
        message: 'Buyer added/updated successfully',
        data: buyer
    });
};

// DELETE reset leaderboard (admin only)
exports.resetLeaderboard = (req, res) => {
    const db = readDB();
    db.buyers = [];
    writeDB(db);

    res.status(200).json({
        success: true,
        message: 'Leaderboard has been reset'
    });
};

// DELETE remove buyer (admin only)
exports.removeBuyer = (req, res) => {
    const { id } = req.params;

    const db = readDB();
    const index = db.buyers.findIndex(b => b.id === id);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: 'Buyer not found'
        });
    }

    const removed = db.buyers.splice(index, 1);
    writeDB(db);

    res.status(200).json({
        success: true,
        message: 'Buyer removed successfully',
        data: removed[0]
    });
};
