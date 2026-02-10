// FoodExpress - Main JavaScript File

// Configuration
const CONFIG = {
    API_URL: 'http://localhost:5000/api',
    SITE_NAME: 'FoodExpress',
    CURRENCY: 'Tsh'
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log(`${CONFIG.SITE_NAME} Website Initialized`);
    
    // Initialize all modules
    initializeCart();
    initializeSearch();
    initializeAuth();
    initializeNavigation();
    initializeMenuFilters();
    initializeNotifications();
    
    // Check login status
    checkUserStatus();
    
    // Load initial data
    if (document.getElementById('menu-items')) {
        loadMenuItems();
    }
    
    if (document.querySelector('.order-form')) {
        initializeOrderForm();
    }
    
    // Add CSS animations
    addGlobalStyles();
});

// ==================== CART MANAGEMENT ====================
function initializeCart() {
    // Load cart from localStorage
    let cart = JSON.parse(localStorage.getItem('foodexpress_cart')) || [];
    
    // Update cart count in navigation
    function updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        const cartBadge = document.querySelector('.cart-badge');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        if (cartCount) cartCount.textContent = totalItems;
        if (cartBadge) cartBadge.textContent = totalItems;
        
        // Update cart icon in multiple places
        document.querySelectorAll('.cart-icon span').forEach(span => {
            span.textContent = totalItems;
        });
    }
    
    // Add item to cart
    function addToCart(item) {
        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            cart.push({
                ...item,
                quantity: 1,
                addedAt: new Date().toISOString()
            });
        }
        
        localStorage.setItem('foodexpress_cart', JSON.stringify(cart));
        updateCartCount();
        showNotification(`${item.name} added to cart!`, 'success');
        
        // If on cart page, refresh display
        if (window.location.pathname.includes('cart.html')) {
            displayCartItems();
        }
    }
    
    // Remove item from cart
    function removeFromCart(itemId) {
        cart = cart.filter(item => item.id !== itemId);
        localStorage.setItem('foodexpress_cart', JSON.stringify(cart));
        updateCartCount();
        
        if (window.location.pathname.includes('cart.html')) {
            displayCartItems();
        }
    }
    
    // Update item quantity
    function updateQuantity(itemId, newQuantity) {
        const item = cart.find(item => item.id === itemId);
        if (item) {
            item.quantity = newQuantity;
            if (item.quantity <= 0) {
                removeFromCart(itemId);
            } else {
                localStorage.setItem('foodexpress_cart', JSON.stringify(cart));
                updateCartCount();
                
                if (window.location.pathname.includes('cart.html')) {
                    displayCartItems();
                }
            }
        }
    }
    
    // Calculate cart total
    function calculateTotal() {
        return cart.reduce((total, item) => {
            return total + (item.price * (item.quantity || 1));
        }, 0);
    }
    
    // Display cart items (for cart.html)
    function displayCartItems() {
        const container = document.getElementById('cart-items-container');
        const totalElement = document.getElementById('cart-total');
        
        if (!container) return;
        
        if (cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart fa-3x"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add some delicious food items to get started!</p>
                    <a href="menu.html" class="btn-primary">Browse Menu</a>
                </div>
            `;
            if (totalElement) totalElement.textContent = `${CONFIG.CURRENCY} 0`;
            return;
        }
        
        let html = '';
        let total = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * (item.quantity || 1);
            total += itemTotal;
            
            html += `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>${item.description || ''}</p>
                        <span class="item-price">${CONFIG.CURRENCY} ${item.price.toLocaleString()}</span>
                    </div>
                    
                    <div class="cart-item-controls">
                        <div class="quantity-control">
                            <button class="quantity-btn minus" onclick="window.updateCartQuantity(${item.id}, ${(item.quantity || 1) - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity">${item.quantity || 1}</span>
                            <button class="quantity-btn plus" onclick="window.updateCartQuantity(${item.id}, ${(item.quantity || 1) + 1})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        
                        <div class="cart-item-total">
                            <span>${CONFIG.CURRENCY} ${itemTotal.toLocaleString()}</span>
                            <button class="remove-item" onclick="window.removeFromCart(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        if (totalElement) {
            totalElement.innerHTML = `
                <div class="cart-summary">
                    <div class="summary-row">
                        <span>Subtotal</span>
                        <span>${CONFIG.CURRENCY} ${total.toLocaleString()}</span>
                    </div>
                    <div class="summary-row">
                        <span>Delivery Fee</span>
                        <span>${CONFIG.CURRENCY} 2,000</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total</span>
                        <span>${CONFIG.CURRENCY} ${(total + 2000).toLocaleString()}</span>
                    </div>
                </div>
            `;
        }
    }
    
    // Initialize cart buttons
    function initializeCartButtons() {
        // Add to cart buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('add-to-cart') || 
                e.target.closest('.add-to-cart')) {
                const button = e.target.classList.contains('add-to-cart') ? e.target : e.target.closest('.add-to-cart');
                const item = {
                    id: parseInt(button.dataset.id),
                    name: button.dataset.name,
                    price: parseInt(button.dataset.price),
                    image: button.dataset.image,
                    description: button.dataset.description
                };
                addToCart(item);
            }
            
            // Order now buttons
            if (e.target.classList.contains('order-btn') || 
                e.target.closest('.order-btn')) {
                const button = e.target.classList.contains('order-btn') ? e.target : e.target.closest('.order-btn');
                const restaurant = button.dataset.restaurant || 'Restaurant';
                showNotification(`Redirecting to ${restaurant} menu...`, 'info');
                setTimeout(() => {
                    window.location.href = 'menu.html' + (button.dataset.category ? `?category=${button.dataset.category}` : '');
                }, 500);
            }
        });
    }
    
    // Make functions globally available
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.updateCartQuantity = updateQuantity;
    window.clearCart = function() {
        cart = [];
        localStorage.removeItem('foodexpress_cart');
        updateCartCount();
        if (window.location.pathname.includes('cart.html')) {
            displayCartItems();
        }
    };
    
    // Initialize
    updateCartCount();
    initializeCartButtons();
    if (window.location.pathname.includes('cart.html')) {
        displayCartItems();
    }
}

