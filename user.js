/* ============================================================
   BACKEND / MODELS / USER.JS
   NyyyxyzModzOfc - User Model
   ============================================================ */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const USERS_PATH = path.join(__dirname, '../../database/users.json');

// ============================================================
//  HELPER: Baca users
// ============================================================
function readUsers() {
    try {
        const data = fs.readFileSync(USERS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // Default admin jika file belum ada
        const defaultUsers = [
            {
                id: 'admin-1',
                username: 'admin',
                password: bcrypt.hashSync('nyyyxyz123', 10),
                role: 'admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        writeUsers(defaultUsers);
        return defaultUsers;
    }
}

// ============================================================
//  HELPER: Tulis users
// ============================================================
function writeUsers(data) {
    try {
        fs.writeFileSync(USERS_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        return false;
    }
}

// ============================================================
//  USER MODEL
// ============================================================
class User {
    constructor(data) {
        this.id = data.id || `user-${Date.now()}`;
        this.username = data.username || '';
        this.password = data.password || '';
        this.role = data.role || 'admin'; // admin | manager | viewer
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.lastLogin = data.lastLogin || null;
    }

    // Simpan ke database
    save() {
        const users = readUsers();
        const existingIndex = users.findIndex(u => u.id === this.id);

        if (existingIndex !== -1) {
            users[existingIndex] = this.toJSON();
        } else {
            users.push(this.toJSON());
        }

        return writeUsers(users);
    }

    // Cari user by username
    static findByUsername(username) {
        const users = readUsers();
        const user = users.find(u => u.username === username);
        return user ? new User(user) : null;
    }

    // Cari user by ID
    static findById(id) {
        const users = readUsers();
        const user = users.find(u => u.id === id);
        return user ? new User(user) : null;
    }

    // Semua user
    static findAll() {
        const users = readUsers();
        return users.map(u => new User(u));
    }

    // Verifikasi password
    verifyPassword(plainPassword) {
        return bcrypt.compareSync(plainPassword, this.password);
    }

    // Hash password
    static hashPassword(plainPassword) {
        return bcrypt.hashSync(plainPassword, 10);
    }

    // Update last login
    updateLastLogin() {
        this.lastLogin = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
        return this.save();
    }

    // Delete user
    delete() {
        const users = readUsers();
        const filtered = users.filter(u => u.id !== this.id);
        return writeUsers(filtered);
    }

    // Konversi ke JSON (tanpa password untuk keamanan)
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            role: this.role,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastLogin: this.lastLogin
        };
    }

    // Untuk internal (dengan password)
    toJSONWithPassword() {
        return {
            ...this.toJSON(),
            password: this.password
        };
    }
}

// ============================================================
//  EXPORT
// ============================================================
module.exports = User;
