import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, writeBatch, deleteDoc, getDocs } from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const firebaseConfig = {
  apiKey: 'AIzaSyBsU7IB77g7CLQcuSy73c2VVuccA_gtjDU',
  authDomain: 'app-idioma-85f50.firebaseapp.com',
  projectId: 'app-idioma-85f50',
  storageBucket: 'app-idioma-85f50.firebasestorage.app',
  messagingSenderId: '654391091875',
  appId: '1:654391091875:web:f39340bac6279d7b05d516',
  measurementId: 'G-6EXLXY7DFC',
};

function loadSeed(name) {
  const path = join(rootDir, 'firestore', 'seed', `${name}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const email = process.env.FIREBASE_EMAIL || 'copilot-test@local.test';
  const password = process.env.FIREBASE_PASSWORD || 'Test1234!';

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('No fue posible autenticar con Firebase Auth.');
    console.error(error.message);
    process.exit(1);
  }

  const db = getFirestore(app);
  const juegos = loadSeed('juegos');
  const cuentos = loadSeed('cuentos');

  const juegosSnap = await getDocs(collection(db, 'juegos'));
  for (const juegoDoc of juegosSnap.docs) {
    await deleteDoc(juegoDoc.ref);
  }

  const cuentosSnap = await getDocs(collection(db, 'cuentos'));
  for (const cuentoDoc of cuentosSnap.docs) {
    await deleteDoc(cuentoDoc.ref);
  }

  const batch = writeBatch(db);

  for (const item of juegos) {
    const { id, ...data } = item;
    batch.set(doc(collection(db, 'juegos'), id), data, { merge: true });
  }

  for (const item of cuentos) {
    const { id, ...data } = item;
    batch.set(doc(collection(db, 'cuentos'), id), data, { merge: true });
  }

  await batch.commit();
  console.log('✓ Colecciones cargadas en Firestore:', juegos.length, 'juegos y', cuentos.length, 'cuentos');
}

main().catch((error) => {
  console.error('Error cargando datos:', error.message);
  process.exit(1);
});
