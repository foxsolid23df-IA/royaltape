/* ========================================
   R.Tape - Admin JavaScript
   ======================================== */

const USERS_KEY = 'royalTapeUsers';
const PRODUCTS_KEY = 'royalTapeProducts';
const AUTH_KEY = 'royalTapeAuth';
const AUTH_USER_KEY = 'royalTapeCurrentUser';
const CLOUDINARY_CLOUD = 'hrc7b0jv';
const CLOUDINARY_PRESET = 'rtape_products';

let productos = [];
let usuarios = [];
let currentUser = null;
let currentProduct = null;
let selectedFile = null;
let selectedProductFile = null;
let editingProductSku = null;
let confirmCallback = null;

// ===================== DOM =====================
const $ = id => document.getElementById(id);
const loginContainer = $('loginContainer');
const dashboard = $('dashboard');
const loginForm = $('loginForm');
const loginUser = $('loginUser');
const loginPass = $('loginPass');
const errorMessage = $('errorMessage');
const logoutBtn = $('logoutBtn');
const searchAdmin = $('searchAdmin');
const productAdminList = $('productAdminList');
const productCount = $('productCount');
const notification = $('notification');

// Stats
const totalProducts = $('totalProducts');
const withImages = $('withImages');
const withoutImages = $('withoutImages');
const totalUsers = $('totalUsers');
const totalCategories = $('totalCategories');

// Modals
const uploadModal = $('uploadModal');
const productModal = $('productModal');
const userModal = $('userModal');
const passModal = $('passModal');
const confirmModal = $('confirmModal');

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// ===================== AUTH =====================
function checkAuth() {
    const auth = localStorage.getItem(AUTH_KEY);
    const user = localStorage.getItem(AUTH_USER_KEY);
    if (auth === 'true' && user) {
        currentUser = user;
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    loginContainer.style.display = 'block';
    dashboard.classList.remove('active');
}

function showDashboard() {
    loginContainer.style.display = 'none';
    dashboard.classList.add('active');
    loadUsers();
    loadProducts();
}

function handleLogin(e) {
    e.preventDefault();
    const user = loginUser.value.trim();
    const pass = loginPass.value;

    loadUsers();
    const found = usuarios.find(u => u.nombre === user && u.password === pass);

    if (found) {
        currentUser = found.nombre;
        localStorage.setItem(AUTH_KEY, 'true');
        localStorage.setItem(AUTH_USER_KEY, currentUser);
        errorMessage.style.display = 'none';
        showDashboard();
    } else {
        errorMessage.style.display = 'block';
        loginPass.value = '';
        loginUser.focus();
    }
}

function handleLogout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    currentUser = null;
    showLogin();
}

// ===================== USERS =====================
function loadUsers() {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
        try { usuarios = JSON.parse(stored); } catch(e) { usuarios = []; }
    }
    if (!usuarios || usuarios.length === 0) {
        usuarios = [{ nombre: 'admin', password: '1234', fechaCreacion: new Date().toISOString().split('T')[0] }];
        saveUsers();
    }
    renderUsers();
}

function saveUsers() {
    localStorage.setItem(USERS_KEY, JSON.stringify(usuarios));
}

function renderUsers() {
    const tbody = $('userTableBody');
    const noMsg = $('noUsersMsg');
    $('userCount').textContent = usuarios.length;
    $('totalUsers').textContent = usuarios.length;

    if (usuarios.length === 0) {
        tbody.innerHTML = '';
        noMsg.style.display = 'block';
        return;
    }
    noMsg.style.display = 'none';
    tbody.innerHTML = usuarios.map(u => `
        <tr>
            <td><strong>${esc(u.nombre)}</strong></td>
            <td>${u.fechaCreacion || 'N/A'}</td>
            <td>
                ${u.nombre === 'admin' ? '<span style="color:#999;font-size:0.8rem;">Usuario principal</span>' : 
                `<button class="btn-delete" onclick="confirmDeleteUser('${esc(u.nombre)}')">Eliminar</button>`}
            </td>
        </tr>
    `).join('');
}

