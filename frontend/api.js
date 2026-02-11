// ============================================
// BACKEND API CONFIGURATION
// ============================================

// 🔥 Badilisha hii na URL ya backend yako baada ya kudeploy
const API_BASE_URL = 'http://localhost:5000/api'; // Local development
// const API_BASE_URL = 'https://foodexpress-backend.onrender.com/api'; // Production

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get auth token from localStorage
const getToken = () => localStorage.getItem('foodexpress_token');

// Set auth token
const setToken = (token) => {
    if (token) {
        localStorage.setItem('foodexpress_token', token);
    } else {
        localStorage.removeItem('foodexpress_token');
    }
};

// Get user from localStorage
const getUser = () => {
    const user = localStorage.getItem('foodexpress_user');
    return user ? JSON.parse(user) : null;
};

// Set user
const setUser = (user) => {
    if (user) {
        localStorage.setItem('foodexpress_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('foodexpress_user');
    }
};

// ============================================
// MAIN API REQUEST FUNCTION
// ============================================

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // Add authorization token if available
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers,
        credentials: 'include' // Important for cookies
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============================================
// 🔥 AUTH API CALLS (authRoutes.js)
// ============================================

const authAPI = {
    // POST /api/auth/register
    register: async (userData) => {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        return data;
    },
    
    // POST /api/auth/login
    login: async (credentials) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (data.success && data.token) {
            setToken(data.token);
            setUser(data.user);
        }
        
        return data;
    },
    
    // POST /api/auth/logout
    logout: async () => {
        const data = await apiRequest('/auth/logout', {
            method: 'POST'
        });
        
        setToken(null);
        setUser(null);
        
        return data;
    },
    
    // GET /api/auth/profile
    getProfile: async () => {
        return await apiRequest('/auth/profile');
    },
    
    // PUT /api/auth/profile
    updateProfile: async (profileData) => {
        const data = await apiRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
        
        if (data.success && data.user) {
            setUser(data.user);
        }
        
        return data;
    },
    
    // PUT /api/auth/change-password
    changePassword: async (passwordData) => {
        return await apiRequest('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify(passwordData)
        });
    },
    
    // POST /api/auth/forgot-password
    forgotPassword: async (email) => {
        return await apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },
    
    // POST /api/auth/reset-password/:token
    resetPassword: async (token, passwordData) => {
        return await apiRequest(`/auth/reset-password/${token}`, {
            method: 'POST',
            body: JSON.stringify(passwordData)
        });
    },
    
    // GET /api/auth/session
    checkSession: async () => {
        return await apiRequest('/auth/session');
    }
};

// ============================================
// 🔥 MENU API CALLS (menuRoutes.js)
// ============================================

const menuAPI = {
    // GET /api/menu
    getAll: async () => {
        return await apiRequest('/menu');
    },
    
    // GET /api/menu/:id
    getById: async (id) => {
        return await apiRequest(`/menu/${id}`);
    },
    
    // GET /api/menu/category/:category
    getByCategory: async (category) => {
        return await apiRequest(`/menu/category/${category}`);
    },
    
    // GET /api/menu/restaurant/:restaurantId
    getByRestaurant: async (restaurantId) => {
        return await apiRequest(`/menu/restaurant/${restaurantId}`);
    },
    
    // GET /api/menu/search
    search: async (query) => {
        return await apiRequest(`/menu/search?q=${encodeURIComponent(query)}`);
    },
    
    // POST /api/menu/favorite/:id (requires auth)
    addToFavorites: async (menuId) => {
        return await apiRequest(`/menu/favorite/${menuId}`, {
            method: 'POST'
        });
    },
    
    // DELETE /api/menu/favorite/:id (requires auth)
    removeFromFavorites: async (menuId) => {
        return await apiRequest(`/menu/favorite/${menuId}`, {
            method: 'DELETE'
        });
    },
    
    // GET /api/menu/favorites (requires auth)
    getFavorites: async () => {
        return await apiRequest('/menu/favorites');
    }
};

// ============================================
// 🔥 ORDER API CALLS (orderRoutes.js)
// ============================================

