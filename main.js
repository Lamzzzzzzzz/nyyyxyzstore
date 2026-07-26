/* ============================================================
   JS / MAIN.JS
   NyyyxyzModzOfc - Cyber Store
   ============================================================ */

// ============================================================
//  DATA
// ============================================================
let buyers = [];
let nextBuyerId = 1;
let cart = [];
let currentProduct = null;

// ============================================================
//  DOM REFS
// ============================================================
const searchInput = document.getElementById('searchInput');
const productGrid = document.getElementById('productGrid');
const productCount = document.getElementById('productCount');
const buyerGrid = document.getElementById('buyerGrid');
const buyerCount = document.getElementById('buyerCount');
const resetBtn = document.getElementById('resetLeaderboard');
const cartBtn = document.getElementById('cartBtn');
const qrisModal = document.getElementById('qrisModal');
const qrisClose = document.getElementById('qrisClose');
const qrisCanvas = document.getElementById('qrisCanvas');
const qrisAmount = document.getElementById('qrisAmount');
const qrisProduct = document.getElementById('qrisProduct');

// ============================================================
//  QRIS HANDLER (diintegrasikan di sini)
// ============================================================
function generateSimpleQR(text, canvas) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }

    const seed = Math.abs(hash);
    const cellSize = 8;
    const cols = Math.floor(size / cellSize);
    const rows = Math.floor(size / cellSize);

    function drawMarker(x, y) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
    }

    drawMarker(0, 0);
    drawMarker(size - 7 * cellSize, 0);
    drawMarker(0, size - 7 * cellSize);

    let pseudoRandom = seed;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if ((row < 7 && col < 7) ||
                (row < 7 && col >= cols - 7) ||
                (row >= rows - 7 && col < 7)) {
                continue;
            }
            pseudoRandom = (pseudoRandom * 9301 + 49297) % 233280;
            const val = (pseudoRandom / 233280);
            if (val > 0.55) {
                ctx.fillStyle = '#000000';
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }
    }

    const cx = size / 2 - 24;
    const cy = size / 2 - 24;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx, cy, 48, 48);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QRIS', size / 2, size / 2 - 2);

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);
}

function openQRIS(product, price) {
    qrisAmount.textContent = `Rp${price.toLocaleString()}`;
    qrisProduct.textContent = product;
    const data = `QRIS|NyyyxyzModzOfc|${product}|${price}|${Date.now()}`;
    generateSimpleQR(data, qrisCanvas);
    qrisModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeQRIS() {
    qrisModal.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================================
//  LEADERBOARD
// ============================================================
function addBuyer(name, amount) {
    const existing = buyers.find(b => b.name.toLowerCase() === name.toLowerCase());
    if (existing) {
        existing.total += amount;
        existing.count += 1;
    } else {
        buyers.push({
            id: nextBuyerId++,
            name: name,
            email: `${name.toLowerCase().replace(/\s/g, '')}@gmail.com`,
            total: amount,
            count: 1
        });
    }
    buyers.sort((a, b) => b.total - a.total);
    renderLeaderboard();
    updateProductSold();
}

function renderLeaderboard() {
    if (buyers.length === 0) {
        buyerGrid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:30px 0; color:var(--text-muted);">
                <i class="fas fa-store" style="font-size:32px; display:block; margin-bottom:10px;"></i>
                Belum ada pembeli. Jadi yang pertama!
            </div>
        `;
        buyerCount.textContent = '0 pembeli';
        return;
    }

    buyerCount.textContent = `${buyers.length} pembeli`;

    const medals = ['gold', 'silver', 'bronze'];
    buyerGrid.innerHTML = buyers.map((b, idx) => {
        const rank = idx + 1;
        const medalClass = idx < 3 ? medals[idx] : '';
        const initial = b.name.charAt(0).toUpperCase();
        return `
            <div class="buyer-card ${medalClass}">
                <div class="buyer-rank">#${rank}</div>
                <div class="buyer-info">
                    <div class="buyer-avatar">${initial}</div>
                    <div class="buyer-detail">
                        <h4>${b.name}</h4>
                        <p>${b.email}</p>
                    </div>
                </div>
                <div class="buyer-stats">
                    <span>Rp ${b.total.toLocaleString()}</span>
                    <span>${b.count}x transaksi</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateProductSold() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach((card) => {
        const soldSpan = card.querySelector('.sold-count');
        if (soldSpan) {
            const current = parseInt(soldSpan.textContent.replace(/\./g, ''));
            const increment = Math.floor(Math.random() * 5) + 1;
            soldSpan.textContent = (current + increment).toLocaleString();
        }
    });
}

function resetLeaderboard() {
    if (confirm('Reset semua data pembeli?')) {
        buyers = [];
        nextBuyerId = 1;
        renderLeaderboard();
        const soldData = {
            'DRIP CLIENT FF': 5893,
            'DRIP PROXY FF': 543,
            'HG CHEAT FF': 3847,
            'PRIME HOOK APK': 2949,
            'FLUORITE IOS FF': 2394,
            'PATO ORANGE': 980,
            'PATO BLUE': 1452,
            'MORELLA MLBB': 2716,
            'MIGUL IOS FF': 2183,
            'BR MODS ROOT': 1923,
            'FLUORITE IOS MLBB': 1232,
            'GBOX IOS': 2039
        };
        document.querySelectorAll('.product-card').forEach(card => {
            const name = card.querySelector('h3')?.textContent?.trim();
            const soldSpan = card.querySelector('.sold-count');
            if (soldSpan && name && soldData[name]) {
                soldSpan.textContent = soldData[name].toLocaleString();
            }
        });
    }
}

// ============================================================
//  SEARCH
// ============================================================
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    let visible = 0;
    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
        const match = title.includes(query);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
    });
    productCount.textContent = `${visible} item tersedia`;
}

