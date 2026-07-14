/* ========================================
   Royal Tape - Admin JavaScript
   ======================================== */

// Configuration
const ADMIN_PASSWORD = 'royaltape2026';
const STORAGE_KEY = 'royalTapeAuth';
const PRODUCTS_KEY = 'royalTapeProducts';

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtn');
const productAdminList = document.getElementById('productAdminList');
const searchAdmin = document.getElementById('searchAdmin');
const uploadModal = document.getElementById('uploadModal');
const closeModal = document.getElementById('closeModal');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewImage = document.getElementById('previewImage');
const modalProductName = document.getElementById('modalProductName');
const cancelUpload = document.getElementById('cancelUpload');
const saveImage = document.getElementById('saveImage');
const notification = document.getElementById('notification');

// Stats elements
const totalProducts = document.getElementById('totalProducts');
const withImages = document.getElementById('withImages');
const withoutImages = document.getElementById('withoutImages');

// State
let productos = [];
let currentProduct = null;
let selectedFile = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Check if user is authenticated
function checkAuth() {
    const isAuth = localStorage.getItem(STORAGE_KEY);
    if (isAuth === 'true') {
        showDashboard();
    } else {
        showLogin();
    }
}

// Show login form
function showLogin() {
    loginContainer.style.display = 'block';
    dashboard.classList.remove('active');
}

// Show dashboard
function showDashboard() {
    loginContainer.style.display = 'none';
    dashboard.classList.add('active');
    loadProducts();
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // Search
    searchAdmin.addEventListener('input', filterProducts);
    
    // Modal
    closeModal.addEventListener('click', closeUploadModal);
    cancelUpload.addEventListener('click', closeUploadModal);
    saveImage.addEventListener('click', handleSaveImage);
    
    // Upload area
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // Close modal on outside click
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            closeUploadModal();
        }
    });
    
    // Mobile menu
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const password = passwordInput.value;
    
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem(STORAGE_KEY, 'true');
        errorMessage.style.display = 'none';
        showDashboard();
    } else {
        errorMessage.style.display = 'block';
        passwordInput.value = '';
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    showLogin();
}

// Load products from localStorage or JSON
async function loadProducts() {
    // Try to load from localStorage first
    const savedProducts = localStorage.getItem(PRODUCTS_KEY);
    
    if (savedProducts) {
        productos = JSON.parse(savedProducts);
    } else {
        // Load from JSON file
        try {
            const response = await fetch('data/productos.json');
            const data = await response.json();
            productos = data.productos;
            saveProducts();
        } catch (error) {
            console.error('Error loading products:', error);
            showNotification('Error al cargar productos', true);
            return;
        }
    }
    
    updateStats();
    renderProductList();
}

// Save products to localStorage
function saveProducts() {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(productos));
}

// Update statistics
function updateStats() {
    totalProducts.textContent = productos.length;
    withImages.textContent = productos.filter(p => p.imagen).length;
    withoutImages.textContent = productos.filter(p => !p.imagen).length;
}

// Render product list
function renderProductList(filteredProducts = null) {
    const productsToRender = filteredProducts || productos;
    
    if (productsToRender.length === 0) {
        productAdminList.innerHTML = `
            <div style="padding: 40px; text-align: center; color: var(--color-gray);">
                No se encontraron productos
            </div>
        `;
        return;
    }
    
    productAdminList.innerHTML = productsToRender.map(producto => createProductAdminItem(producto)).join('');
}

// Create product admin item HTML
function createProductAdminItem(producto) {
    const imageHTML = producto.imagen 
        ? `<img src="img/productos/${producto.imagen}" alt="${producto.nombre}">`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
           </svg>`;
    
    return `
        <div class="product-admin-item" data-sku="${producto.sku}">
            <div class="product-admin-image">
                ${imageHTML}
            </div>
            <div class="product-admin-info">
                <h3>${producto.nombre}</h3>
                <span>SKU: ${producto.sku} | ${producto.categoria}</span>
            </div>
            <div class="product-admin-actions">
                <button class="btn-upload" onclick="openUploadModal('${producto.sku}')">
                    ${producto.imagen ? 'Cambiar imagen' : 'Subir imagen'}
                </button>
            </div>
        </div>
    `;
}

// Filter products
function filterProducts() {
    const searchTerm = searchAdmin.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        renderProductList();
        return;
    }
    
    const filtered = productos.filter(producto => 
        producto.nombre.toLowerCase().includes(searchTerm) ||
        producto.sku.toLowerCase().includes(searchTerm) ||
        producto.categoria.toLowerCase().includes(searchTerm)
    );
    
    renderProductList(filtered);
}

// Open upload modal
function openUploadModal(sku) {
    currentProduct = productos.find(p => p.sku === sku);
    
    if (!currentProduct) return;
    
    modalProductName.textContent = currentProduct.nombre;
    
    // Show current image if exists
    if (currentProduct.imagen) {
        previewImage.src = `img/productos/${currentProduct.imagen}`;
        previewImage.style.display = 'block';
    } else {
        previewImage.style.display = 'none';
    }
    
    selectedFile = null;
    saveImage.disabled = true;
    uploadModal.classList.add('active');
}

// Close upload modal
function closeUploadModal() {
    uploadModal.classList.remove('active');
    currentProduct = null;
    selectedFile = null;
    previewImage.style.display = 'none';
    fileInput.value = '';
    saveImage.disabled = true;
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// Handle file select
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// Handle file
function handleFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Por favor seleccione un archivo de imagen', true);
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('La imagen no debe exceder 5MB', true);
        return;
    }
    
    selectedFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
    };
    reader.readAsDataURL(file);
    
    saveImage.disabled = false;
}

// Handle save image
async function handleSaveImage() {
    if (!selectedFile || !currentProduct) return;
    
    // Create FormData
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('sku', currentProduct.sku);
    
    try {
        // Try to upload to server
        const response = await fetch('upload.php', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // Update product image filename
                currentProduct.imagen = result.filename;
                saveProducts();
                updateStats();
                renderProductList();
                closeUploadModal();
                showNotification('Imagen subida correctamente');
            } else {
                throw new Error(result.message || 'Error al subir imagen');
            }
        } else {
            throw new Error('Error en el servidor');
        }
    } catch (error) {
        console.error('Upload error:', error);
        
        // Fallback: Save locally using localStorage (for development/testing)
        // In production, this should be removed and the PHP backend should work
        const reader = new FileReader();
        reader.onload = (e) => {
            // Save as base64 in localStorage (not recommended for production)
            const base64 = e.target.result;
            const filename = `${currentProduct.sku}_${Date.now()}.${selectedFile.name.split('.').pop()}`;
            
            // Store in localStorage (temporary solution)
            const images = JSON.parse(localStorage.getItem('royalTapeImages') || '{}');
            images[currentProduct.sku] = {
                filename: filename,
                data: base64
            };
            localStorage.setItem('royalTapeImages', JSON.stringify(images));
            
            // Update product
            currentProduct.imagen = filename;
            saveProducts();
            updateStats();
            renderProductList();
            closeUploadModal();
            showNotification('Imagen guardada localmente (modo desarrollo)');
        };
        reader.readAsDataURL(selectedFile);
    }
}

// Show notification
function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.className = 'notification' + (isError ? ' error' : '');
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Make openUploadModal available globally
window.openUploadModal = openUploadModal;