const orderAPI = {
    // POST /api/orders (requires auth)
    create: async (orderData) => {
        return await apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },
    
    // GET /api/orders (requires auth)
    getUserOrders: async () => {
        return await apiRequest('/orders');
    },
    
    // GET /api/orders/:id (requires auth)
    getById: async (orderId) => {
        return await apiRequest(`/orders/${orderId}`);
    },
    
    // PUT /api/orders/:id/cancel (requires auth)
    cancel: async (orderId) => {
        return await apiRequest(`/orders/${orderId}/cancel`, {
            method: 'PUT'
        });
    },
    
    // GET /api/orders/:id/track (requires auth)
    track: async (orderId) => {
        return await apiRequest(`/orders/${orderId}/track`);
    },
    
    // POST /api/orders/:id/reorder (requires auth)
    reorder: async (orderId) => {
        return await apiRequest(`/orders/${orderId}/reorder`, {
            method: 'POST'
        });
    }
};

// ============================================
// 🔥 CART API CALLS (cartRoutes.js)
// ============================================

const cartAPI = {
    // GET /api/cart (requires auth)
    getCart: async () => {
        return await apiRequest('/cart');
    },
    
    // POST /api/cart/add (requires auth)
    addToCart: async (item) => {
        return await apiRequest('/cart/add', {
            method: 'POST',
            body: JSON.stringify(item)
        });
    },
    
    // PUT /api/cart/:itemId (requires auth)
    updateQuantity: async (itemId, quantity) => {
        return await apiRequest(`/cart/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    },
    
    // DELETE /api/cart/:itemId (requires auth)
    removeFromCart: async (itemId) => {
        return await apiRequest(`/cart/${itemId}`, {
            method: 'DELETE'
        });
    },
    
    // DELETE /api/cart (requires auth)
    clearCart: async () => {
        return await apiRequest('/cart', {
            method: 'DELETE'
        });
    }
};

// ============================================
// 🔥 USER API CALLS (userRoutes.js)
// ============================================

const userAPI = {
    // GET /api/users/profile (requires auth)
    getProfile: async () => {
        return await apiRequest('/users/profile');
    },
    
    // PUT /api/users/profile (requires auth)
    updateProfile: async (profileData) => {
        return await apiRequest('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    },
    
    // GET /api/users/addresses (requires auth)
    getAddresses: async () => {
        return await apiRequest('/users/addresses');
    },
    
    // POST /api/users/addresses (requires auth)
    addAddress: async (address) => {
        return await apiRequest('/users/addresses', {
            method: 'POST',
            body: JSON.stringify(address)
        });
    },
    
    // PUT /api/users/addresses/:id (requires auth)
    updateAddress: async (id, address) => {
        return await apiRequest(`/users/addresses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(address)
        });
    },
    
    // DELETE /api/users/addresses/:id (requires auth)
    deleteAddress: async (id) => {
        return await apiRequest(`/users/addresses/${id}`, {
            method: 'DELETE'
        });
    },
    
    // POST /api/users/addresses/:id/default (requires auth)
    setDefaultAddress: async (id) => {
        return await apiRequest(`/users/addresses/${id}/default`, {
            method: 'POST'
        });
    }
};

// ============================================
// 🔥 RESTAURANT API CALLS (restaurantRoutes.js)
// ============================================

const restaurantAPI = {
    // GET /api/restaurants
    getAll: async () => {
        return await apiRequest('/restaurants');
    },
    
    // GET /api/restaurants/:id
    getById: async (id) => {
        return await apiRequest(`/restaurants/${id}`);
    },
    
    // GET /api/restaurants/:id/menu
    getMenu: async (id) => {
        return await apiRequest(`/restaurants/${id}/menu`);
    },
    
    // GET /api/restaurants/search
    search: async (query) => {
        return await apiRequest(`/restaurants/search?q=${encodeURIComponent(query)}`);
    },
    
    // POST /api/restaurants/:id/review (requires auth)
    addReview: async (id, review) => {
        return await apiRequest(`/restaurants/${id}/review`, {
            method: 'POST',
            body: JSON.stringify(review)
        });
    }
};

// ============================================
// EXPORT ALL APIs
// ============================================

window.FoodExpressAPI = {
    auth: authAPI,
    menu: menuAPI,
    order: orderAPI,
    cart: cartAPI,
    user: userAPI,
    restaurant: restaurantAPI,
    getToken,
    setToken,
    getUser,
    setUser
};
