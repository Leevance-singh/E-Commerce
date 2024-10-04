const fs            = require('fs');
const jwt           = require('jsonwebtoken');
const path          = require('path');
const User          = require('../models/userModel');
const Product       = require('../models/productModel'); 
const sendmail      = require('./loginmail');
const userdatamodel = require('../models/userdatamodel');

const secret_key    = "There's nothing we can do!";

//.........................................................................🎫preliminaries🎫..............................................................
const multer = require('multer');
const storage = multer.diskStorage
({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
})
function checkFileType(file, cb) {
return true  ;
}//for now it is empty.

//...........................................................................🎆Functions🎆................................................................
//Forgot password render
exports.renderForgotPassword = (req, res) => { 
    console.log("----entered the forgot page(render)");
    res.render("forgot", { otpSent: false });
}; 
// Handle Forgot Password and OTP sending
exports.handleForgotPassword = async (req, res) => {
    console.log("----entered the forgot handle (request function)");
    //whole function for if user found or not
    const { email } = req.body;
    console.log("----",email);
     const particularuser = await User.findOne({ email: email });
     console.log("----",particularuser);

    if(particularuser){
        await sendmail.sendOtp(email);
        res.render("forgot", { otpSent: true, email });
    } 
    else {
        const message = "The user Doesnt exist ! , try to sign up instead!" ;
        res.render("signup", { message }); 
    }
};
// Verify OTP for Forgot Password
exports.verifyOtpForgot = async (req, res) => {
    console.log("----Verify otp page");

    const { email, otp } = req.body;
    try {
        const otpValid = await sendmail.verifyOtp(email, otp);
        if (!otpValid) {
            return res.send("Invalid OTP. Please try again.");
        }
        res.render("reset-password", { email });
    } catch (error) {
        const message = "Invalid otp , please try again!" ;
        res.render("login",{ message });
    }
};
// Handle Reset Password
exports.handleResetPassword = async (req, res) => {
    console.log("----reset password page handle");
    const { email, otp, newPassword } = req.body;
    try {
        const isOtpValid = await sendmail.verifyOtp(email, otp);
        if (!isOtpValid) {
            return res.send("Invalid OTP. Please try again.");
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.send("User not found.");
        }

        user.password = newPassword;
        await user.save();
        res.redirect("/login");
    } catch (error) {
        res.send("Error pakdo:",error);
    }
};
// Render Login page
exports.renderLogin = (req, res) => {
    console.log("----login page render");

    let token = req.cookies.token  ;
    if(!token){
    res.render("login",{undefined});}
    else{
        res.redirect("/");}
};
// Handle Login 
 exports.handleLogin = async (req, res) => {
    console.log("----login page handle");

    const token = res.cookie.token ;
    const { username, password } = req.body;
    const particularuser = await User.findOne({ name: username });
        //successfull login
    if (particularuser && particularuser.password === password) {
        const token = jwt.sign({ id: particularuser._id }, secret_key, { expiresIn: '100h' });
        res.cookie('token', token, { httpOnly: true });
        console.log("----token:",token);
        res.redirect("/");
    } else {
        // If the username or password is wrong, send the error message
        if(!particularuser)
            {
                const message = "Invalid Username!";
                res.render("login", { message });
            }
        else
        {
            const message = "Invalid Password!";
                res.render("login", { message });
        }
    }
};
// Render Signup page
exports.renderSignup = (req, res) => {
    console.log("----signup page render");

    const message = "Welcome new user !" ;
    res.render("signup", { message });
};
// Handle Signup and OTP sending
exports.handleSignup = async (req, res) => {
    console.log("----signup page handle");
    const {email} = req.body ;
    let x = await User.findOne({email}) ;
    if(!x)
    {
        const { email, username, password } = req.body;
        await sendmail.sendOtp(email);
        res.render("otp_verification", { email, username, password });
    }
    else{
        const message = "You are already a User" ;
        res.render("login",{message})
}};
// Verify OTP for Signup
exports.verifyOtpSignup = async (req, res) => {
    console.log("----verify otp for signup page");
    const { email, username, password, otp } = req.body;
    if (!email || !username || !password) {
        return res.send("Missing required fields: email, username, or password.");
    }

    try {
        const isOtpValid = await sendmail.verifyOtp(email, otp);
        if (!isOtpValid) {
            return res.send("Invalid OTP. Please try again.");
        }
        await createNewUser("user", email, username, password);
        res.redirect("/login");
    } catch (error) {
        console.error("----","Error during OTP verification:", error);
        res.send("An error occurred during OTP verification. Please try again.");
}
};
// Render Index page
// exports.renderIndex = (req, res) => {
//     console.log("----Index page");

