const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userroutes');
//............................................................preliminaries............................................................
const app = express();
//...........................................................Middlewares setup.........................................................

app.use(express.static("public"));   
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cookieParser()); 
app.set("view engine", "ejs");    
//............................................................Mongoose Connect.........................................................
mongoose.connect("mongodb://localhost:27017/EcomWebsite") 
    .then(()=>{console.log("----MongoDB has been connected successfully!")})
    .catch((err) => console.log("----Mongo Connection Error!", err)); 
    
app.use('/', userRoutes);     

//..........................................................Listening to the server....................................................

const PORT = 8000; 
app.listen(PORT, () => { 
    console.log(`----Server started on port: ${PORT}`);  
});   
  