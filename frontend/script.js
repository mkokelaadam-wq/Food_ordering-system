// ===== FOODEXPRESS - MAIN JAVASCRIPT =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🍔 FoodExpress Loaded');
    
    // ===== CART SYSTEM =====
    let cart = JSON.parse(localStorage.getItem('foodexpress_cart')) || [];
    
    // Update cart count
    function updateCartCount() {
        const cartCounts = document.querySelectorAll('.cart-count');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        cartCounts.forEach(el => {
            el.textContent = totalItems;
        });
        
        // Also update cart page if exists
        const cartTotalItems = document.getElementById('cart-total-items');
        if (cartTotalItems) {
            cartTotalItems.textContent = totalItems;
        }
    }
    
    // Add to cart
    window.addToCart = function(item) {
        const existingItem = cart.find(i => i.id === item.id);
        
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            cart.push({
                ...item,
                quantity: 1
            });
        }
        
        localStorage.setItem('foodexpress_cart', JSON.stringify(cart));
        updateCartCount();
        showNotification(`${item.name} added to cart!`);
    };
    
    // Remove from cart
    window.removeFromCart = function(itemId) {
        cart = cart.filter(item => item.id !== itemId);
        localStorage.setItem('foodexpress_cart', JSON.stringify(cart));
        updateCartCount();
        
        // Refresh cart page if open
        if (window.location.pathname.includes('cart.html')) {
            displayCartItems();
        }
    };
    
    // Update quantity
    window.updateQuantity = function(itemId, change) {
        const item = cart.find(i => i.id === itemId);
        if (item) {
            item.quantity = (item.quantity || 1) + change;
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
    };
    
    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${message}
        `;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--success, #28a745);
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // ===== SEARCH FUNCTIONALITY =====
    const searchBtn = document.getElementById('search-food');
    const searchInput = document.getElementById('delivery-address');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', function() {
            const address = searchInput.value.trim();
            if (address) {
                localStorage.setItem('delivery_address', address);
                window.location.href = 'restaurants.html';
            } else {
                alert('Please enter your delivery address');
            }
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
    
    // ===== LOAD MENU ITEMS =====
    const menuContainer = document.getElementById('menu-items-container');
    if (menuContainer) {
        loadMenuItems();
    }
    
    function loadMenuItems() {
        const menuItems = [
            {
                id: 1,
                name: 'Chips Mayai',
                description: 'Crispy fries mixed with scrambled eggs',
                price: 5000,
                category: 'tanzanian',
                image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'
            },
            {
                id: 2,
                name: 'Nyama Choma',
                description: 'Grilled meat with kachumbari',
                price: 12000,
                category: 'tanzanian',
                image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'
            },
            {
                id: 3,
                name: 'Beef Burger',
                description: 'Juicy beef burger with cheese and veggies',
                price: 8000,
                category: 'burgers',
                image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'
            },
            {
                id: 4,
                name: 'Pepperoni Pizza',
                description: 'Classic pizza with pepperoni and cheese',
                price: 15000,
                category: 'pizza',
                image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'
            },
            {
                id: 5,
                name: 'Fresh Juice',
                description: 'Orange, Mango or Passion fruit',
                price: 3000,
                category: 'drinks',
                image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400'
            }
        ];
        
        let html = '';
        menuItems.forEach(item => {
            html += `
                <div class="menu-card" data-category="${item.category}">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="menu-card-content">
                        <h3>${item.name}</h3>
                        <p>${item.description}</p>
                        <div class="menu-card-footer">
                            <span class="price">Tsh ${item.price.toLocaleString()}</span>
                            <button class="add-to-cart" onclick='addToCart(${JSON.stringify(item)})'>
                                <i class="fas fa-cart-plus"></i> Add
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        menuContainer.innerHTML = html;
    }
    
    // Initialize cart count
    updateCartCount();
    
    // ===== URL PARAMETERS =====
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const restaurant = urlParams.get('restaurant');
    
    if (category && window.location.pathname.includes('menu.html')) {
        filterMenuByCategory(category);
    }
    
    function filterMenuByCategory(category) {
        const menuCards = document.querySelectorAll('.menu-card');
        menuCards.forEach(card => {
            if (card.dataset.category === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
});

// ===== EXPORT FUNCTIONS FOR GLOBAL USE =====
window.clearCart = function() {
    localStorage.removeItem('foodexpress_cart');
    window.location.reload();
};
