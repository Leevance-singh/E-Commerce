const path                  = require('path');
const multer                = require('multer');
const express               = require('express');
const userController        = require('../controllers/userController');
const { authenticateToken } = require('../Middleware/authMiddleware');

const router = express.Router();
//..................................................................🎫preliminaries🎫..................................................................

//.......................................................................Multor..........................................................................

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Generate unique filenames
    }
});

const upload = multer({ storage: storage });
//.......................................................................Multor.......................................................................

//.......................................................................ROUTES.......................................................................


router.get("/forgot",                  userController.renderForgotPassword);
router.post("/forgot",                 userController.handleForgotPassword);
router.post("/verify-otp-forgot",      userController.verifyOtpForgot);
router.post("/reset-password",         userController.handleResetPassword);
router.get("/login",                   userController.renderLogin); 
router.post("/login",                  userController.handleLogin);
router.get("/signup",                  userController.renderSignup);
router.post("/signup",                 userController.handleSignup);
router.post("/verify-otp",             userController.verifyOtpSignup);
router.post("/logout",                 userController.handleLogout);
router.get("/logout",                  userController.handleLogout);
router.get("/",                        userController.handleProducts);
router.get("/load-more-products",      userController.handleProducts);
router.get("/personal",                userController.handlePersonalPage);
router.get("/about",                   userController.handleAbout);
router.get("/cart",                    userController.renderCartPage);
router.get('/checkout',                userController.renderCheckout);
router.post('/cart/update',            userController.updateCart);
router.post("/cart-changes",           userController.handleCartChanges);
router.get('/product/description/:id', userController.getProductDescription);
router.get('/changePass',              userController.renderChangePass); 
router.post('/changePass',             userController.handleChangePass);
router.get('/seller',                  userController.renderSeller);
router.post('/changeAccountType',      userController.handleChangeAccountType);
router.get('/changeAccountType',       userController.renderChangeAccountType);

router.post('/seller',upload.single('image'),userController.handleSeller);

router.post('/seller/edit/:id',userController.handleEditProduct);
router.post('/seller/delete/:id', userController.handleDeleteProduct);


module.exports = router;
 