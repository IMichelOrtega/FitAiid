const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

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
    console.log('🔑 Resend API Key:', process.env.RESEND_API_KEY ? 'PRESENTE' : 'AUSENTE');
    await resend.emails.send({
      from: 'FitAiid <onboarding@resend.dev>',
      to,
      subject: 'Verifica tu correo en FitAiid ✅',
      html: verificationEmailHtml({ name, verifyUrl }),
    });
    console.log(`📩 Correo enviado a: ${to}`);
  } catch (error) {
    console.error('❌ Error al enviar el correo:', error);
    throw new Error('Error al enviar el correo de verificación');
  }
}

module.exports = { sendVerificationEmail };