import nodeMailer from "nodemailer";

const sendEmail = async(options) => {
    const transporter = nodeMailer.createTransport({
        host:process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        service:process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });
    
    const mailOptions = {
        from:process.env.SMTP_MAIL,
        to:options.email,
        subject:options.subject,
        text:options.message
    }

    transporter.sendMail(mailOptions, function(error,info){
        if(error){
            console.log(error);
        }
        else{
            console.log("Email sent: " + info.response);
        }
    });
}
export default sendEmail;



//ihlb786@gmail.com
