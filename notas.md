#Firebase:
npm install firebase

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBzpmKxgVzx6qHgEAsz82xSHM8ANjF8HTI",
  authDomain: "fitaiid-9c617.firebaseapp.com",
  projectId: "fitaiid-9c617",
  storageBucket: "fitaiid-9c617.firebasestorage.app",
  messagingSenderId: "698827830015",
  appId: "1:698827830015:web:ad141d6f1b8803edadd2ca"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

https://fitaiid-9c617.firebaseapp.com/__/auth/handler





/* ======== ESTILO GENERAL ======== */
body {
  margin: 0;
  font-family: "Oswald", sans-serif;
  font-weight: 400;
  background: #000;
  color: white;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

/* ======== FONDO CON ONDAS ROJAS ======== */
body::before {
  content: "";
  position: absolute;
  width: 150%;
  height: 150%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 0, 0, 0.25), transparent 60%),
              radial-gradient(circle at 70% 70%, rgba(255, 0, 0, 0.2), transparent 60%);
  animation: moveWaves 8s infinite alternate ease-in-out;
  z-index: 0;
  filter: blur(50px);
}

@keyframes moveWaves {
  0% { transform: translate(-20px, -20px) scale(1); }
  100% { transform: translate(20px, 20px) scale(1.1); }
}

/* ======== CONTENEDOR ======== */
.register-container {
  position: relative;
  z-index: 1;
  
  padding: 2.5rem;
  border-radius: 12px;
  width: 360px;
  box-shadow: 0 0 40px rgba(255, 0, 0, 0.4);
  text-align: center;
  transition: all 0.3s ease-in-out;
}

.register-container:hover {
  box-shadow: 0 0 60px rgba(255, 0, 0, 0.6);
}

/* ======== TÍTULO ======== */
.register-container h2 {
  margin-bottom: 1.5rem;
  color: white;
  font-weight: 700;
  letter-spacing: 1px;
}

/* ======== CAMPOS ======== */
.register-container input,
.register-container select {
  width: 100%;
  margin-bottom: 0.9rem;
  padding: 0.75rem;
  border: 1px solid #222;
  border-radius: 6px;
  background-color: #111;
  color: #ddd;
  outline: none;
  font-size: 0.95rem;
  transition: all 0.3s;
}

.register-container input:focus,
.register-container select:focus {
  border-color: #e50914;
  box-shadow: 0 0 8px #e50914;
}

/* ======== BOTÓN ======== */
.register-container button {
  width: 100%;
  padding: 0.85rem;
  border: none;
  border-radius: 6px;
  background: #e50914;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.register-container button:hover {
  background: #ff2626;
  box-shadow: 0 0 12px #ff2626;
}

/* ======== TEXTO Y REDES ======== */
.social-login {
  margin-top: 1.2rem;
}

.social-login p {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: #ccc;
}

.icons {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.icons img {
  width: 30px;
  filter: brightness(0.9);
  transition: transform 0.2s, filter 0.2s;
}

.icons img:hover {
  transform: scale(1.1);
  filter: brightness(1.2);
}
.Apple {
  width: 80px;
  height: 50px;
}
.login-link {
  color: red;
  text-decoration: none;
  font-weight: bold;
}

