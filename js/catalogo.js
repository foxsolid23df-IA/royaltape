/* ========================================
   Royal Tape - Catalogo JavaScript
   ======================================== */

const WHATSAPP_NUMBER = '5215619886579';
const WHATSAPP_MESSAGE = 'Hola, necesito precio de este producto';

let productos = [];
let productosFiltrados = [];
let categoriaActual = 'todos';

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

// Load products from embedded data
function loadProducts() {
    try {
        if (typeof PRODUCTOS_DATA !== 'undefined' && PRODUCTOS_DATA.productos) {
            productos = PRODUCTOS_DATA.productos;
        } else {
            productos = [];
        }
        productosFiltrados = [...productos];
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        productsGrid.innerHTML = '<p class="no-results">Error al cargar los productos</p>';
    }
}

// Render products to grid
function renderProducts() {
    if (productosFiltrados.length === 0) {
        productsGrid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    
    productsGrid.innerHTML = productosFiltrados.map(producto => createProductCard(producto)).join('');
}

// Create product card HTML
function createProductCard(producto) {
    const imagenHTML = producto.imagen 
        ? `<img src="img/productos/${producto.imagen}" alt="${producto.nombre}" loading="lazy">`
        : createPlaceholderSVG();
    
    const whatsappMessage = encodeURIComponent(
        `${WHATSAPP_MESSAGE}: ${producto.nombre} - SKU: ${producto.sku}`
    );
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

    return `
        <article class="product-card">
            <div class="product-image">
                ${imagenHTML}
            </div>
            <div class="product-info">
                <span class="product-category">${producto.categoria}</span>
                <h3 class="product-name">${producto.nombre}</h3>
                <span class="product-sku">SKU: ${producto.sku}</span>
                <div class="product-actions">
                    <a href="${whatsappURL}" 
                       class="btn-product-whatsapp" 
                       target="_blank" 
                       rel="noopener noreferrer">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Consultar precio
                    </a>
                </div>
            </div>
        </article>
    `;
}

// Create placeholder SVG for products without image
function createPlaceholderSVG() {
    return `
        <div class="product-image-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
            <p>Imagen no disponible</p>
        </div>
    `;
}

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            categoriaActual = btn.dataset.category;
            filterProducts();
        });
    });

    // Search input
    searchInput.addEventListener('input', debounce(() => {
        filterProducts();
    }, 300));

    // Mobile menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
        });
    });
}

// Filter products by category and search
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    productosFiltrados = productos.filter(producto => {
        const matchesCategory = categoriaActual === 'todos' || 
                               producto.categoria === categoriaActual;
        
        const matchesSearch = searchTerm === '' || 
                             producto.nombre.toLowerCase().includes(searchTerm) ||
                             producto.sku.toLowerCase().includes(searchTerm);
        
        return matchesCategory && matchesSearch;
    });

    renderProducts();
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