//     res.render("index", { userId: req.user.id });
// };
// Handle Logout
exports.handleLogout = (req, res) => {
    console.log("----User logged out and is at the login page");
    const message = "You have been logged out!" ;
    res.clearCookie('token');
    res.render('login',{ message }); 
};
exports.handleProducts = async (req, res) => {
    try {
        console.log("----handling products page status:good");
        const page = parseInt(req.query.page) || 1; 
        const limit = 5; 
        const skip = (page - 1) * limit;

        const products = await Product.find().skip(skip).limit(limit);

        if (page === 1) {
            res.render("home_products", { products });
        } else {
            res.json(products);
        }
    } catch (error) {
        console.log("----handling products function status:bad");
        console.error("----","Error fetching products:", error);
        res.status(500).send("Error retrieving products");
    }
};
exports.handlePersonalPage = async (req, res) =>
{
    console.log("----handling personal page");
    let get_result_status = tokenworkingornot(req,res) ;
    console.log("Status is...........",get_result_status);
    if(get_result_status)
    {
        let token = req.cookies.token  ;
        const decode = jwt.verify(token, secret_key);
        req.user = decode;
        const current_user = await User.findOne( {_id : req.user.id} ) ;
        let current_user_info = current_user.name ;
            const personal_info = 
            {
                id : req.user.id,
                name : current_user.name,
                email : current_user.email
            } ;

            console.log("----personal info requested: ",personal_info); 
            res.render("personal_page",{personal_info}) ;
    }
    else
    {
        const message  = "You are not Logged in Yet !!" ;
        res.render("login", { message })  ;
    }

         

};
exports.handleAbout =  (req, res) =>
{
    console.log("----rendering about page");
    res.render("about") ;
};
//............................................................cart! cart! cart!.....................................................................
exports.handleCartPage = async (req, res) =>
{
        console.log("----displaying cart page");
        res.render("cart") ;
};
exports.handleCartChanges = async (req,res) =>
{
    console.log("----Inside cart handling function"); 
    const current_product_id  = req.body.product_id ;
    let current_product_stock_check = await Product.findOne({_id:current_product_id}) ;
    let current_product_stock_check_amount = current_product_stock_check.stock ;
    let token = req.cookies.token  ;

    if(!req.cookies.token)
    { 
        console.log("----","No any user found for cart");
        return res.send(JSON.stringify({data:"You need to login first"})) ;
    }
    else
    {
      if(current_product_stock_check_amount<=0)
      { 
        console.log("----","No more stocks left!"); 
        return res.send(JSON.stringify({data:"Sorry!...No more stocks left"})) ;
      }
      else
      {
        console.log("----stocks are being  transferred to the user's account."); 
        const decode = jwt.verify(token, secret_key);
        req.user = decode;
        let current_cart_user = await User.findOne( { _id:req.user.id } ) ;
            console.log("----",current_product_id);

        addProductToUser(req.user.id,{ product_id: current_product_id, stock: "1" })

        return res.send(JSON.stringify({data:"Product added to the cart Successfully"})) ;
      }
    
    }
}
exports.renderCartPage = async (req, res) => {
    console.log("----Cart page rendering");
    let token = req.cookies.token;

    if (!token) {
        const message = "You need to log in first!";
        return res.render("login", { message });
    }

    try {
        const decoded = jwt.verify(token, secret_key);
        const userId = decoded.id;

        const userCart = await userdatamodel.findOne({ _id: userId });

        // If no cart or cart is empty, render empty cart
        if (!userCart || !userCart.products.length) {
            return res.render("cart", { cartItems: [], totalPrice: 0 });
        }

        let totalPrice = 0;
        let cartItems = [];

        for (let item of userCart.products) {
            const productDetails = await Product.findById(item.product_id);

            if (productDetails) {
                const totalForItem = productDetails.price * item.stock;
                totalPrice += totalForItem;

                cartItems.push({
                    product_id: productDetails._id,
                    name: productDetails.product_name,
                    price: productDetails.price,
                    image: productDetails.image,
                    stock: item.stock,
                    totalForItem: totalForItem,
                });
            }
        }

        res.render("cart", { cartItems, totalPrice });
    } catch (error) {
        console.error("Error rendering cart page:", error);
        res.status(500).send("Error retrieving cart items");
    }
};
exports.updateCart = async (req, res) => {
    console.log("----cart update function called....");
    const { product_id, action } = req.body;
    let token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ success: false, message: "You need to login first!" });
    }

    try {
        const decoded = jwt.verify(token, secret_key);
        const userId = decoded.id;

        const userCart = await userdatamodel.findOne({ _id: userId });
        const product = await Product.findById(product_id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Find the item in the cart
        const cartItem = userCart.products.find(item => item.product_id.toString() === product_id);

        if (!cartItem) {
            return res.status(404).json({ success: false, message: "Item not in cart" });
        }

        // Update the stock amount based on the action
        if (action === 'increase') {
            if (product.stock <= 0) {
                return res.status(400).json({ success: false, message: "Not enough stock available" });
            }

            cartItem.stock++;
            product.stock--;
        } else if (action === 'decrease' && cartItem.stock > 1) {
            cartItem.stock--;
            product.stock++;
        } else if (action === 'decrease' && cartItem.stock === 1) {
            // If stock is 1 and user tries to decrease, remove the item from the cart
            userCart.products = userCart.products.filter(item => item.product_id.toString() !== product_id);
            product.stock++;

            await userCart.save();
            await product.save();

            // Calculate the new total price, handling null product cases
            const newTotalPrice = await userCart.products.reduce(async (accPromise, item) => {
                const acc = await accPromise;  // Resolve the accumulated value
                const prodDetails = await Product.findById(item.product_id);

                // If product is found, add to total price
                if (prodDetails) {
                    return acc + (item.stock * prodDetails.price);
                }
                // If product is null, skip it
                return acc;
            }, Promise.resolve(0));  // Start with a resolved promise

            return res.json({
                success: true,
                removed: true,
                newTotalPrice: newTotalPrice, // Return updated total price
            });
        }

        // Save the updated cart and product
        await userCart.save();
        await product.save();

        // Calculate the new total for the updated item
        const newTotalForItem = cartItem.stock * product.price;

        // Calculate the new total price for the cart, handling null product cases
        const newTotalPrice = await userCart.products.reduce(async (accPromise, item) => {
            const acc = await accPromise;  // Resolve the accumulated value
            const prodDetails = await Product.findById(item.product_id);

            // If product is found, add to total price
            if (prodDetails) {
                return acc + (item.stock * prodDetails.price);
            }
            // If product is null, skip it
            return acc;
        }, Promise.resolve(0));  // Start with a resolved promise

        res.json({
            success: true,
            newQuantity: cartItem.stock,
            newTotalForItem: newTotalForItem,
            newTotalPrice: newTotalPrice, // Return updated total price
        });
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ success: false, message: "Error updating cart" });
    }
};
exports.renderCheckout = async (req, res) => {  
    console.log("----rendering checkout page");
    let token = req.cookies.token;
    if (!token) {
        const message = "You need to log in first!";
        return res.redirect("/login", { message });
    }

    try {
        const decoded = jwt.verify(token, secret_key);
        const userId = decoded.id;

        const user = await User.findById(userId);
        const deliveryTime = Math.floor(Math.random() * 7) + 1;

        res.render("checkout", {
            name: user.name,
            email: user.email,
            deliveryTime: deliveryTime
        });
    } catch (error) {
        console.error("----","Error during checkout:", error);
        res.status(500).send("Error during checkout");
}
};
exports.renderChangePass = async (req,res)=>{
    console.log("----rendered change password page");
    res.render("changepass");
};
exports.handleChangePass = async (req, res) => {
    console.log("----handling change password function");

    const { currentPassword, newPassword } = req.body;
    let token = req.cookies.token;

    if (!token) 
    {
        const message = "In order to change your Password,You'll need to log in first!";
        return res.render("login", { message });
    }
    try {
        const decoded = jwt.verify(token, secret_key);
        const userId = decoded.id;
        const user = await User.findById(userId);

        if (!user) {
            const message = "No such user! please try again" ;
            return res.render("login", { message });
        }

        if (user.password !== currentPassword) {
            const message = "Current password is incorrect!";
            return res.render("changepass", { message });
        }
        user.password = newPassword;
        await user.save();

        console.log("----Password updated successfully.");
        const message = "Password changed successfully!";
        res.render("login", { message });

    } catch (error) {
        console.error("----Error changing password:", error);
        res.send("Error changing password.",error);
    }
};
//............................................................seller..................................................
exports.renderSeller = async (req, res) => {
    let token = req.cookies.token;

    // Check if the user is logged in
    if (!token) {
        const message = "You are not logged in yet.";
        return res.render("login", { message });
    }

    // Decode the token
    let decoded;
    try {
        decoded = jwt.verify(token, secret_key);
    } catch (err) {
        const message = "Invalid token.";
        return res.render("login", { message });
    }

    const userId = decoded.id;

    // Fetch the current user
    let current_user = await User.findOne({ _id: userId });

    // Check if the user is found and handle accordingly
    if (!current_user) {
        const message = "You are not the current user.";
        return res.render("login", { message });
    }

    let current_user_account_type = current_user.utype;

    // Check if the user account type is 'seller'
    if (current_user_account_type !== "seller") {
        return res.render("ChangeAccountType");
    } 

    // Fetch products posted by this seller
    const products = await Product.find({ sellerId: userId }); // Assuming sellerId is the field linking products to users

    // Render the seller page with the products
    return res.render("seller", { products });
};