function createUser(name, pass) {
    if (usuarios.find(u => u.nombre === name)) {
        showNotification('Ya existe un usuario con ese nombre', true);
        return false;
    }
    usuarios.push({
        nombre: name,
        password: pass,
        fechaCreacion: new Date().toISOString().split('T')[0]
    });
    saveUsers();
    renderUsers();
    showNotification('Usuario creado correctamente');
    return true;
}

function deleteUser(name) {
    if (name === 'admin') {
        showNotification('No se puede eliminar el usuario admin', true);
        return;
    }
    usuarios = usuarios.filter(u => u.nombre !== name);
    saveUsers();
    renderUsers();
    showNotification('Usuario eliminado');
}

function changePassword(newPass) {
    const idx = usuarios.findIndex(u => u.nombre === currentUser);
    if (idx === -1) return;
    usuarios[idx].password = newPass;
    saveUsers();
    showNotification('Contrasena actualizada');
}

// ===================== PRODUCTS =====================
function loadProducts() {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    if (stored) {
        try { productos = JSON.parse(stored); } catch(e) { productos = []; }
    }
    if (productos.length === 0) {
        if (typeof PRODUCTOS_DATA !== 'undefined' && PRODUCTOS_DATA.productos) {
            productos = PRODUCTOS_DATA.productos;
            saveProductsLocal();
            renderProducts();
            updateStats();
        } else {
            fetch('data/productos.json')
                .then(r => r.json())
                .then(data => {
                    productos = data.productos || [];
                    saveProductsLocal();
                    renderProducts();
                    updateStats();
                })
                .catch(() => { renderProducts(); updateStats(); });
        }
    } else {
        renderProducts();
        updateStats();
    }
}

function saveProductsLocal() {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(productos));
}

function saveProducts() {
    saveProductsLocal();
    updateStats();
}

function renderProducts(filtered) {
    const list = filtered || productos;
    productCount.textContent = list.length;

    if (list.length === 0) {
        productAdminList.innerHTML = '<div class="no-results-msg">No se encontraron productos</div>';
        return;
    }

    productAdminList.innerHTML = list.map(p => {
        const imgSrc = p.imagen && p.imagen.startsWith('http')
            ? p.imagen
            : (p.imagen ? 'img/productos/' + esc(p.imagen) : '');
        const imgHTML = imgSrc
            ? `<img src="${imgSrc}" alt="${esc(p.nombre)}">`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
        return `
        <div class="product-admin-item">
            <div class="product-admin-image">${imgHTML}</div>
            <div class="product-admin-info">
                <h3>${esc(p.nombre)}</h3>
                <span>SKU: ${esc(p.sku)} | Cat: ${esc(p.categoria)} | $${Number(p.precio).toFixed(2)} | Stock: ${p.existencia}</span>
            </div>
            <div class="product-admin-actions">
                <button class="btn-edit" onclick="openEditProduct('${esc(p.sku)}')">Editar</button>
                <button class="btn-image" onclick="openUploadModal('${esc(p.sku)}')">${p.imagen ? 'Cambiar' : 'Subir'} imagen</button>
                ${p.imagen ? `<button class="btn-image btn-remove-img" onclick="deleteProductImage('${esc(p.sku)}')">Eliminar</button>` : ''}
                <button class="btn-delete" onclick="confirmDeleteProduct('${esc(p.sku)}', '${esc(p.nombre)}')">Eliminar</button>
            </div>
        </div>`;
    }).join('');
}

function updateStats() {
    totalProducts.textContent = productos.length;
    const withImg = productos.filter(p => p.imagen && p.imagen !== '').length;
    withImages.textContent = withImg;
    withoutImages.textContent = productos.length - withImg;

    const cats = new Set(productos.map(p => p.categoria).filter(Boolean));
    totalCategories.textContent = cats.size;
}