// ============================================================
//  CHECKOUT
// ============================================================
function handleCheckout(e) {
    const btn = e.currentTarget;
    const product = btn.dataset.product;
    const price = parseInt(btn.dataset.price);

    const name = prompt('Masukkan nama Anda untuk pembelian:', 'Player' + Math.floor(Math.random() * 1000));
    if (!name || name.trim() === '') return;

    openQRIS(product, price);

    const confirmPay = confirm(`Konfirmasi pembayaran Rp${price.toLocaleString()} untuk ${product}?`);
    if (confirmPay) {
        addBuyer(name.trim(), price);
        alert(`✅ Pembayaran berhasil!\n${product} - Rp${price.toLocaleString()}\nTerima kasih, ${name.trim()}!`);
        closeQRIS();
    }
}

// ============================================================
//  INSTALL APK
// ============================================================
function handleInstall(e) {
    e.stopPropagation();
    const card = e.currentTarget.closest('.product-card');
    const name = card?.querySelector('h3')?.textContent || 'Produk';
    alert(`🔽 Install APK: ${name}\nProses akan dimulai...`);
}

// ============================================================
//  CART
// ============================================================
function handleCart() {
    if (cart.length === 0) {
        alert('🛒 Keranjang belanja kosong.\nSilakan pilih produk terlebih dahulu.');
        return;
    }
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const items = cart.map(item => `${item.name} (Rp${item.price.toLocaleString()})`).join('\n');
    alert(`🛒 Keranjang belanja\n\n${items}\n\nTotal: Rp${total.toLocaleString()}\n\nLanjutkan ke pembayaran?`);
}

// ============================================================
//  EVENT BINDING
// ============================================================
// Search
searchInput?.addEventListener('input', handleSearch);

// Reset
resetBtn?.addEventListener('click', resetLeaderboard);

// Cart
cartBtn?.addEventListener('click', handleCart);

// QRIS modal
qrisClose?.addEventListener('click', closeQRIS);
qrisModal?.addEventListener('click', (e) => {
    if (e.target === qrisModal) closeQRIS();
});

// Checkout buttons
document.querySelectorAll('.btn-checkout-gold').forEach(btn => {
    btn.addEventListener('click', handleCheckout);
});

// Install buttons
document.querySelectorAll('.btn-install').forEach(btn => {
    btn.addEventListener('click', handleInstall);
});

// ============================================================
//  INIT
// ============================================================
renderLeaderboard();

console.log('🔥 NyyyxyzModzOfc Cyber Store loaded');
console.log(`📦 ${document.querySelectorAll('.product-card').length} produk tersedia`);
console.log('👑 Leaderboard siap menunggu pembeli pertama.');
console.log('📞 Bantuan: https://wa.me/6285770528356');
console.log('🛒 Sistem checkout & QRIS aktif.');
