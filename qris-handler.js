/* ============================================================
   JS / QRIS-HANDLER.JS
   NyyyxyzModzOfc - QRIS Payment Handler
   ============================================================ */

// ============================================================
//  QRIS CONFIG
// ============================================================
const QRIS_CONFIG = {
    merchant: 'NyyyxyzModzOfc',
    nmd: 'ID1026482535188',
    qrisId: 'NYYYXYZVYERAAA',
    version: 'v0.0.2026.06.20',
    provider: 'ASPI',
    providerUrl: 'www.aspi-qris.id',
    waSupport: 'https://wa.me/6285770528356'
};

// ============================================================
//  DOM REFS
// ============================================================
const qrisModal = document.getElementById('qrisModal');
const qrisClose = document.getElementById('qrisClose');
const qrisCanvas = document.getElementById('qrisCanvas');
const qrisAmount = document.getElementById('qrisAmount');
const qrisProduct = document.getElementById('qrisProduct');
const qrisMerchant = document.getElementById('qrisMerchant');
const qrisNmd = document.getElementById('qrisNmd');
const qrisVersion = document.getElementById('qrisVersion');

// ============================================================
//  QR GENERATOR
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

    // QRIS logo di tengah
    const cx = size / 2 - 24;
    const cy = size / 2 - 24;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx, cy, 48, 48);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QRIS', size / 2, size / 2 - 2);

    // Border emas
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);
}

// ============================================================
//  QRIS DATA BUILDER
// ============================================================
function buildQRISData(product, price) {
    return [
        `QRIS|${QRIS_CONFIG.merchant}`,
        `NMD:${QRIS_CONFIG.nmd}`,
        `ID:${QRIS_CONFIG.qrisId}`,
        `PRODUCT:${product}`,
        `AMOUNT:${price}`,
        `VERSION:${QRIS_CONFIG.version}`,
        `TS:${Date.now()}`
    ].join('|');
}

// ============================================================
//  QRIS MODAL CONTROL
// ============================================================
function openQRIS(product, price) {
    // Update UI
    qrisAmount.textContent = `Rp${price.toLocaleString()}`;
    qrisProduct.textContent = product;
    
    if (qrisMerchant) qrisMerchant.textContent = QRIS_CONFIG.merchant;
    if (qrisNmd) qrisNmd.textContent = QRIS_CONFIG.nmd;
    if (qrisVersion) qrisVersion.textContent = QRIS_CONFIG.version;

    // Generate QR
    const data = buildQRISData(product, price);
    generateSimpleQR(data, qrisCanvas);

    // Show modal
    qrisModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeQRIS() {
    qrisModal.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================================
//  QRIS SCAN SIMULATION
// ============================================================
function simulateQRScan() {
    // Simulasi scan: animasi loading + konfirmasi
    const btn = document.getElementById('qrisScanBtn');
    if (btn) {
        btn.textContent = '⏳ Scanning...';
        btn.disabled = true;
        btn.style.opacity = '0.6';
    }

    setTimeout(() => {
        if (btn) {
            btn.textContent = '✅ Scan Berhasil!';
            btn.style.background = '#00e676';
            btn.style.color = '#0a0c12';
        }
        // Trigger success callback jika ada
        if (window.onQRScanSuccess) {
            window.onQRScanSuccess();
        }
    }, 2000);
}

// ============================================================
//  EVENT BINDING
// ============================================================
// Close modal
qrisClose?.addEventListener('click', closeQRIS);

// Click outside
qrisModal?.addEventListener('click', (e) => {
    if (e.target === qrisModal) closeQRIS();
});

// ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && qrisModal?.classList.contains('active')) {
        closeQRIS();
    }
});

// Scan button (jika ada)
document.getElementById('qrisScanBtn')?.addEventListener('click', simulateQRScan);

// ============================================================
//  EXPOSE KE GLOBAL
// ============================================================
window.QRIS = {
    config: QRIS_CONFIG,
    open: openQRIS,
    close: closeQRIS,
    scan: simulateQRScan,
    generate: generateSimpleQR,
    buildData: buildQRISData
};

console.log('📱 QRIS Handler loaded');
console.log(`🏷️  Merchant: ${QRIS_CONFIG.merchant}`);
console.log(`🆔 NMD: ${QRIS_CONFIG.nmd}`);
console.log(`📞 Support: ${QRIS_CONFIG.waSupport}`);