function addProduct(data) {
    if (productos.find(p => p.sku === data.sku)) {
        showNotification('Ya existe un producto con ese SKU', true);
        return false;
    }
    productos.push({
        nombre: data.nombre,
        sku: data.sku,
        categoria: data.categoria,
        precio: parseFloat(data.precio),
        existencia: parseInt(data.existencia),
        unidad: data.unidad,
        imagen: ''
    });
    saveProducts();
    renderProducts();
    showNotification('Producto agregado correctamente');
    return true;
}

function editProduct(sku, data) {
    const idx = productos.findIndex(p => p.sku === sku);
    if (idx === -1) return false;
    productos[idx].nombre = data.nombre;
    productos[idx].categoria = data.categoria;
    productos[idx].precio = parseFloat(data.precio);
    productos[idx].existencia = parseInt(data.existencia);
    productos[idx].unidad = data.unidad;
    saveProducts();
    renderProducts();
    showNotification('Producto actualizado');
    return true;
}

function deleteProduct(sku) {
    productos = productos.filter(p => p.sku !== sku);
    saveProducts();
    renderProducts();
    showNotification('Producto eliminado');
}

// ===================== UPLOAD =====================
function openUploadModal(sku) {
    currentProduct = productos.find(p => p.sku === sku);
    if (!currentProduct) return;
    $('uploadProductName').textContent = currentProduct.nombre + ' (SKU: ' + currentProduct.sku + ')';
    const preview = $('previewImage');
    if (currentProduct.imagen) {
        preview.src = 'img/productos/' + currentProduct.imagen;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
    selectedFile = null;
    $('saveImage').disabled = true;
    uploadModal.classList.add('active');
}

function closeUploadModal() {
    uploadModal.classList.remove('active');
    currentProduct = null;
    selectedFile = null;
    $('previewImage').style.display = 'none';
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showNotification('Solo se permiten imagenes', true);
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showNotification('El archivo excede 5MB', true);
        return;
    }
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = e => {
        $('previewImage').src = e.target.result;
        $('previewImage').style.display = 'block';
    };
    reader.readAsDataURL(file);
    $('saveImage').disabled = false;
}

async function handleSaveImage() {
    if (!selectedFile || !currentProduct) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('upload_preset', CLOUDINARY_PRESET);
    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
            { method: 'POST', body: formData }
        );
        const result = await response.json();
        if (result.secure_url) {
            currentProduct.imagen = result.secure_url;
            const idx = productos.findIndex(p => p.sku === currentProduct.sku);
            if (idx !== -1) productos[idx].imagen = result.secure_url;
            saveProducts();
            renderProducts();
            closeUploadModal();
            showNotification('Imagen subida correctamente');
            return;
        }
    } catch(e) {}
    showNotification('Error al subir imagen', true);
}

async function uploadProductImage(sku, file, callback) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);
    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
            { method: 'POST', body: formData }
        );
        const result = await response.json();
        if (result.secure_url) {
            const idx = productos.findIndex(p => p.sku === sku);
            if (idx !== -1) {
                productos[idx].imagen = result.secure_url;
                saveProducts();
                renderProducts();
            }
            showNotification('Imagen subida correctamente');
            if (callback) callback();
            return;
        }
    } catch(e) {}
    showNotification('Error al subir imagen', true);
    if (callback) callback();
}

function deleteProductImage(sku) {
    if (!confirm('¿Eliminar la imagen de este producto?')) return;
    const idx = productos.findIndex(p => p.sku === sku);
    if (idx !== -1) {
        productos[idx].imagen = "";
        saveProducts();
        renderProducts();
        showNotification('Imagen eliminada');
    }
}

