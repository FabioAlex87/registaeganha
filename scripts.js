/**
 * Regista & Ganha - Core Logic
 */

// Global State
let allProducts = [];

// DOM Elements
const grid = document.getElementById('grid');
const noProductsMsg = document.getElementById('no-products');

// 1. Fetch Data
// 1. Fetch Data
// Function moved to bottom to handle hoisting/updates

// 2. Determine Page Type & Render
function initPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('id');

    // Logic for Category Page
    if (window.location.pathname.includes('category.html')) {
        const titleSpan = document.getElementById('category-title');

        let filtered = [];
        if (!categoryId || categoryId === 'todos') {
            filtered = allProducts;
            if (titleSpan) titleSpan.textContent = "Todos os Cupões";
        } else {
            filtered = allProducts.filter(p => p.cat === categoryId);
            // Format title
            if (titleSpan) {
                titleSpan.textContent = categoryId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
        }
        renderGrid(filtered);
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

    grid.innerHTML = products.map(p => `
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
    }
}

// 5. Utils: Mobile Menu
// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Logic
    const mobileMenuBtn = document.getElementById('categories-menu');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', (e) => {
            // Only toggle if clicking the link itself, or handle differently for mobile
            // For now, simpler toggle
            if (window.innerWidth <= 768) {
                const dropdown = mobileMenuBtn.querySelector('.dropdown');
            }
            // The CSS hover works for desktop. 
            // For click-to-open on mobile/tablet, simple toggle class
            mobileMenuBtn.classList.toggle('open');
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenuBtn.contains(e.target)) {
                mobileMenuBtn.classList.remove('open');
            }
        });
    }

    // Year
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // Load Data
    loadProducts();

    // Cookie Banner Logic
    const cookieBanner = document.getElementById('cookie-banner');
    const cookieBtn = document.getElementById('cookie-accept');

    if (cookieBanner && cookieBtn) {
        if (!localStorage.getItem('cookiesAccepted')) {
            setTimeout(() => {
                cookieBanner.classList.add('show');
            }, 2000);
        }

        cookieBtn.addEventListener('click', () => {
            localStorage.setItem('cookiesAccepted', 'true');
            cookieBanner.classList.remove('show');
        });
    }
});

// Update loadProducts to handle local file CORS errors
async function loadProducts() {
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
