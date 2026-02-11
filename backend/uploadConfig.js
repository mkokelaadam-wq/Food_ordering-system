/**
 * File Upload Configuration Module
 * Contains multer configuration for file uploads
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const createUploadDirectories = () => {
    const directories = [
        'public/uploads',
        'public/uploads/profiles',
        'public/uploads/menu',
        'public/uploads/restaurants',
        'public/uploads/categories',
        'public/uploads/orders'
    ];
    
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

// Call to create directories
createUploadDirectories();

// File filter function
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
    const allowedMimeTypes = /image\/(jpeg|png|gif|webp)/;
    
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Only image files are allowed (JPEG, PNG, GIF, WEBP)'));
    }
};

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'public/uploads/';
        
        // Determine upload directory based on file type
        if (req.baseUrl.includes('users') || req.path.includes('profile')) {
            uploadPath += 'profiles/';
        } else if (req.baseUrl.includes('menu')) {
            uploadPath += 'menu/';
        } else if (req.baseUrl.includes('restaurants')) {
            uploadPath += 'restaurants/';
        } else if (req.baseUrl.includes('categories')) {
            uploadPath += 'categories/';
        } else {
            uploadPath += 'general/';
        }
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = uuidv4();
        const fileExtension = path.extname(file.originalname);
        const filename = `${Date.now()}-${uniqueSuffix}${fileExtension}`;
        
        cb(null, filename);
    }
});

// File size limits
const limits = {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files per upload
};

// Multer upload configurations
const uploadConfig = {
    // Single file upload
    single: (fieldName) => {
        return multer({
            storage: storage,
            limits: limits,
            fileFilter: fileFilter
        }).single(fieldName);
    },
    
    // Multiple files upload
    array: (fieldName, maxCount) => {
        return multer({
            storage: storage,
            limits: limits,
            fileFilter: fileFilter
        }).array(fieldName, maxCount || 5);
    },
    
    // Multiple fields upload
    fields: (fields) => {
        return multer({
            storage: storage,
            limits: limits,
            fileFilter: fileFilter
        }).fields(fields);
    },
    
    // Any file upload (less restrictive)
    any: () => {
        return multer({
            storage: storage,
            limits: limits
        }).any();
    },
    
    // Profile picture upload (specific configuration)
    profilePicture: multer({
        storage: multer.diskStorage({
            destination: 'public/uploads/profiles/',
            filename: (req, file, cb) => {
                const userId = req.user?.id || 'anonymous';
                const fileExtension = path.extname(file.originalname);
                const filename = `profile-${userId}-${Date.now()}${fileExtension}`;
                cb(null, filename);
            }
        }),
        limits: {
            fileSize: 2 * 1024 * 1024 // 2MB for profile pictures
        },
        fileFilter: fileFilter
    }).single('avatar'),
    
    // Menu item image upload
    menuImage: multer({
        storage: multer.diskStorage({
            destination: 'public/uploads/menu/',
            filename: (req, file, cb) => {
                const restaurantId = req.params.restaurantId || req.body.restaurant_id || 'general';
                const fileExtension = path.extname(file.originalname);
                const filename = `menu-${restaurantId}-${Date.now()}${fileExtension}`;
                cb(null, filename);
            }
        }),
        limits: {
            fileSize: 3 * 1024 * 1024 // 3MB for menu images
        },
        fileFilter: fileFilter
    }).single('menu_image'),
    
    // Restaurant logo upload
    restaurantLogo: multer({
        storage: multer.diskStorage({
            destination: 'public/uploads/restaurants/logos/',
            filename: (req, file, cb) => {
                const restaurantId = req.params.id || 'new';
                const fileExtension = path.extname(file.originalname);
                const filename = `logo-${restaurantId}-${Date.now()}${fileExtension}`;
                cb(null, filename);
            }
        }),
        limits: {
            fileSize: 2 * 1024 * 1024 // 2MB for logos
        },
        fileFilter: fileFilter
    }).single('logo'),
    
    // Restaurant cover image upload
    restaurantCover: multer({
        storage: multer.diskStorage({
            destination: 'public/uploads/restaurants/covers/',
            filename: (req, file, cb) => {
                const restaurantId = req.params.id || 'new';
                const fileExtension = path.extname(file.originalname);
                const filename = `cover-${restaurantId}-${Date.now()}${fileExtension}`;
                cb(null, filename);
            }
        }),
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB for cover images
        },
        fileFilter: fileFilter
    }).single('cover_image'),
    
    // Category icon upload
    categoryIcon: multer({
        storage: multer.diskStorage({
            destination: 'public/uploads/categories/',
            filename: (req, file, cb) => {
                const categoryId = req.params.id || 'new';
                const fileExtension = path.extname(file.originalname);
                const filename = `category-${categoryId}-${Date.now()}${fileExtension}`;
                cb(null, filename);
            }
        }),
        limits: {
            fileSize: 1 * 1024 * 1024 // 1MB for icons
        },
        fileFilter: fileFilter
    }).single('icon'),
    
    // Get file URL helper
    getFileUrl: (filename, type = 'profile') => {
        if (!filename) return null;
        
        const baseUrl = process.env.APP_URL || 'http://localhost:5000';
        const uploadTypes = {
            profile: 'profiles',
            menu: 'menu',
            restaurant_logo: 'restaurants/logos',
            restaurant_cover: 'restaurants/covers',
            category: 'categories'
        };
        
        const uploadPath = uploadTypes[type] || 'uploads';
        return `${baseUrl}/uploads/${uploadPath}/${filename}`;
    },
    
    // Get relative file path
    getFilePath: (filename, type = 'profile') => {
        if (!filename) return null;
        
        const uploadTypes = {
            profile: 'profiles',
            menu: 'menu',
            restaurant_logo: 'restaurants/logos',
            restaurant_cover: 'restaurants/covers',
            category: 'categories'
        };
        
        const uploadPath = uploadTypes[type] || 'uploads';
        return `public/uploads/${uploadPath}/${filename}`;
    },
    
    // Delete file helper
    deleteFile: (filePath) => {
        return new Promise((resolve, reject) => {
            if (!filePath) return resolve(true);
            
            const fullPath = path.join(__dirname, '..', filePath);
            
            fs.unlink(fullPath, (err) => {
                if (err) {
                    // If file doesn't exist, that's okay
                    if (err.code === 'ENOENT') {
                        resolve(true);
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(true);
                }
            });
        });
    },
    
    // Validate file
    validateFile: (file) => {
        if (!file) {
            return { valid: false, error: 'No file uploaded' };
        }
        
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!allowedTypes.includes(file.mimetype)) {
            return { valid: false, error: 'Invalid file type. Only images are allowed.' };
        }
        
        if (file.size > 5 * 1024 * 1024) {
            return { valid: false, error: 'File size exceeds 5MB limit' };
        }
        
        return { valid: true, error: null };
    }
};

module.exports = uploadConfig;