function handleProductFile(file) {
    if (!file.type.startsWith('image/')) {
        showNotification('Solo se permiten imagenes', true);
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showNotification('El archivo excede 5MB', true);
        return;
    }
    selectedProductFile = file;
    const reader = new FileReader();
    reader.onload = e => {
        $('prodImagePreview').src = e.target.result;
        $('prodImagePreview').style.display = 'block';
        $('prodImageName').textContent = file.name;
        $('prodImageName').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// ===================== MODALS =====================
function openProductModal(product) {
    editingProductSku = null;
    $('productModalTitle').textContent = 'Agregar Producto';
    $('saveProduct').textContent = 'Guardar Producto';
    $('prodName').value = '';
    $('prodSku').value = '';
    $('prodSku').disabled = false;
    $('prodCategory').value = '';
    $('prodPrice').value = '';
    $('prodStock').value = '';
    $('prodUnit').value = 'PZA';
    selectedProductFile = null;
    $('prodImagePreview').style.display = 'none';
    $('prodImageName').style.display = 'none';
    $('prodImage').value = '';
    productModal.classList.add('active');
}

function openEditProduct(sku) {
    const p = productos.find(item => item.sku === sku);
    if (!p) return;
    editingProductSku = sku;
    $('productModalTitle').textContent = 'Editar Producto';
    $('saveProduct').textContent = 'Guardar Cambios';
    $('prodName').value = p.nombre;
    $('prodSku').value = p.sku;
    $('prodSku').disabled = true;
    $('prodCategory').value = p.categoria;
    $('prodPrice').value = p.precio;
    $('prodStock').value = p.existencia;
    $('prodUnit').value = p.unidad;
    selectedProductFile = null;
    $('prodImage').value = '';
    if (p.imagen) {
        $('prodImagePreview').src = 'img/productos/' + p.imagen;
        $('prodImagePreview').style.display = 'block';
        $('prodImageName').textContent = 'Imagen actual: ' + p.imagen;
        $('prodImageName').style.display = 'block';
    } else {
        $('prodImagePreview').style.display = 'none';
        $('prodImageName').style.display = 'none';
    }
    productModal.classList.add('active');
}

function closeProductModal() {
    productModal.classList.remove('active');
    editingProductSku = null;
    selectedProductFile = null;
    $('prodImagePreview').style.display = 'none';
    $('prodImageName').style.display = 'none';
    $('prodImage').value = '';
}

function openUserModal() {
    $('newUserName').value = '';
    $('newUserPass').value = '';
    $('newUserPass2').value = '';
    userModal.classList.add('active');
}

function closeUserModalFn() {
    userModal.classList.remove('active');
}

function openPassModal() {
    $('currentPass').value = '';
    $('newPass').value = '';
    $('newPass2').value = '';
    passModal.classList.add('active');
}

function closePassModalFn() {
    passModal.classList.remove('active');
}

function openConfirm(title, message, sub, callback) {
    $('confirmTitle').textContent = title;
    $('confirmMessage').textContent = message;
    $('confirmSub').textContent = sub || '';
    confirmCallback = callback;
    confirmModal.classList.add('active');
}

function closeConfirm() {
    confirmModal.classList.remove('active');
    confirmCallback = null;
}

// Global functions for onclick handlers
window.confirmDeleteProduct = function(sku, name) {
    openConfirm('Eliminar Producto', `¿Estas seguro de eliminar "${name}"?`, 'SKU: ' + sku, () => {
        deleteProduct(sku);
    });
};

window.confirmDeleteUser = function(name) {
    openConfirm('Eliminar Usuario', `¿Estas seguro de eliminar al usuario "${name}"?`, '', () => {
        deleteUser(name);
    });
};

// ===================== NOTIFICATION =====================
function showNotification(msg, isError) {
    notification.textContent = msg;
    notification.className = 'notification' + (isError ? ' error' : '');
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// ===================== UTILS =====================
function esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

// ===================== EVENTS =====================
function setupEventListeners() {
    // Login
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            $('tab-' + btn.dataset.tab).classList.add('active');
        });
    });

    // Search
    searchAdmin.addEventListener('input', () => {
        const term = searchAdmin.value.toLowerCase().trim();
        if (!term) { renderProducts(); return; }
        const filtered = productos.filter(p =>
            p.nombre.toLowerCase().includes(term) ||
            p.sku.toLowerCase().includes(term) ||
            p.categoria.toLowerCase().includes(term)
        );
        renderProducts(filtered);
    });

    // Product modal
    $('btnAddProduct').addEventListener('click', openProductModal);
    $('closeProductModal').addEventListener('click', closeProductModal);
    $('cancelProduct').addEventListener('click', closeProductModal);
    productForm.addEventListener('submit', e => {
        e.preventDefault();
        const data = {
            nombre: $('prodName').value.trim(),
            sku: $('prodSku').value.trim(),
            categoria: $('prodCategory').value,
            precio: $('prodPrice').value,
            existencia: $('prodStock').value,
            unidad: $('prodUnit').value
        };
        let success = false;
        if (editingProductSku) {
            success = editProduct(editingProductSku, data);
        } else {
            success = addProduct(data);
        }
        if (success && selectedProductFile) {
            uploadProductImage(data.sku, selectedProductFile, () => {
                closeProductModal();
            });
        } else {
            closeProductModal();
        }
    });

    // Product image upload in form
    $('productUploadArea').addEventListener('click', () => $('prodImage').click());
    $('prodImage').addEventListener('change', e => {
        if (e.target.files[0]) handleProductFile(e.target.files[0]);
    });
    $('productUploadArea').addEventListener('dragover', e => {
        e.preventDefault();
        $('productUploadArea').classList.add('dragover');
    });
    $('productUploadArea').addEventListener('dragleave', () => {
        $('productUploadArea').classList.remove('dragover');
    });
    $('productUploadArea').addEventListener('drop', e => {
        e.preventDefault();
        $('productUploadArea').classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleProductFile(e.dataTransfer.files[0]);
    });

    // Upload modal
    $('closeUploadModal').addEventListener('click', closeUploadModal);
    $('cancelUpload').addEventListener('click', closeUploadModal);
    $('saveImage').addEventListener('click', handleSaveImage);
    $('uploadArea').addEventListener('click', () => $('fileInput').click());
    $('fileInput').addEventListener('change', e => { if (e.target.files[0]) handleFile(e.target.files[0]); });
    $('uploadArea').addEventListener('dragover', e => { e.preventDefault(); $('uploadArea').classList.add('dragover'); });
    $('uploadArea').addEventListener('dragleave', () => $('uploadArea').classList.remove('dragover'));
    $('uploadArea').addEventListener('drop', e => { e.preventDefault(); $('uploadArea').classList.remove('dragover'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });

    // User modal
    $('btnAddUser').addEventListener('click', openUserModal);
    $('closeUserModal').addEventListener('click', closeUserModalFn);
    $('cancelUser').addEventListener('click', closeUserModalFn);
    $('userForm').addEventListener('submit', e => {
        e.preventDefault();
        const name = $('newUserName').value.trim();
        const pass = $('newUserPass').value;
        const pass2 = $('newUserPass2').value;
        if (pass !== pass2) {
            showNotification('Las contrasenas no coinciden', true);
            return;
        }
        if (createUser(name, pass)) closeUserModalFn();
    });

    // Password modal
    $('btnChangePass').addEventListener('click', openPassModal);
    $('closePassModal').addEventListener('click', closePassModalFn);
    $('cancelPass').addEventListener('click', closePassModalFn);
    $('passForm').addEventListener('submit', e => {
        e.preventDefault();
        const current = $('currentPass').value;
        const newP = $('newPass').value;
        const newP2 = $('newPass2').value;
        const user = usuarios.find(u => u.nombre === currentUser);
        if (!user || user.password !== current) {
            showNotification('Contrasena actual incorrecta', true);
            return;
        }
        if (newP !== newP2) {
            showNotification('Las nuevas contrasenas no coinciden', true);
            return;
        }
        changePassword(newP);
        closePassModalFn();
    });

    // Confirm modal
    $('closeConfirmModal').addEventListener('click', closeConfirm);
    $('confirmCancel').addEventListener('click', closeConfirm);
    $('confirmOk').addEventListener('click', () => {
        if (confirmCallback) confirmCallback();
        closeConfirm();
    });

    // Close modals on backdrop click
    [uploadModal, productModal, userModal, passModal, confirmModal].forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                modal.classList.remove('active');
                confirmCallback = null;
            }
        });
    });

    // Mobile menu
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => nav.classList.toggle('active'));
    }
}