exports.handleEditProduct = async (req, res) => {
    const productId = req.params.id; 
    const { name, description, price, stock } = req.body;
    let token = req.cookies.token ;
    const decode = jwt.verify(token, secret_key); 
    current_user_id = req.user._id ;
    try {
        console.log('Updating product with ID:', productId); 
        
        const updateResult = await Product.updateOne(
            { _id: productId },
            {
                product_name: name,
                description: description,
                price: price, 
                stock: stock, 
                image: req.file ? `/images/${req.file.filename}` : undefined,
                sellerId :current_user_id
            }
        );

        if (updateResult.nModified === 0) {
            return res.status(404).send('Product not found or no changes made.');
        }

        res.redirect('/'); 
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send('Server error.');
    }
};
exports.handleDeleteProduct = async (req, res) => {
    const productId = req.params.id; // Get product ID from URL parameters

    try {
        await Product.deleteOne({ _id: productId });
        res.redirect('/seller'); // Redirect to seller page after deletion
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send('Server error.');
    }
};
exports.handleSeller = (req, res) => {
    let token = req.cookies.token ;

    try {
        if (!token) {
            const message = "You are not logged in , sell by loggin in" ;
            return res.render("login",{ message })
        }

        const { name, description, price, stock } = req.body;

        if (!req.file) {
            return res.send("No image uploaded.");
        }
        const decode = jwt.verify(token, secret_key); 
        req.user = decode;
        // console.log("******",req.user.id) ;
        const newProduct = new Product({
            product_name: name,
            description: description,
            price: parseFloat(price),
            stock: parseInt(stock),
            image: `/images/${req.file.filename}`,
            sellerId: req.user.id 
        });

        newProduct.save()
            .then(() => {
                res.redirect('/');
                console.log("New product added by the user successfully!");
            })
            .catch(err => {
                console.error('Error saving product:', err);
                res.send('Error saving product.');
            });

    } catch (err) {
        console.error('Error in handleSeller:', err);
        res.status(500).send('Server error.');
    }
};


