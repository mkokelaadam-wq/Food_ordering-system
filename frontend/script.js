document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ FoodExpress Loaded');
    
    let cart = JSON.parse(localStorage.getItem('foodExpressCart')) || [];
    let menuItems = [];
    
    const cartBtn = document.getElementById('cart-btn');
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
    const searchBtn = document.getElementById('search-food');
    const searchInput = document.getElementById('delivery-address');
    
    function init() {
        updateCartCount();
        loadMenuItems();
        renderCart();
        setupEventListeners();
    }
    
    function setupEventListeners() {
        if (cartBtn) cartBtn.addEventListener('click', () => toggleCart(true));
        if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
        if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));
        if (continueShopping) continueShopping.addEventListener('click', () => toggleCart(false));
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                filterButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filterMenu(this.dataset.filter);
            });
        });
        
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function() {
                if (cart.length === 0) {
                    showNotification('Your cart is empty!', 'error');
                    return;
                }
                window.location.href = 'checkout.html';
            });
        }
        
        document.querySelectorAll('.category-card .btn-category').forEach(btn => {
            btn.addEventListener('click', function() {
                const category = this.closest('.category-card').dataset.category;
                const filterBtn = Array.from(filterButtons).find(b => b.dataset.filter === category);
                if (filterBtn) {
                    filterBtn.click();
                    document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
        
        document.querySelectorAll('.btn-order').forEach(btn => {
            btn.addEventListener('click', function() {
                window.location.href = 'menu.html';
            });
        });
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', function() {
                const address = searchInput.value.trim();
                if (address) {
                    showNotification(`Searching restaurants near ${address}...`, 'info');
                    setTimeout(() => window.location.href = '#restaurants', 1000);
                } else {
                    showNotification('Please enter your delivery address', 'warning');
                }
            });
        }
    }
    
    function loadMenuItems() {
        if (!menuContainer) return;
        menuContainer.innerHTML = '<div class="loading">Loading delicious menu...</div>';
        
        setTimeout(() => {
            menuItems = [
                { id: 1, name: 'Chips Mayai', description: 'Crispy fries mixed with scrambled eggs', price: 5000, category: 'tanzanian', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600' },
                { id: 2, name: 'Nyama Choma', description: 'Grilled beef with kachumbari', price: 12000, category: 'tanzanian', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600' },
                { id: 3, name: 'Beef Burger', description: 'Juicy beef patty with cheese', price: 8000, category: 'burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600' },
                { id: 4, name: 'Chicken Burger', description: 'Grilled chicken breast', price: 9000, category: 'burgers', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600' },
                { id: 5, name: 'Margherita Pizza', description: 'Tomato sauce, mozzarella, basil', price: 12000, category: 'pizza', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600' },
                { id: 6, name: 'Pepperoni Pizza', description: 'Spicy pepperoni with cheese', price: 15000, category: 'pizza', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600' },
                { id: 7, name: 'Fresh Juice', description: 'Orange, Mango or Passion', price: 3500, category: 'drinks', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600' },
                { id: 8, name: 'Chocolate Cake', description: 'Rich chocolate ganache', price: 4500, category: 'drinks', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600' }
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
        
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', addToCart);
        });
    }
    
    function filterMenu(category) {
        if (category === 'all') {
            displayMenu(menuItems);
        } else {
            displayMenu(menuItems.filter(item => item.category === category));
        }
    }
    
    function addToCart(e) {
        const id = parseInt(e.currentTarget.dataset.id);
        const name = e.currentTarget.dataset.name;
        const price = parseInt(e.currentTarget.dataset.price);
        
        const existing = cart.find(item => item.id === id);
        if (existing) {
            existing.quantity++;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }
        
        saveCart();
        renderCart();
        updateCartCount();
        showNotification(`${name} added to cart!`);
        toggleCart(true);
    }
    
    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        renderCart();
        updateCartCount();
        showNotification('Item removed', 'info');
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
            cartItemsContainer.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart" style="font-size: 48px; color: #ddd;"></i><p>Your cart is empty</p></div>';
            cartSubtotal.textContent = 'Tsh 0';
            cartDelivery.textContent = 'Tsh 0';
            cartTotal.textContent = 'Tsh 0';
            return;
        }
        
        let subtotal = 0;
        let html = '';
        
        cart.forEach(item => {
            const total = item.price * item.quantity;
            subtotal += total;
            html += `
                <div class="cart-item">
                    <div>
                        <h4>${item.name}</h4>
                        <p>Tsh ${item.price.toLocaleString()} x ${item.quantity}</p>
                    </div>
                    <div>
                        <p style="color: #28a745; font-weight: bold;">Tsh ${total.toLocaleString()}</p>
                        <div style="display: flex; gap: 5px; justify-content: flex-end;">
                            <button onclick="window.updateQuantity(${item.id}, -1)" style="background: #ffc107; border: none; width: 30px; height: 30px; border-radius: 5px;">-</button>
                            <button onclick="window.updateQuantity(${item.id}, 1)" style="background: #28a745; color: white; border: none; width: 30px; height: 30px; border-radius: 5px;">+</button>
                            <button onclick="window.removeFromCart(${item.id})" style="background: #dc3545; color: white; border: none; width: 30px; height: 30px; border-radius: 5px;"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        const delivery = subtotal > 0 ? 2500 : 0;
        cartItemsContainer.innerHTML = html;
        cartSubtotal.textContent = `Tsh ${subtotal.toLocaleString()}`;
        cartDelivery.textContent = `Tsh ${delivery.toLocaleString()}`;
        cartTotal.textContent = `Tsh ${(subtotal + delivery).toLocaleString()}`;
    }
    
    function saveCart() {
        localStorage.setItem('foodExpressCart', JSON.stringify(cart));
    }
    
    function updateCartCount() {
        if (cartCount) {
            const total = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = total;
        }
    }
    
    function toggleCart(open) {
        if (!cartSidebar || !cartOverlay) return;
        if (open) {
            cartSidebar.classList.add('active');
            cartOverlay.classList.add('active');
        } else {
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
        }
    }
    
    function showNotification(message, type = 'success') {
        const colors = { success: '#28a745', error: '#dc3545', warning: '#ffc107', info: '#17a2b8' };
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.background = colors[type];
        notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    
    init();
});
