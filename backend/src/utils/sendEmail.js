console.log("📧 DEBUG EMAIL CONFIG:");
console.log("  Host:", process.env.EMAIL_HOST);
console.log("  User:", process.env.EMAIL_USER);
console.log("  Port:", process.env.EMAIL_PORT);


// backend/src/utils/sendEmail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false, // true para 465, false para otros
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function verificationEmailHtml({ name, verifyUrl }) {
  return `
    <div style="font-family: Arial, sans-serif; line-height:1.5;">
      <h2>Hola ${name || 'usuario'} 👋</h2>
      <p>Gracias por registrarte en <strong>FitAiid</strong>.</p>
      <p>Por favor verifica tu correo haciendo clic en el siguiente botón:</p>
      <p>
        <a href="${verifyUrl}" 
           style="background:#00bfff;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
          Verificar correo
        </a>
      </p>
      <p>O copia y pega esta URL en tu navegador:</p>
      <p>${verifyUrl}</p>
      <hr/>
      <small>Si no creaste una cuenta, puedes ignorar este mensaje.</small>
    </div>
  `;
}

async function sendVerificationEmail(to, name, verifyUrl) {
  try {
    await transporter.sendMail({
      from: `"FitAiid" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Verifica tu correo en FitAiid ✅",
      html: verificationEmailHtml({ name, verifyUrl }),
    });
    console.log(`📩 Correo de verificación enviado a: ${to}`);
  } catch (error) {
    console.error("❌ Error al enviar el correo:", error);
    throw new Error("Error al enviar el correo de verificación");
  }
}

module.exports = { sendVerificationEmail };
