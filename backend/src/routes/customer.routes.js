import { Router } from 'express';
import path from 'path';
import multer from 'multer';
import customerAuth, { roleMiddleware } from '../middleware/customerAuth.js';
import * as auth from '../controllers/customer/auth.controller.js';
import * as products from '../controllers/customer/product.controller.js';
import * as cart from '../controllers/customer/cart.controller.js';
import * as orders from '../controllers/customer/order.controller.js';
import * as favorites from '../controllers/customer/favorite.controller.js';
import * as locations from '../controllers/customer/location.controller.js';
import * as notifications from '../controllers/customer/notification.controller.js';
import * as profile from '../controllers/customer/profile.controller.js';
import * as rider from '../controllers/customer/rider.controller.js';
import * as restaurants from '../controllers/customer/restaurant.controller.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Auth
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', customerAuth, auth.me);
router.post('/auth/refresh', customerAuth, auth.refreshToken);
router.post('/auth/logout', customerAuth, auth.logout);
router.post('/auth/forgot-password', auth.forgotPassword);
router.post('/auth/reset-password', auth.resetPassword);

// Products
router.get('/products/categories', products.getCategories);
router.get('/products/categories/:id', products.getCategoryByID);
router.get('/products', products.getProducts);
router.get('/products/:id', products.getProductByID);
router.post('/products', customerAuth, upload.single('image'), products.createProduct);
router.post('/products/:id/image', customerAuth, upload.single('image'), products.uploadProductImage);
router.patch('/products/:id/special-offer', customerAuth, products.toggleSpecialOffer);
router.get('/categories', products.getCategories);
router.get('/special-offers', products.getSpecialOffers);

// Cart
router.get('/cart', customerAuth, cart.getCart);
router.post('/cart', customerAuth, cart.addToCart);
router.post('/cart/items', customerAuth, cart.addToCart);
router.put('/cart/:id', customerAuth, cart.updateCartItem);
router.put('/cart/items/:id', customerAuth, cart.updateCartItem);
router.delete('/cart/:id', customerAuth, cart.removeCartItem);
router.delete('/cart/items/:id', customerAuth, cart.removeCartItem);
router.delete('/cart', customerAuth, cart.clearCart);

// Orders
router.post('/orders', customerAuth, orders.createOrder);
router.get('/orders', customerAuth, orders.getOrders);
router.get('/orders/pending', customerAuth, roleMiddleware(['rider']), orders.getPendingOrders);
router.get('/orders/delivered', customerAuth, orders.getDeliveredOrders);
router.get('/orders/:id', customerAuth, orders.getOrderByID);
router.put('/orders/:id/status', customerAuth, orders.updateOrderStatus);
router.put('/orders/:id/cancel', customerAuth, orders.cancelOrder);

// Profile
router.get('/profile', customerAuth, profile.getProfile);
router.put('/profile', customerAuth, profile.updateProfile);
router.post('/profile/avatar', customerAuth, upload.single('avatar'), profile.uploadAvatar);
router.put('/profile/avatar-url', customerAuth, profile.setAvatarUrl);

// Favorites
router.get('/favorites', customerAuth, favorites.getFavorites);
router.post('/favorites', customerAuth, favorites.addFavorite);
router.post('/favorites/:product_id', customerAuth, favorites.addFavoriteByProductId);
router.delete('/favorites/:id', customerAuth, favorites.removeFavorite);

// Locations
router.get('/locations', customerAuth, locations.getLocations);
router.post('/locations', customerAuth, locations.saveLocation);
router.put('/locations/:id', customerAuth, locations.updateLocation);
router.delete('/locations/:id', customerAuth, locations.deleteLocation);
router.post('/location', customerAuth, locations.saveLocation);
router.put('/location/:id', customerAuth, locations.updateLocation);
router.get('/address/current', customerAuth, locations.getCurrentAddress);
router.put('/address/current', customerAuth, locations.updateCurrentAddress);

// Notifications
router.get('/notifications', customerAuth, notifications.getNotifications);
router.put('/notifications/:id/read', customerAuth, notifications.markAsRead);

// Restaurants
router.get('/restaurants', restaurants.getRestaurants);
router.get('/restaurants/:id', restaurants.getRestaurantByID);
router.get('/restaurants/:id/products', restaurants.getRestaurantProducts);
router.put('/restaurants/:id/image', customerAuth, restaurants.updateRestaurantImage);
router.post('/restaurants/:id/rate', customerAuth, restaurants.rateRestaurant);

// Rider
router.get('/rider/dashboard', customerAuth, roleMiddleware(['rider']), rider.getDashboard);
router.get('/rider/earnings', customerAuth, roleMiddleware(['rider']), rider.getEarnings);
router.put('/rider/status', customerAuth, roleMiddleware(['rider']), rider.updateStatus);
router.get('/rider/orders/available', customerAuth, roleMiddleware(['rider']), rider.getAvailableOrders);
router.get('/rider/orders/active', customerAuth, roleMiddleware(['rider']), rider.getActiveOrders);
router.get('/rider/orders/completed', customerAuth, roleMiddleware(['rider']), rider.getCompletedOrders);
router.get('/rider/orders/:id', customerAuth, roleMiddleware(['rider']), rider.getRiderOrderById);
router.put('/rider/orders/:id/accept', customerAuth, roleMiddleware(['rider']), rider.acceptOrder);
router.put('/rider/orders/:id/start', customerAuth, roleMiddleware(['rider']), rider.startDelivery);
router.put('/rider/orders/:id/complete', customerAuth, roleMiddleware(['rider']), rider.completeDelivery);
router.post('/rider/location', customerAuth, roleMiddleware(['rider']), rider.updateLocation);
router.put('/rider/location', customerAuth, roleMiddleware(['rider']), rider.updateLocation);

export default router;
