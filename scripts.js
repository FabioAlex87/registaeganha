/**
 * Regista & Ganha - Core Logic
 */

// Global State
let allProducts = [];
let currentSort = 'featured';
let currentCategoryId = null;

// DOM Elements
const grid = document.getElementById('grid');
const noProductsMsg = document.getElementById('no-products');
const sortSelect = document.getElementById('sort-select');

// 1. Fetch Data
// 1. Fetch Data
// Function moved to bottom to handle hoisting/updates

// 2. Determine Page Type & Render
function initPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('id') || 'todos';
    currentCategoryId = categoryId;
    const isCategoryPage = isCategoryView();

    // Logic for Category Page
    if (isCategoryPage) {
        applyCategoryFilter(categoryId, false);
    }
    // Logic for Home Page (Popular)
    else {
        const popular = allProducts.filter(p => p.isPopular);
        renderGrid(popular);
    }
}

// 3. Render Grid
function renderGrid(products) {
    if (!grid) return;

    if (products.length === 0) {
        grid.style.display = 'none';
        if (noProductsMsg) noProductsMsg.style.display = 'block';
        return;
    }

    // Ensure grid is visible
    grid.style.display = 'grid';
    if (noProductsMsg) noProductsMsg.style.display = 'none';

    const sorted = sortProducts(products, currentSort);

    grid.innerHTML = sorted.map(p => `
    <article class="card">
      <span class="badge">${p.cat.replace(/-/g, ' ')}</span>
      <img class="product-image" src="${p.img}" alt="${p.title}" loading="lazy">
      <div>
        <h3>${p.title}</h3>
        <p class="tagline">${p.description}</p>
      </div>
      <div class="price-tag">
        <div class="price-info">
          <span class="discount-price">${p.price}</span>
          <span class="original-price">${p.oldPrice}</span>
        </div>
        <span class="discount-badge">${p.discount}</span>
      </div>

      <div class="cta">
        <a class="btn primary" href="${p.link}" target="_blank" rel="nofollow">
          Ver Oferta Amazon
        </a>
        <button class="btn secondary btn-copy" data-copy="${p.coupon}" aria-label="Copiar cupão" onclick="copyCode(this, '${p.coupon}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    </article>
  `).join('');
}

// 4. Utils: Copy Function
async function copyCode(btn, code) {
    try {
        await navigator.clipboard.writeText(code);
        const originalIcon = btn.innerHTML;
        // Green checkmark
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        setTimeout(() => {
            btn.innerHTML = originalIcon;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy', err);
        // Fallback: select text approach
        const temp = document.createElement('textarea');
        temp.value = code;
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand('copy');
        } catch (copyErr) {
            console.error('Fallback copy failed', copyErr);
        }
        document.body.removeChild(temp);
    }
}

// 5. Utils: Mobile Menu
// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    setupMenuDropdown();

    // Sort select
    if (sortSelect) {
        sortSelect.addEventListener('change', (event) => {
            currentSort = event.target.value;
            if (isCategoryView()) {
                applyCategoryFilter(currentCategoryId || 'todos', false);
            } else {
                initPage();
            }
        });
    }

    // Year
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // Load Data
    loadProducts();

    // Cookie Banner Logic
    setupCookieBanner();
});

// Update loadProducts to handle local file CORS errors
async function loadProducts() {
    // Only fetch when grid exists on the page
    if (!grid && !noProductsMsg) return;

    // Show loading state if possible
    if (noProductsMsg) noProductsMsg.style.display = 'block';

    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('Failed to load products');

        const data = await response.json();
        // Support both old array structure and new object structure
        allProducts = Array.isArray(data) ? data : (data.products || []);

        initPage();
    } catch (error) {
        console.error('Error loading products:', error);
        let msg = '<p>Erro ao carregar ofertas.</p>';

        // Check for local file protocol issue
        if (window.location.protocol === 'file:') {
            msg += '<p style="font-size:0.9rem; margin-top:8px; color:#fb923c;">Nota: O carregamento de JSON local é bloqueado pelos browsers por segurança. Por favor, use um servidor local ou faça deploy no Netlify.</p>';
        } else {
            msg += '<p>Tente novamente mais tarde.</p>';
        }

        if (grid) {
            grid.style.display = 'block'; // Ensure container is visible for message
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">${msg}</div>`;
        }
    }
}

