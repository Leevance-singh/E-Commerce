const jwt = require('jsonwebtoken');
const secret_key = "There's nothing we can do!";

//.........................................................................🎫preliminaries🎫..............................................................

function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    console.log("Decoded token is : ",jwt.decode(token));
    //extracting these properties from the token initialized at and expiry date.
    let iat = (jwt.decode(token).iat);
    let exp = (jwt.decode(token).exp);

    if (token == null) {
        const message = "You are not logged in yet and hence cannot access index page" ;
        return res.render("login", { message });
    } else {
        jwt.verify(token, secret_key, (err, user) => {
            if (err) 
            {
                console.log(err);
                return res.redirect('/login') 
            }
            else
            {
                if(iat>=exp)
                {
                    console.log(err);
                    return res.redirect('/login') 
                }
                else
                {
                    req.user = user;
                }
            }
        next();
        });
    }
}

module.exports = { authenticateToken };












// function tokenworkingornot(req, res) {
//     const token = req.cookies.token;
//     console.log("Decoded token is: ", jwt.decode(token));
//     let iat = (jwt.decode(token)?.iat);
//     let exp = (jwt.decode(token)?.exp);

//     if (!token) {
//         return false;
//     } else {
//         try {
//             jwt.verify(token, secret_key);
//             if (iat >= exp) {
//                 console.log("Token has expired.");
//                 return false;
//             } else {
//                 return true;
//             }
//         } catch (err) {
//             console.log(err);
//             res.redirect('/login');
//             return false;
//         }
//     }
// }