// ==================== SEARCH FUNCTIONALITY ====================
function initializeSearch() {
    const searchInput = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button, .search-btn');
    
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
    }
    
    function performSearch() {
        const searchInput = document.querySelector('.search-box input');
        if (!searchInput) return;
        
        const query = searchInput.value.trim();
        if (query) {
            // Save search to localStorage
            const searches = JSON.parse(localStorage.getItem('recent_searches')) || [];
            searches.unshift(query);
            localStorage.setItem('recent_searches', JSON.stringify(searches.slice(0, 5)));
            
            // Redirect to search results or menu page
            window.location.href = `menu.html?search=${encodeURIComponent(query)}`;
        } else {
            showNotification('Please enter a search term', 'warning');
        }
    }
}

// ==================== AUTHENTICATION ====================
function initializeAuth() {
    // Check if user is logged in
    window.checkUserStatus = function() {
        const user = JSON.parse(localStorage.getItem('user'));
        const admin = JSON.parse(localStorage.getItem('admin_session'));
        
        // Update auth buttons
        const authContainer = document.querySelector('.auth-buttons, .auth-links');
        if (authContainer) {
            if (user) {
                authContainer.innerHTML = `
                    <a href="profile.html" class="user-profile">
                        <div class="user-avatar">
                            ${user.name.charAt(0)}
                        </div>
                        <span>${user.name.split(' ')[0]}</span>
                    </a>
                    <button onclick="logout()" class="btn-logout">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                `;
            } else if (admin) {
                authContainer.innerHTML = `
                    <a href="admin-dashboard.html" class="admin-link">
                        <i class="fas fa-crown"></i> Admin
                    </a>
                    <button onclick="logoutAdmin()" class="btn-logout">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                `;
            }
        }
        
        // Add admin link to navigation if admin is logged in
        if (admin) {
            const navMenu = document.querySelector('.nav-menu, .main-links');
            if (navMenu && !document.querySelector('.admin-nav-link')) {
                const adminLink = document.createElement('li');
                adminLink.className = 'admin-nav-link';
                adminLink.innerHTML = `
                    <a href="admin-dashboard.html" style="color: #ff6b35; font-weight: bold;">
                        <i class="fas fa-crown"></i> Admin Panel
                    </a>
                `;
                navMenu.appendChild(adminLink);
            }
        }
    };
    
    // Logout functions
    window.logout = function() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('user');
            localStorage.removeItem('foodexpress_cart');
            showNotification('Logged out successfully', 'success');
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
    };
    
    window.logoutAdmin = function() {
        if (confirm('Logout from admin panel?')) {
            localStorage.removeItem('admin_session');
            showNotification('Admin logged out', 'info');
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
    };
}

