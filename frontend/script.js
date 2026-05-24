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
                const user = FoodExpressAPI.getUser && FoodExpressAPI.getUser();
                if (!user) {
                    showNotification('Please login to checkout', 'warning');
                    setTimeout(() => { window.location.href = 'login.html'; }, 500);
                    return;
                }
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
                    setTimeout(() => {
                        const menuSection = document.getElementById('menu');
                        if (menuSection) menuSection.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
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
                    showNotification(`🔍 Searching restaurants near ${address}...`, 'info');
                    setTimeout(() => {
                        const restaurantsSection = document.getElementById('restaurants');
                        if (restaurantsSection) restaurantsSection.scrollIntoView({ behavior: 'smooth' });
                    }, 500);
                } else {
                    showNotification('Please enter your delivery address', 'warning');
                }
            });
        }
    }
    
    function loadMenuItems() {
        if (!menuContainer) return;
        menuContainer.innerHTML = '<div class="loading" style="text-align:center; padding:40px; color:#666;">Loading delicious menu...</div>';
        
        setTimeout(() => {
            menuItems = [
                { id: 1, name: 'Chips Mayai', description: 'Crispy fries mixed with scrambled eggs', price: 5000, category: 'tanzanian', image: 'https://images.unsplash.com/photo-1585238341710-4dd0e06a3843?w=600' },
                { id: 2, name: 'Nyama Choma', description: 'Grilled beef with kachumbari', price: 12000, category: 'tanzanian', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600' },
                { id: 3, name: 'Beef Burger', description: 'Juicy beef patty with cheese', price: 8000, category: 'burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600' },
                { id: 4, name: 'Chicken Burger', description: 'Grilled chicken breast', price: 9000, category: 'burgers', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600' },
                { id: 5, name: 'Margherita Pizza', description: 'Tomato sauce, mozzarella, basil', price: 12000, category: 'pizza', image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600' },
                { id: 6, name: 'Pepperoni Pizza', description: 'Spicy pepperoni with cheese', price: 15000, category: 'pizza', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600' },
                { id: 7, name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice', price: 3500, category: 'drinks', image: 'https://images.unsplash.com/photo-1600271886742-f049cd1f3b00?w=600' },
                { id: 8, name: 'Chocolate Cake', description: 'Rich chocolate ganache', price: 4500, category: 'drinks', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600' }
            ];
            displayMenu(menuItems);
        }, 500);
    }
    
    function displayMenu(items) {
        if (!menuContainer) return;
        if (items.length === 0) {
            menuContainer.innerHTML = '<div class="loading" style="text-align:center; padding:40px; color:#999;">No items found</div>';
            return;
        }
        
        menuContainer.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'menu-card';
            card.style.cssText = `
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                transition: all 0.3s ease;
            `;
            card.innerHTML = `
                <div style="height: 200px; overflow: hidden; background: #f0f0f0;">
                    <img src="${item.image}" alt="${item.name}" loading="lazy" style="width:100%; height:100%; object-fit:cover; transition: transform 0.3s;">
                </div>
                <div style="padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">${item.name}</h3>
                    <p style="margin: 0 0 15px 0; color: #666; font-size: 14px; min-height: 40px;">${item.description}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 20px; font-weight: 700; color: #ff6b35;">Tsh ${item.price.toLocaleString()}</span>
                        <button class="add-to-cart" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" style="background: #ff6b35; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s;">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
            card.addEventListener('mouseenter', (e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(255,107,53,0.1)';
            });
            card.addEventListener('mouseleave', (e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
            });
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
        showNotification(`✅ ${name} added to cart!`, 'success');
        toggleCart(true);
    }
    
    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        renderCart();
        updateCartCount();
        showNotification('❌ Item removed', 'info');
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
            cartItemsContainer.innerHTML = '<div class="empty-cart" style="text-align:center; padding:40px;"><i class="fas fa-shopping-cart" style="font-size: 48px; color: #ddd; margin-bottom: 10px; display: block;"></i><p style="color: #999;">Your cart is empty</p></div>';
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
                <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee;">
                    <div>
                        <h4 style="margin: 0 0 5px 0; font-size: 16px;">${item.name}</h4>
                        <p style="margin: 0; color: #666; font-size: 13px;">Tsh ${item.price.toLocaleString()} x ${item.quantity}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="color: #28a745; font-weight: bold; margin: 0 0 10px 0; font-size: 16px;">Tsh ${total.toLocaleString()}</p>
                        <div style="display: flex; gap: 5px; justify-content: flex-end;">
                            <button onclick="window.updateQuantity(${item.id}, -1)" style="background: #ffc107; border: none; width: 28px; height: 28px; border-radius: 5px; cursor: pointer; font-weight: bold;">−</button>
                            <button onclick="window.updateQuantity(${item.id}, 1)" style="background: #28a745; color: white; border: none; width: 28px; height: 28px; border-radius: 5px; cursor: pointer; font-weight: bold;">+</button>
                            <button onclick="window.removeFromCart(${item.id})" style="background: #dc3545; color: white; border: none; width: 28px; height: 28px; border-radius: 5px; cursor: pointer;"><i class="fas fa-trash" style="font-size: 12px;"></i></button>
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
            document.body.style.overflow = 'hidden';
        } else {
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
    
    function showNotification(message, type = 'success') {
        const colors = { success: '#28a745', error: '#dc3545', warning: '#ffc107', info: '#17a2b8' };
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 3000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
        `;
        notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i> ${message}`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Add animations if not already present
    if (!document.querySelector('style[data-animations]')) {
        const style = document.createElement('style');
        style.setAttribute('data-animations', 'true');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
    
    init();
});
