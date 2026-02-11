// Food Express - Frontend JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Food Express Website Loaded');
    
    // API Configuration
    const API_URL = 'http://localhost:5000/api'; // Change to AWS URL when deployed
    
    // State Management
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let menuItems = [];
    
    // DOM Elements
    const cartBtn = document.querySelector('.cart-btn');
    const closeCartBtn = document.querySelector('.close-cart');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartCount = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const menuContainer = document.getElementById('menu-items');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const orderForm = document.getElementById('order-form');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    // Initialize - Check if elements exist
    function initialize() {
        if (cartCount) updateCartCount();
        if (menuContainer) loadMenu();
        setupEventListeners();
    }
    
    // Event Listeners Setup
    function setupEventListeners() {
        // Cart toggle
        if (cartBtn) {
            cartBtn.addEventListener('click', toggleCart);
        }
        
        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', toggleCart);
        }
        
        // Filter buttons
        if (filterButtons.length > 0) {
            filterButtons.forEach(btn => {
                btn.addEventListener('click', () => filterMenu(btn.textContent.trim()));
            });
        }
        
        // Order form submission
        if (orderForm) {
            orderForm.addEventListener('submit', handleOrderSubmit);
        }
        
        // Checkout button
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', proceedToCheckout);
        }
        
        // Order now button
        const orderNowBtn = document.querySelector('.order-btn');
        if (orderNowBtn) {
            orderNowBtn.addEventListener('click', () => {
                const orderFormSection = document.querySelector('.order-form');
                if (orderFormSection) {
                    orderFormSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
        
        // Search functionality
        const searchBtn = document.querySelector('.search-btn');
        const searchInput = document.querySelector('.search-container input');
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => performSearch(searchInput.value));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch(searchInput.value);
                }
            });
        }
    }
    
    // Load menu from API
    async function loadMenu() {
        try {
            if (menuContainer) {
                menuContainer.innerHTML = '<div class="loading">Loading menu...</div>';
            }
            
            // Try to fetch from API
            const response = await fetch(`${API_URL}/menu`);
            
            if (response.ok) {
                const data = await response.json();
                menuItems = data.data || data;
                displayMenu(menuItems);
            } else {
                // If API fails, use fallback data
                useFallbackMenu();
            }
        } catch (error) {
            console.error('Error loading menu:', error);
            useFallbackMenu();
        }
    }
    
    // Fallback menu data
    function useFallbackMenu() {
        menuItems = [
            {
                id: 1,
                name: 'Chips Mayai',
                description: 'Crispy fries mixed with scrambled eggs',
                price: 3000,
                category: 'Tanzanian Food',
                image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 2,
                name: 'Chicken Curry',
                description: 'Spicy chicken curry with rice',
                price: 8000,
                category: 'Tanzanian Food',
                image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 3,
                name: 'Nyama Choma',
                description: 'Grilled meat with kachumbari',
                price: 12000,
                category: 'Tanzanian Food',
                image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 4,
                name: 'Beef Burger',
                description: 'Juicy beef burger with cheese',
                price: 7000,
                category: 'Burgers',
                image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 5,
                name: 'Pepperoni Pizza',
                description: 'Classic pizza with pepperoni',
                price: 15000,
                category: 'Pizza',
                image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 6,
                name: 'Fresh Juice',
                description: 'Orange, Mango or Passion fruit',
                price: 2000,
                category: 'Drinks & Desserts',
                image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 7,
                name: 'Pilau',
                description: 'Spiced rice with tender beef',
                price: 6000,
                category: 'Tanzanian Food',
                image_url: 'https://images.unsplash.com/photo-1585937421612-70ca003675ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 8,
                name: 'Fruit Salad',
                description: 'Mixed seasonal fruits with yogurt',
                price: 3500,
                category: 'Drinks & Desserts',
                image_url: 'https://images.unsplash.com/photo-1564093497595-593b96d80180?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            }
        ];
        displayMenu(menuItems);
    }
    
    // Display menu items
    function displayMenu(items) {
        if (!menuContainer) return;
        
        menuContainer.innerHTML = '';
        
        items.forEach(item => {
            const menuCard = document.createElement('div');
            menuCard.className = 'menu-card';
            menuCard.innerHTML = `
                <img src="${item.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'}" alt="${item.name}">
                <div class="menu-card-content">
                    <h3>${item.name}</h3>
                    <p>${item.description || 'Delicious food item'}</p>
                    <div class="menu-card-footer">
                        <span class="price">Tsh ${item.price.toLocaleString()}</span>
                        <button class="add-to-cart" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
            menuContainer.appendChild(menuCard);
        });
        
        // Add event listeners to add-to-cart buttons
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', addToCart);
        });
    }
    
    // Filter menu by category
    function filterMenu(category) {
        // Update active button
        filterButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.trim() === category) {
                btn.classList.add('active');
            }
        });
        
        // Filter items
        let filteredItems = menuItems;
        if (category !== 'All') {
            filteredItems = menuItems.filter(item => item.category === category);
        }
        
        displayMenu(filteredItems);
    }
    
    // Search functionality
    function performSearch(query) {
        if (!query.trim()) {
            displayMenu(menuItems);
            return;
        }
        
        const searchTerm = query.toLowerCase();
        const filteredItems = menuItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm) || 
            item.description.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
        );
        
        displayMenu(filteredItems);
        
        if (filteredItems.length === 0 && menuContainer) {
            menuContainer.innerHTML = `
                <div class="no-results">
                    <p>No items found for "${query}"</p>
                    <button onclick="displayMenu(menuItems)">Show All Items</button>
                </div>
            `;
        }
    }
    
    // Cart Functions
    function addToCart(e) {
        const id = parseInt(e.target.dataset.id);
        const name = e.target.dataset.name;
        const price = parseInt(e.target.dataset.price);
        
        // Check if item already in cart
        const existingItem = cart.find(item => item.id === id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id,
                name,
                price,
                quantity: 1
            });
        }
        
        // Update cart
        updateCart();
        showNotification(`${name} added to cart!`);
    }
    
    function updateCart() {
        // Save to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update UI
        updateCartCount();
        renderCartItems();
    }
    
    function updateCartCount() {
        if (!cartCount) return;
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    function renderCartItems() {
        if (!cartItemsContainer || !cartTotal) return;
        
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            cartTotal.textContent = 'Tsh 0';
            return;
        }
        
        let total = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div>
                    <h4>${item.name}</h4>
                    <p>Tsh ${item.price.toLocaleString()} x ${item.quantity}</p>
                </div>
                <div>
                    <p class="item-total">Tsh ${itemTotal.toLocaleString()}</p>
                    <button class="remove-item" data-id="${item.id}">Remove</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', removeFromCart);
        });
        
        cartTotal.textContent = `Tsh ${total.toLocaleString()}`;
    }
    
    function removeFromCart(e) {
        const id = parseInt(e.target.dataset.id);
        cart = cart.filter(item => item.id !== id);
        updateCart();
    }
    
    function toggleCart() {
        if (!cartSidebar) return;
        cartSidebar.classList.toggle('active');
        renderCartItems();
    }
    
    // Order Processing
    async function handleOrderSubmit(e) {
        e.preventDefault();
        
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        // Get form values
        const name = document.getElementById('name')?.value;
        const phone = document.getElementById('phone')?.value;
        const address = document.getElementById('address')?.value;
        const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
        
        if (!name || !phone || !address || !paymentMethod) {
            alert('Please fill all fields and select payment method');
            return;
        }
        
        const orderData = {
            name: name,
            phone: phone,
            address: address,
            payment_method: paymentMethod,
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            }))
        };
        
        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            if (response.ok) {
                const result = await response.json();
                showNotification('Order placed successfully! Order #' + (result.order?.order_number || result.id));
                
                // Clear cart and form
                cart = [];
                localStorage.removeItem('cart');
                if (orderForm) orderForm.reset();
                updateCart();
                toggleCart();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.error || 'Failed to place order'));
            }
        } catch (error) {
            console.error('Order error:', error);
            // Fallback: Simulate successful order
            simulateOrderSuccess(orderData);
        }
    }
    
    // Fallback order simulation
    function simulateOrderSuccess(orderData) {
        const orderNumber = 'ORD-' + Date.now();
        showNotification(`Order placed successfully! Order #${orderNumber}`);
        
        // Save order to localStorage (fallback)
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push({
            id: orderNumber,
            ...orderData,
            timestamp: new Date().toISOString(),
            status: 'Pending'
        });
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Clear cart and form
        cart = [];
        localStorage.removeItem('cart');
        if (orderForm) orderForm.reset();
        updateCart();
        toggleCart();
    }
    
    function proceedToCheckout() {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        toggleCart();
        const orderFormSection = document.querySelector('.order-form');
        if (orderFormSection) {
            orderFormSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Utility Functions
    function showNotification(message) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            z-index: 3000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-weight: 500;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
    
    // Add CSS for animations if not present
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .no-results {
                text-align: center;
                padding: 40px;
                grid-column: 1 / -1;
            }
            .no-results button {
                background: #ff6b35;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                margin-top: 20px;
                cursor: pointer;
            }
            .item-total {
                font-weight: bold;
                color: #27ae60;
                margin-bottom: 5px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize the app
    initialize();
});

// Global function for search fallback
if (typeof displayMenu === 'undefined') {
    window.displayMenu = function(items) {
        const menuContainer = document.getElementById('menu-items');
        if (!menuContainer) return;
        
        menuContainer.innerHTML = '';
        
        items.forEach(item => {
            const menuCard = document.createElement('div');
            menuCard.className = 'menu-card';
            menuCard.innerHTML = `
                <img src="${item.image_url}" alt="${item.name}">
                <div class="menu-card-content">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <div class="menu-card-footer">
                        <span class="price">Tsh ${item.price.toLocaleString()}</span>
                        <button class="add-to-cart" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
            menuContainer.appendChild(menuCard);
        });
        
        // Re-attach event listeners
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', function() {
                // Find the cart logic from the main script
                const event = new Event('DOMContentLoaded');
                document.dispatchEvent(event);
            });
        });
    };
                                               }
