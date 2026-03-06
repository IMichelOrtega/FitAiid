// backend/src/utils/sendEmail.js

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
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MAILERSEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: {
          email: process.env.EMAIL_USER,
          name: "FitAiid",
        },
        to: [{ email: to, name: name || "usuario" }],
        subject: "Verifica tu correo en FitAiid ✅",
        html: verificationEmailHtml({ name, verifyUrl }),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ MailerSend API error:", error);
      throw new Error("Error al enviar el correo de verificación");
    }

    console.log(`📩 Correo de verificación enviado a: ${to}`);
  } catch (error) {
    console.error("❌ Error al enviar el correo:", error);
    throw new Error("Error al enviar el correo de verificación");
  }
}

module.exports = { sendVerificationEmail };