function applyCategoryFilter(categoryId = 'todos', updateUrl = true) {
    currentCategoryId = categoryId || 'todos';
    const titleSpan = document.getElementById('category-title');
    const description = document.getElementById('category-description');
    const normalizedId = currentCategoryId;
    let filtered = [];

    if (!normalizedId || normalizedId === 'todos') {
        filtered = allProducts;
        if (titleSpan) titleSpan.textContent = "Todos os Cupões";
        if (description) description.textContent = "Encontre os melhores descontos por categoria.";
    } else {
        filtered = allProducts.filter(p => p.cat === normalizedId);
        const formatted = normalizedId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (titleSpan) titleSpan.textContent = formatted;
        if (description) description.textContent = `Resultados filtrados para "${formatted}".`;
    }

    if (updateUrl && typeof window !== 'undefined' && window.history && isCategoryView()) {
        const url = new URL(window.location.href);
        url.searchParams.set('id', normalizedId);
        window.history.replaceState({}, '', url);
    }

    renderGrid(filtered);
}

function sortProducts(products, sortKey) {
    const items = [...products];
    switch (sortKey) {
        case 'discount':
            return items.sort((a, b) => extractPercent(b.discount) - extractPercent(a.discount));
        case 'price-asc':
            return items.sort((a, b) => extractPrice(a.price) - extractPrice(b.price));
        case 'price-desc':
            return items.sort((a, b) => extractPrice(b.price) - extractPrice(a.price));
        case 'alpha':
            return items.sort((a, b) => a.title.localeCompare(b.title, 'pt'));
        default:
            return items;
    }
}

function extractPercent(text = '') {
    const match = text.match(/(-?\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

function extractPrice(text = '') {
    const normalized = text.replace(/[^\d.,-]/g, '').replace('.', '').replace(',', '.');
    const value = parseFloat(normalized);
    return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function setupCookieBanner() {
    const cookieBanner = document.getElementById('cookie-banner');
    const btnAccept = document.getElementById('cookie-accept');
    const btnReject = document.getElementById('cookie-reject');
    const btnManage = document.getElementById('cookie-manage');
    const btnReset = document.getElementById('cookie-reset');
    const details = document.getElementById('cookie-details');

    if (!cookieBanner || !btnAccept || !btnReject) return;

    const choice = localStorage.getItem('cookiesChoice');
    if (!choice) {
        setTimeout(() => cookieBanner.classList.add('show'), 2000);
    }

    const saveChoice = (value) => {
        localStorage.setItem('cookiesChoice', value);
        cookieBanner.classList.remove('show');
    };

    btnAccept.addEventListener('click', () => saveChoice('accepted'));
    btnReject.addEventListener('click', () => saveChoice('rejected'));

    if (btnManage && details) {
        btnManage.addEventListener('click', () => {
            const isHidden = details.hasAttribute('hidden');
            details.toggleAttribute('hidden');
            btnManage.setAttribute('aria-expanded', String(!isHidden));
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            localStorage.removeItem('cookiesChoice');
            cookieBanner.classList.add('show');
        });
    }
}

function setupMenuDropdown() {
    const menu = document.getElementById('categories-menu');
    const trigger = menu?.querySelector('.nav-link');
    if (!menu || !trigger) return;

    const toggleMenu = (open) => {
        const isOpen = open ?? !menu.classList.contains('open');
        menu.classList.toggle('open', isOpen);
        trigger.setAttribute('aria-expanded', String(isOpen));
    };

    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu();
    });

    trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') toggleMenu(false);
    });

    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target)) toggleMenu(false);
    });

    // Handle in-page category filter without full reload when already on category page
    const links = menu.querySelectorAll('.dropdown a[href*="category.html?id="]');
    links.forEach((link) => {
        link.addEventListener('click', (e) => {
            if (isCategoryView()) {
                e.preventDefault();
                const linkUrl = new URL(link.href);
                const catId = linkUrl.searchParams.get('id') || 'todos';
                applyCategoryFilter(catId, true);
                toggleMenu(false);
            }
        });
    });
}

function isCategoryView() {
    return typeof window !== 'undefined' && window.location.pathname.includes('category.html');
}
