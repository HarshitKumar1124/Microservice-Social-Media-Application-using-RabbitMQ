const crypto = require('crypto');
const nodemailer = require('nodemailer');

const sendResetToken = async(email) =>{
    try{
         // Generate a reset token (using crypto for security)
         const resetToken = crypto.randomBytes(32).toString('hex');

         // Set token expiration time (e.g., 1 hour from now)
         const tokenExpiry = Date.now() + 3600000;

        // Send an email with the reset link (using nodemailer for simplicity)
        const transporter = nodemailer.createTransport({
            host:"smpt.gmail.com",//This line is used if Transported function gives error of Bad Credentials
            port:465, // This line is also added for the same above erre of Invalid Login.. This error generally happens with GMAIL Accounts
            service: 'gmail', // or any other email service
            auth: {
                user:process.env.SMPT_MAIL,
                pass:process.env.SMPT_Google_secure_Password,
            },
        });

        const resetLink = `http://localhost:${process.env.PORT}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.SMPT_MAIL,
            to: email,
            subject: 'Password Reset',
            text: `You requested a password reset. Click here to reset your password: ${resetLink}`,
        };

        await transporter.sendMail(mailOptions);

        return {resetToken,tokenExpiry};

    } catch(ex) {
        throw (`Send Reset Token failure due to ${ex}`);
    }
}

module.exports = sendResetToken;