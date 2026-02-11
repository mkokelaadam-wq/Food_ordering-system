// Food Express - Main JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ FoodExpress Website Loaded');
    
    // ===== STATE MANAGEMENT =====
    let cart = JSON.parse(localStorage.getItem('foodExpressCart')) || [];
    let menuItems = [];
    
    // ===== DOM ELEMENTS =====
    const cartBtn = document.querySelector('.cart-btn');
    const closeCartBtn = document.getElementById('close-cart');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartCount = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartDelivery = document.getElementById('cart-delivery');
    const cartTotal = document.getElementById('cart-total');
    const menuContainer = document.getElementById('menu-items');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    const continueShopping = document.getElementById('continue-shopping');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    // ===== INITIALIZE =====
    function init() {
        updateCartCount();
        loadMenuItems();
        renderCart();
        setupEventListeners();
    }
    
    // ===== EVENT LISTENERS =====
    function setupEventListeners() {
        // Cart toggle
        if (cartBtn) cartBtn.addEventListener('click', toggleCart);
        if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
        if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);
        if (continueShopping) continueShopping.addEventListener('click', toggleCart);
        
        // Mobile menu
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', function() {
                navMenu.classList.toggle('active');
                this.classList.toggle('active');
            });
        }
        
        // Filter buttons
        if (filterButtons.length > 0) {
            filterButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    filterButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    const category = this.dataset.filter;
                    filterMenu(category);
                });
            });
        }
        
        // Checkout button
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function() {
                if (cart.length === 0) {
                    showNotification('Your cart is empty!', 'error');
                    return;
                }
                window.location.href = 'checkout.html';
            });
        }
        
        // Category cards
        document.querySelectorAll('.category-card .btn-category').forEach(btn => {
            btn.addEventListener('click', function() {
                const category = this.closest('.category-card').dataset.category;
                const targetFilter = document.querySelector(`.filter-btn[data-filter="${category}"]`);
                if (targetFilter) {
                    targetFilter.click();
                    document.querySelector('.menu-section').scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
        
        // Restaurant order buttons
        document.querySelectorAll('.btn-order').forEach(btn => {
            btn.addEventListener('click', function() {
                window.location.href = 'menu.html';
            });
        });
        
        // Search button
        const searchBtn = document.getElementById('search-food');
        const searchInput = document.getElementById('delivery-address');
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', function() {
                const address = searchInput.value.trim();
                if (address) {
                    showNotification(`Searching restaurants near ${address}...`, 'info');
                    setTimeout(() => {
                        window.location.href = 'restaurants.html';
                    }, 1500);
                } else {
                    showNotification('Please enter your delivery address', 'warning');
                }
            });
        }
    }
    
    // ===== MENU FUNCTIONS =====
    function loadMenuItems() {
        if (!menuContainer) return;
        
        menuContainer.innerHTML = '<div class="loading">Loading delicious menu...</div>';
        
        // Fallback menu data
        setTimeout(() => {
            menuItems = [
                { id: 1, name: 'Chips Mayai', description: 'Crispy fries mixed with scrambled eggs, served with kachumbari', price: 5000, category: 'tanzanian', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600' },
                { id: 2, name: 'Nyama Choma', description: 'Grilled beef with traditional spices, served with ugali and kachumbari', price: 12000, category: 'tanzanian', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600' },
                { id: 3, name: 'Beef Burger', description: 'Juicy beef patty with cheese, lettuce, tomato, and special sauce', price: 8000, category: 'burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600' },
                { id: 4, name: 'Chicken Burger', description: 'Grilled chicken breast with avocado, bacon, and ranch sauce', price: 9000, category: 'burgers', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600' },
                { id: 5, name: 'Margherita Pizza', description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil', price: 12000, category: 'pizza', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600' },
                { id: 6, name: 'Pepperoni Pizza', description: 'Spicy pepperoni with extra cheese and tomato sauce', price: 15000, category: 'pizza', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600' },
                { id: 7, name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice, no sugar added', price: 3500, category: 'drinks', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600' },
                { id: 8, name: 'Chocolate Cake', description: 'Rich chocolate cake with chocolate ganache', price: 4500, category: 'drinks', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600' }
            ];
            
            displayMenu(menuItems);
        }, 800);
    }
    
    function displayMenu(items) {
        if (!menuContainer) return;
        
        if (items.length === 0) {
            menuContainer.innerHTML = '<div class="loading">No items found</div>';
            return;
        }
        
        menuContainer.innerHTML = '';
        
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'menu-card';
            card.innerHTML = `
                <img src="${item.image}" alt="${item.name}" loading="lazy">
                <div class="menu-card-content">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <div class="menu-card-footer">
                        <span class="price">Tsh ${item.price.toLocaleString()}</span>
                        <button class="add-to-cart" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">
                            <i class="fas fa-cart-plus"></i> Add
                        </button>
                    </div>
                </div>
            `;
            menuContainer.appendChild(card);
        });
        
        // Add to cart event listeners
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', addToCart);
        });
    }
    
    function filterMenu(category) {
        if (category === 'all') {
            displayMenu(menuItems);
            return;
        }
        
        const filtered = menuItems.filter(item => item.category === category);
        displayMenu(filtered);
    }
    
    // ===== CART FUNCTIONS =====
    function addToCart(e) {
        const id = parseInt(e.currentTarget.dataset.id);
        const name = e.currentTarget.dataset.name;
        const price = parseInt(e.currentTarget.dataset.price);
        
        const existingItem = cart.find(item => item.id === id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }
        
        saveCart();
        renderCart();
        updateCartCount();
        showNotification(`${name} added to cart!`, 'success');
        toggleCart(true);
    }
    
    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        renderCart();
        updateCartCount();
        showNotification('Item removed from cart', 'info');
    }
    
    function updateQuantity(id, change) {
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                removeFromCart(id);
            } else {
                saveCart();
                renderCart();
                updateCartCount();
            }
        }
    }
    
    function renderCart() {
        if (!cartItemsContainer || !cartSubtotal || !cartTotal) return;
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i><p>Your cart is empty</p></div>';
            cartSubtotal.textContent = 'Tsh 0';
            cartDelivery.textContent = 'Tsh 0';
            cartTotal.textContent = 'Tsh 0';
            return;
        }
        
        let subtotal = 0;
        let itemsHTML = '';
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            itemsHTML += `
                <div class="cart-item">
                    <div>
                        <h4>${item.name}</h4>
                        <p>Tsh ${item.price.toLocaleString()} x ${item.quantity}</p>
                    </div>
                    <div>
                        <p style="color: #28a745; font-weight: bold; margin-bottom: 5px;">Tsh ${itemTotal.toLocaleString()}</p>
                        <div style="display: flex; gap: 5px; justify-content: flex-end;">
                            <button onclick="window.updateQuantity(${item.id}, -1)" style="background: #ffc107; border: none; width: 30px; height: 30px; border-radius: 5px; cursor: pointer;">-</button>
                            <button onclick="window.updateQuantity(${item.id}, 1)" style="background: #28a745; color: white; border: none; width: 30px; height: 30px; border-radius: 5px; cursor: pointer;">+</button>
                            <button onclick="window.removeFromCart(${item.id})" style="background: #dc3545; color: white; border: none; width: 30px; height: 30px; border-radius: 5px; cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        const delivery = subtotal > 0 ? 2500 : 0;
        const total = subtotal + delivery;
        
        cartItemsContainer.innerHTML = itemsHTML;
        cartSubtotal.textContent = `Tsh ${subtotal.toLocaleString()}`;
        cartDelivery.textContent = `Tsh ${delivery.toLocaleString()}`;
        cartTotal.textContent = `Tsh ${total.toLocaleString()}`;
    }
    
    function saveCart() {
        localStorage.setItem('foodExpressCart', JSON.stringify(cart));
    }
    
    function updateCartCount() {
        if (!cartCount) return;
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    function toggleCart(open = null) {
        if (!cartSidebar || !cartOverlay) return;
        
        if (open === true) {
            cartSidebar.classList.add('active');
            cartOverlay.classList.add('active');
        } else if (open === false) {
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
        } else {
            cartSidebar.classList.toggle('active');
            cartOverlay.classList.toggle('active');
        }
    }
    
    // ===== NOTIFICATION =====
    function showNotification(message, type = 'success') {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.background = colors[type] || colors.success;
        notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // ===== MAKE FUNCTIONS GLOBAL =====
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    window.toggleCart = toggleCart;
    
    // ===== START APP =====
    init();
});