//...............................................................change account type.....................................
exports.renderChangeAccountType = (req,res)=>{
    const token = req.cookies.token; // Retrieve the token from cookies

    if (!token) {
        const message = "You are not logged in yet.";
        return res.render("login", { message });
    }
    else
    {
        res.render("changeAccountType") ;
    }
}
exports.handleChangeAccountType = async (req, res) => {
    const token = req.cookies.token; // Retrieve the token from cookies

    if (!token) {
        const message = "You are not logged in yet.";
        return res.render("login", { message });
    }

    try {
        const decoded = jwt.verify(token, secret_key);
        const userId = decoded.id;

        // Check which button was pressed
        const action = req.body.action;

        if (action === 'notchange') {
            return res.redirect("/");
        } else if (action === 'change') {
            // Update the user account type to 'seller'
            await User.updateOne({ _id: userId }, { utype: 'seller' });
            return res.redirect("/seller");
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
};
//.............................................................. Independent Functions..............................................................
//creating new user
async function createNewUser(type_of_user, email, username, password) {
    console.log("----create new user function");
    const newUser = new User({
        utype: type_of_user,
        email: email,
        name: username,
        password: password
    }); 
    await newUser.save();
}
//adding products to the cart
async function addProductToUser(userId, product) {
    console.log("----Adding product to user");
    let current_item = await Product.findOne({ _id: product.product_id });

    if (!current_item || current_item.stock <= 0) {
        return { success: false, message: "Product out of stock" };
    }

    const current_product_stock = current_item.stock;
    let current_cart_user = await userdatamodel.findOne({ _id: userId });

    if (!current_cart_user) {
        await Product.updateOne({ _id: product.product_id }, { stock: current_product_stock - 1 });

        const newdata = new userdatamodel({
            _id: userId,
            products: [product],
        });

        await newdata.save();
        console.log("----Created new user and added product successfully!");
    } else {
        const existingProduct = current_cart_user.products.find(
            (p) => p.product_id.toString() === product.product_id
        );

        if (existingProduct) {
            await Product.updateOne({ _id: product.product_id }, { stock: current_product_stock - 1 });
            existingProduct.stock++;

            await userdatamodel.updateOne(
                { _id: userId, "products.product_id": product.product_id },
                { $set: { "products.$.stock": existingProduct.stock } }
            );
        } else {
            await Product.updateOne({ _id: product.product_id }, { stock: current_product_stock - 1 });

            await userdatamodel.updateOne(
                { _id: userId },
                { $push: { products: product } }
            );
            console.log("----Product added successfully!");
        }
    }
}
exports.getProductDescription = async (req, res) => {
    console.log("----requested product description");
    const productId = req.params.id;
    try {
        const product = await Product.findById(productId); // Fetch the product by ID

        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        // Send the product description as a response
        res.json({ description: product.description });
    } catch (error) {
        console.error("----Error getting product description:", error);
        res.send("Error retrieving product description");
    }
};

function tokenworkingornot(req, res) {
    const token = req.cookies.token;
    console.log("Decoded token is: ", jwt.decode(token));
    let iat = (jwt.decode(token)?.iat);
    let exp = (jwt.decode(token)?.exp);

    if (!token) {
        return false;
    } else {
        try {
            jwt.verify(token, secret_key);
            if (iat >= exp) {
                console.log("Token has expired.");
                return false;
            } else {
                return true;
            }
        } catch (err) {
            console.log(err);
            res.redirect('/login');
            return false;
        }
    }
}
// exports.checkIfLoggedIn = () => {
//     console.log("----checking if the user have logged in yet or not");
//     let token = req.cookies.token  ;
//     if(!token){return false  ;}
//     else{return true ;}
// };