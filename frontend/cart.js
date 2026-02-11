// ===== FOODEXPRESS - CART SYSTEM =====
class FoodExpressCart {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('foodexpress_cart')) || [];
        this.init();
    }
    
    init() {
        this.updateCartCount();
        
        if (window.location.pathname.includes('cart.html')) {
            this.displayCartPage();
        }
    }
    
    updateCartCount() {
        const cartCounts = document.querySelectorAll('.cart-count');
        const totalItems = this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        cartCounts.forEach(el => {
            el.textContent = totalItems;
        });
    }
    
    displayCartPage() {
        const container = document.getElementById('cart-items-container');
        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');
        const emptyCartEl = document.getElementById('empty-cart');
        
        if (!container) return;
        
        if (this.cart.length === 0) {
            if (emptyCartEl) emptyCartEl.style.display = 'block';
            container.innerHTML = '';
            if (subtotalEl) subtotalEl.textContent = 'Tsh 0';
            if (totalEl) totalEl.textContent = 'Tsh 0';
            return;
        }
        
        if (emptyCartEl) emptyCartEl.style.display = 'none';
        
        let html = '';
        let subtotal = 0;
        
        this.cart.forEach(item => {
            const itemTotal = item.price * (item.quantity || 1);
            subtotal += itemTotal;
            
            html += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>Tsh ${item.price.toLocaleString()} × ${item.quantity || 1}</p>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-controls">
                            <button class="quantity-btn minus" onclick="cartSystem.updateQuantity('${item.id}', -1)">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity">${item.quantity || 1}</span>
                            <button class="quantity-btn plus" onclick="cartSystem.updateQuantity('${item.id}', 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <span class="item-total">Tsh ${itemTotal.toLocaleString()}</span>
                        <button class="remove-btn" onclick="cartSystem.removeItem('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        const deliveryFee = subtotal > 20000 ? 0 : 2500;
        const serviceFee = 1000;
        const total = subtotal + deliveryFee + serviceFee;
        
        container.innerHTML = html;
        if (subtotalEl) subtotalEl.textContent = `Tsh ${subtotal.toLocaleString()}`;
        if (totalEl) totalEl.textContent = `Tsh ${total.toLocaleString()}`;
        
        // Update summary
        const subtotalSpan = document.getElementById('summary-subtotal');
        const deliverySpan = document.getElementById('summary-delivery');
        const serviceSpan = document.getElementById('summary-service');
        const totalSpan = document.getElementById('summary-total');
        
        if (subtotalSpan) subtotalSpan.textContent = `Tsh ${subtotal.toLocaleString()}`;
        if (deliverySpan) deliverySpan.textContent = `Tsh ${deliveryFee.toLocaleString()}`;
        if (serviceSpan) serviceSpan.textContent = `Tsh ${serviceFee.toLocaleString()}`;
        if (totalSpan) totalSpan.textContent = `Tsh ${total.toLocaleString()}`;
    }
    
    addItem(item) {
        const existingItem = this.cart.find(i => i.id === item.id);
        
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            this.cart.push({
                ...item,
                quantity: 1
            });
        }
        
        this.saveCart();
        this.showNotification(`${item.name} added to cart!`);
    }
    
    removeItem(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCart();
        this.showNotification('Item removed from cart');
    }
    
    updateQuantity(itemId, change) {
        const item = this.cart.find(i => i.id === itemId);
        if (item) {
            item.quantity = (item.quantity || 1) + change;
            if (item.quantity <= 0) {
                this.removeItem(itemId);
            } else {
                this.saveCart();
            }
        }
    }
    
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.showNotification('Cart cleared');
    }
    
    saveCart() {
        localStorage.setItem('foodexpress_cart', JSON.stringify(this.cart));
        this.updateCartCount();
        if (window.location.pathname.includes('cart.html')) {
            this.displayCartPage();
        }
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${message}
        `;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #28a745;
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
}

// Initialize cart system
const cartSystem = new FoodExpressCart();
window.cartSystem = cartSystem;
