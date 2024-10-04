const nodemailer = require('nodemailer');

//Carrying our email through a medium
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'likelylegitemail@gmail.com',
        pass: 'fjky nmwf gkuw qgdc'
    }
});
//Storing emails of various users through THis object
let otpStore = {};
//Generate random OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}
//Sending otp through the transporter that we've sent
async function sendOtp(email){
    const otp = generateOTP();
    console.log(`OTP Sent To The User Is : ${otp}`);
    otpStore[email] = otp;

    const mailOptions = {
        from: 'likelylegitemail@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}. It is valid for 10 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('OTP sent to:', email);

        setTimeout(() => {
            delete otpStore[email];
        }, 5 * 60 * 1000);        
    } catch (error) {
        console.error('Error sending OTP:', error);
    }
}
//Verifying OTP that we sent for multiple users
function verifyOtp(email, otp) {
    if (otpStore[email] && otpStore[email] === parseInt(otp)) {
        delete otpStore[email]; 
        return true;
    }
    return false;
}

module.exports = { sendOtp, verifyOtp };
