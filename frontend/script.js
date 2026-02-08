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
    
    // Initialize
    updateCartCount();
    loadMenu();
    setupEventListeners();
    
    // Event Listeners Setup
    function setupEventListeners() {
        // Cart toggle
        cartBtn.addEventListener('click', toggleCart);
        closeCartBtn.addEventListener('click', toggleCart);
        
        // Filter buttons
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => filterMenu(btn.textContent));
        });
        
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
                document.querySelector('.order-form').scrollIntoView({ behavior: 'smooth' });
            });
        }
    }
    
    // Load menu from API
    async function loadMenu() {
        try {
            menuContainer.innerHTML = '<div class="loading">Loading menu...</div>';
            
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
                category: 'Breakfast',
                image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 2,
                name: 'Chicken Curry',
                description: 'Spicy chicken curry with rice',
                price: 8000,
                category: 'Lunch',
                image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 3,
                name: 'Nyama Choma',
                description: 'Grilled meat with kachumbari',
                price: 12000,
                category: 'Dinner',
                image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 4,
                name: 'Fresh Juice',
                description: 'Orange, Mango or Passion fruit',
                price: 2000,
                category: 'Drinks',
                image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 5,
                name: 'Pilau',
                description: 'Spiced rice with tender beef',
                price: 6000,
                category: 'Lunch',
                image_url: 'https://images.unsplash.com/photo-1585937421612-70ca003675ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 6,
                name: 'Fruit Salad',
                description: 'Mixed seasonal fruits with yogurt',
                price: 3500,
                category: 'Dessert',
                image_url: 'https://images.unsplash.com/photo-1564093497595-593b96d80180?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            }
        ];
        displayMenu(menuItems);
    }
    
    // Display menu items
    function displayMenu(items) {
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
            if (btn.textContent === category) {
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
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    function renderCartItems() {
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
                    <p>Tsh ${itemTotal.toLocaleString()}</p>
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
        
        const orderData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            payment_method: document.querySelector('input[name="payment"]:checked').value,
            items: cart.map(item => ({
                id: item.id,
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
                alert('Order placed successfully! Order #' + result.order.order_number);
                
                // Clear cart and form
                cart = [];
                localStorage.removeItem('cart');
                orderForm.reset();
                updateCart();
                toggleCart();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.error || 'Failed to place order'));
            }
        } catch (error) {
            console.error('Order error:', error);
            alert('Network error. Please check your connection.');
        }
    }
    
    function proceedToCheckout() {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        toggleCart();
        document.querySelector('.order-form').scrollIntoView({ behavior: 'smooth' });
    }
    
    // Utility Functions
    function showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 1rem 2rem;
            border-radius: 5px;
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Add CSS for animations
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
    
    // Initial cart render
    renderCartItems();
});
