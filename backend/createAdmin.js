require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User'); // ajusta la ruta según tu estructura

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const existingAdmin = await User.findOne({ email: 'admin@fitaiid.com' });
    if (existingAdmin) {
      console.log('⚠️ Ya existe un admin con ese correo.');
      process.exit(0);
    }

    const admin = new User({
      firstName: 'Miche',
      lastName: 'Admin',
      email: 'admin@fitaiid.com',
      password: 'Admin1234',
      role: 'admin',
      isEmailVerified: true
    });

    await admin.save();
    console.log('🎉 Usuario administrador creado con éxito');
    console.log(`👑 Email: ${admin.email}`);
    console.log(`🔑 Contraseña: Admin1234`);
    console.log(`🆔 Rol: ${admin.role}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creando admin:', err.message);
    process.exit(1);
  }
})();
