// ===== SEARCH =====
document.getElementById('searchInput')?.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    let visible = 0;
    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
        const match = title.includes(query);
        card.style.display = match ? '' : 'none';
        if (match) visible++;
    });
    const countEl = document.querySelector('.product-count');
    if (countEl) countEl.textContent = `${visible} item tersedia`;
});

// ===== INSTALL BUTTON =====
document.querySelectorAll('.btn-install').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        const name = this.closest('.product-card')?.querySelector('h3')?.textContent || 'Produk';
        alert(`🔽 Install APK untuk: ${name}\nProses akan dimulai...`);
    });
});

// ===== NAV TOGGLE MOBILE =====
document.getElementById('menuToggle')?.addEventListener('click', function() {
    const actions = document.querySelector('.nav-actions');
    const btns = actions?.querySelectorAll('.btn-nav');
    btns?.forEach(btn => {
        btn.style.display = btn.style.display === 'none' ? 'inline-flex' : 'none';
    });
    this.classList.toggle('active');
});

// ===== SCROLL ANIMATION (fade-in) =====
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.product-card, .buyer-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
});

// ===== COUNTER ANIMATION (hero stats) =====
function animateCounter(el, target, suffix = '') {
    let current = 0;
    const step = Math.max(1, Math.floor(target / 50));
    const interval = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(interval);
        }
        el.textContent = current + suffix;
    }, 25);
}

const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const spans = entry.target.querySelectorAll('span');
            if (spans.length >= 3) {
                animateCounter(spans[0], 50, 'K+');
                animateCounter(spans[1], 98, '%');
                animateCounter(spans[2], 24, '/7');
            }
            statObserver.disconnect();
        }
    });
}, { threshold: 0.3 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statObserver.observe(heroStats);
