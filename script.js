// Food Express - Frontend JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Food Express Website Loaded');
    
    // API Configuration
    const API_URL = 'http://localhost:5000/api';
    
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
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-container input');
    
    // Initialize
    function initialize() {
        updateCartCount();
        loadMenu();
        setupEventListeners();
        renderCartItems();
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
                btn.addEventListener('click', function() {
                    // Remove active class from all buttons
                    filterButtons.forEach(b => b.classList.remove('active'));
                    // Add active class to clicked button
                    this.classList.add('active');
                    // Filter menu
                    filterMenu(this.textContent.trim());
                });
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
        
        // Search functionality
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }
        
        // Listen for filter events from category cards
        document.addEventListener('filterMenu', function(e) {
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent.trim() === e.detail) {
                    btn.classList.add('active');
                }
            });
            filterMenu(e.detail);
        });
    }
    
    // Load menu from API
    async function loadMenu() {
        try {
            if (menuContainer) {
                menuContainer.innerHTML = '<div class="loading">Loading menu...<div class="loading-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>';
            }
            
            // Use fallback data (since API might not be available)
            useFallbackMenu();
            
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
                price: 5000,
                category: 'Tanzanian Food',
                image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 2,
                name: 'Nyama Choma',
                description: 'Grilled meat with kachumbari',
                price: 12000,
                category: 'Tanzanian Food',
                image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 3,
                name: 'Beef Burger',
                description: 'Juicy beef burger with cheese and veggies',
                price: 8000,
                category: 'Burgers',
                image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 4,
                name: 'Pepperoni Pizza',
                description: 'Classic pizza with pepperoni and cheese',
                price: 15000,
                category: 'Pizza',
                image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 5,
                name: 'Fresh Juice',
                description: 'Orange, Mango or Passion fruit',
                price: 3000,
                category: 'Drinks & Desserts',
                image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            },
            {
                id: 6,
                name: 'Chocolate Cake',
                description: 'Rich chocolate cake with frosting',
                price: 4500,
                category: 'Drinks & Desserts',
                image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
            }
        ];
        displayMenu(menuItems);
    }
    
    // Display menu items
    function displayMenu(items) {
        if (!menuContainer) return;
        
        menuContainer.innerHTML = '';
        
        if (items.length === 0) {
            menuContainer.innerHTML = '<div class="loading">No items found</div>';
            return;
        }
        
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
                            <i class="fas fa-cart-plus"></i> Add to Cart
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
        let filteredItems = menuItems;
        if (category !== 'All') {
            filteredItems = menuItems.filter(item => item.category === category);
        }
        displayMenu(filteredItems);
    }
    
    // Search functionality
    function performSearch() {
        if (!searchInput) return;
        
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
            displayMenu(menuItems);
            return;
        }
        
        const filteredItems = menuItems.filter(item => 
            item.name.toLowerCase().includes(query) || 
            item.description.toLowerCase().includes(query)
        );
        
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
                    <p style="color: #27ae60; font-weight: bold; margin-bottom: 5px;">Tsh ${itemTotal.toLocaleString()}</p>
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
        
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        
        if (!name || !phone || !address) {
            alert('Please fill all required fields');
            return;
        }
        
        const orderData = {
            name: name,
            phone: phone,
            address: address,
            payment_method: paymentMethod,
            items: cart,
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            order_date: new Date().toISOString()
        };
        
        try {
            // For now, simulate successful order
            simulateOrderSuccess(orderData);
            
        } catch (error) {
            console.error('Order error:', error);
            alert('There was an error processing your order. Please try again.');
        }
    }
    
    function simulateOrderSuccess(orderData) {
        // Generate order number
        const orderNumber = 'ORD-' + Date.now().toString().slice(-6);
        
        // Save order to localStorage
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push({
            order_number: orderNumber,
            ...orderData,
            status: 'Processing'
        });
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Show success message
        showNotification(`Order #${orderNumber} placed successfully!`);
        
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
        const orderFormSection = document.getElementById('order-form-section');
        if (orderFormSection) {
            orderFormSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Utility Functions
    function showNotification(message) {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(notif => notif.remove());
        
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
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-weight: 500;
            animation: slideIn 0.3s ease;
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
    
    // Initialize the app
    initialize();
});