// ==================== NAVIGATION ====================
function initializeNavigation() {
    // Add active class to current page link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a, .nav-menu a, .main-links a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || 
            (currentPage === 'index.html' && href === '#home') ||
            (href.includes(currentPage.replace('.html', '')) && href !== '#')) {
            link.classList.add('active');
        }
        
        // Smooth scroll for anchor links
        if (href.startsWith('#')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        }
    });
    
    // Mobile menu toggle (if exists)
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
}

// ==================== MENU & FILTERS ====================
function initializeMenuFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn, .category-filter');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const filter = this.dataset.filter || this.textContent;
            filterMenuItems(filter);
        });
    });
}

async function loadMenuItems() {
    const container = document.getElementById('menu-items');
    if (!container) return;
    
    try {
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading menu...</div>';
        
        // Try API first
        const response = await fetch(`${CONFIG.API_URL}/menu`);
        
        if (response.ok) {
            const data = await response.json();
            displayMenuItems(data.data || data);
        } else {
            throw new Error('API not available');
        }
    } catch (error) {
        console.log('Using fallback menu data');
        // Fallback data
        const fallbackMenu = [
            {
                id: 1,
                name: 'Chips Mayai',
                description: 'Crispy fries mixed with scrambled eggs',
                price: 3000,
                category: 'tanzanian',
                image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'
            },
            {
                id: 2,
                name: 'Nyama Choma',
                description: 'Grilled meat with kachumbari salad',
                price: 12000,
                category: 'tanzanian',
                image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'
            },
            {
                id: 3,
                name: 'Beef Burger',
                description: 'Juicy beef patty with cheese and veggies',
                price: 8000,
                category: 'burgers',
                image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w-400'
            },
            {
                id: 4,
                name: 'Pepperoni Pizza',
                description: 'Wood-fired pizza with pepperoni and cheese',
                price: 15000,
                category: 'pizza',
                image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w-400'
            },
            {
                id: 5,
                name: 'Fresh Orange Juice',
                description: 'Freshly squeezed orange juice',
                price: 2000,
                category: 'drinks',
                image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400'
            },
            {
                id: 6,
                name: 'Fruit Salad',
                description: 'Mixed seasonal fruits with yogurt',
                price: 3500,
                category: 'dessert',
                image_url: 'https://images.unsplash.com/photo-1564093497595-593b96d80180?w=400'
            }
        ];
        
        displayMenuItems(fallbackMenu);
    }
}

