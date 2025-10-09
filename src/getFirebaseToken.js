// getFirebaseToken.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC5QbKvr7BeYrkCGLmPZFITYww3E9rpPqY",
  authDomain: "chatbot-fda3b.firebaseapp.com",
  projectId: "chatbot-fda3b",
  storageBucket: "chatbot-fda3b.firebasestorage.app",
  messagingSenderId: "778466323543",
  appId: "1:778466323543:web:d1a7b63720003bb5368712",
  measurementId: "G-4SVH0CV8P6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const email = "andersito@gmail.com";
const password = "7891011";

signInWithEmailAndPassword(auth, email, password)
  .then(async (userCredential) => {
    const token = await userCredential.user.getIdToken();
    console.log("Tu token JWT de Firebase es:\n");
    console.log(token);
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
