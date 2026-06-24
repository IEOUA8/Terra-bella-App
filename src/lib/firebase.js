import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
	apiKey: "AIzaSyDfBOeIhpL88_-vG2hpQcyTWmH_vkIMcQQ",
	authDomain: "terrabella-app-f38c1.firebaseapp.com",
	projectId: "terrabella-app-f38c1",
	storageBucket: "terrabella-app-f38c1.firebasestorage.app",
	messagingSenderId: "863033099248",
	appId: "1:863033099248:web:c3e326a04799c7200d5335"
};

// Inicializamos la app
const app = initializeApp(firebaseConfig);

// Inicializamos Messaging con precaución
let messaging = null;

if (typeof window !== "undefined") {
	try {
		// Intentamos obtener messaging, pero si falla (por el entorno), no rompemos la app
		messaging = getMessaging(app);
		console.log("✅ Firebase Messaging initialized.");
	} catch (error) {
		console.warn("⚠️ Firebase Messaging no disponible en este entorno (Preview). Esto es normal.");
	}
}

// *** HE ELIMINADO COMPLETAMENTE EL BLOQUE DE REGISTRO DEL SERVICE WORKER ***
// Esto evitará el error "Unrecognized origin: self" y el Error 500.

export { app, messaging };