function displayMenuItems(items) {
    const container = document.getElementById('menu-items');
    if (!container) return;
    
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="no-items">No menu items available</div>';
        return;
    }
    
    let html = '';
    items.forEach(item => {
        html += `
            <div class="menu-item" data-category="${item.category}">
                <div class="menu-item-image">
                    <img src="${item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'">
                </div>
                <div class="menu-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                    <div class="menu-item-footer">
                        <span class="price">${CONFIG.CURRENCY} ${item.price.toLocaleString()}</span>
                        <button class="add-to-cart"
                                data-id="${item.id}"
                                data-name="${item.name}"
                                data-price="${item.price}"
                                data-image="${item.image_url}"
                                data-description="${item.description}">
                            <i class="fas fa-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function filterMenuItems(category) {
    const items = document.querySelectorAll('.menu-item');
    const searchParams = new URLSearchParams(window.location.search);
    const searchQuery = searchParams.get('search')?.toLowerCase();
    
    items.forEach(item => {
        const itemCategory = item.dataset.category;
        const itemName = item.querySelector('h4').textContent.toLowerCase();
        const itemDescription = item.querySelector('p').textContent.toLowerCase();
        
        let shouldShow = true;
        
        // Filter by category
        if (category !== 'All' && category !== 'all' && category.toLowerCase() !== itemCategory) {
            shouldShow = false;
        }
        
        // Filter by search query
        if (searchQuery && 
            !itemName.includes(searchQuery) && 
            !itemDescription.includes(searchQuery)) {
            shouldShow = false;
        }
        
        item.style.display = shouldShow ? 'block' : 'none';
    });
}

// ==================== ORDER FORM ====================
function initializeOrderForm() {
    const orderForm = document.getElementById('order-form');
    if (!orderForm) return;
    
    orderForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const cart = JSON.parse(localStorage.getItem('foodexpress_cart')) || [];
        if (cart.length === 0) {
            showNotification('Your cart is empty!', 'warning');
            return;
        }
        
        const formData = {
            customer_name: document.getElementById('customer_name').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            payment_method: document.querySelector('input[name="payment_method"]:checked')?.value || 'cash',
            notes: document.getElementById('notes')?.value || '',
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1
            }))
        };
        
        // Validate form
        if (!formData.customer_name || !formData.phone || !formData.address) {
            showNotification('Please fill in all required fields', 'warning');
            return;
        }
        
        try {
            // Show loading
            const submitBtn = orderForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            submitBtn.disabled = true;
            
            // Try API
            const response = await fetch(`${CONFIG.API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Clear cart
                localStorage.removeItem('foodexpress_cart');
                window.updateCartCount?.();
                
                // Show success
                showNotification('Order placed successfully!', 'success');
                
                // Redirect to orders page
                setTimeout(() => {
                    window.location.href = `orders.html?order_id=${result.order_id || 'success'}`;
                }, 1500);
                
            } else {
                throw new Error('Order failed');
            }
            
        } catch (error) {
            console.error('Order error:', error);
            
            // Simulate success for demo
            showNotification('Order placed successfully! (Demo Mode)', 'success');
            localStorage.removeItem('foodexpress_cart');
            window.updateCartCount?.();
            
            setTimeout(() => {
                window.location.href = 'orders.html?demo=true';
            }, 1500);
            
        } finally {
            const submitBtn = orderForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText || 'Place Order';
            }
        }
    });
}

// ==================== NOTIFICATIONS ====================
function initializeNotifications() {
    window.showNotification = function(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    };
    
    function getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// ==================== GLOBAL STYLES ====================
function addGlobalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Loading spinner */
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .fa-spinner {
            margin-right: 10px;
        }
        
        /* Notifications */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-left: 4px solid #ff6b35;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            border-radius: 5px;
            padding: 15px 20px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            max-width: 400px;
        }
        
        .notification-success {
            border-left-color: #28a745;
        }
        
        .notification-error {
            border-left-color: #dc3545;
        }
        
        .notification-warning {
            border-left-color: #ffc107;
        }
        
        .notification-info {
            border-left-color: #17a2b8;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            padding: 5px;
            margin-left: 10px;
        }
        
        /* Animations */
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        /* Cart item styles */
        .cart-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid #eee;
        }
        
        .cart-item:last-child {
            border-bottom: none;
        }
        
        .quantity-control {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .quantity-btn {
            width: 30px;
            height: 30px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .quantity-btn:hover {
            background: #f8f9fa;
        }
        
        .empty-cart {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        /* Menu items */
        .menu-item {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        
        .menu-item:hover {
            transform: translateY(-5px);
        }
        
        /* User profile */
        .user-profile {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            color: #333;
        }
        
        .user-avatar {
            width: 35px;
            height: 35px;
            background: #ff6b35;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .notification {
                left: 20px;
                right: 20px;
                max-width: none;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// ==================== UTILITY FUNCTIONS ====================
// Format currency
window.formatCurrency = function(amount) {
    return `${CONFIG.CURRENCY} ${amount.toLocaleString()}`;
};

// Validate phone number
window.validatePhone = function(phone) {
    const regex = /^\+?[\d\s\-\(\)]{10,}$/;
    return regex.test(phone);
};

// Validate email
window.validateEmail = function(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

// Debounce function for search
window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        initializeCart,
        initializeSearch,
        initializeAuth
    };
                }
