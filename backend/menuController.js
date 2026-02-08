const Menu = require('../models/Menu');

// Get all menu items
exports.getAllMenu = async (req, res) => {
    try {
        const menuItems = await Menu.getAll();
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get menu item by ID
exports.getMenuItem = async (req, res) => {
    try {
        const menuItem = await Menu.getById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        res.json(menuItem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get menu by category
exports.getByCategory = async (req, res) => {
    try {
        const menuItems = await Menu.getByCategory(req.params.category);
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
