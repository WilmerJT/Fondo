/**
 * Carga colecciones juegos y cuentos en Firestore.
 *
 * Uso:
 *   1. Descarga la clave de cuenta de servicio desde Firebase Console
 *      (Project settings → Service accounts → Generate new private key).
 *   2. Guarda el JSON como firestore/service-account.json (no lo subas a git).
 *   3. npm run seed:firestore
 *
 * Alternativa con variable de entorno:
 *   set GOOGLE_APPLICATION_CREDENTIALS=ruta\al\service-account.json
 *   npm run seed:firestore
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const projectId = 'app-idioma-85f50';

function loadServiceAccount() {
  const localPath = join(rootDir, 'firestore', 'service-account.json');
  if (existsSync(localPath)) {
    return JSON.parse(readFileSync(localPath, 'utf8'));
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  }
  throw new Error(
    'No se encontró service-account.json. Colócalo en firestore/service-account.json ' +
      'o define GOOGLE_APPLICATION_CREDENTIALS.',
  );
}

function initAdmin() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(loadServiceAccount()),
      projectId,
    });
  }
  return getFirestore();
}

function loadSeed(name) {
  const path = join(rootDir, 'firestore', 'seed', `${name}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function seedCollection(db, collectionName, items) {
  const batch = db.batch();
  for (const item of items) {
    const { id, ...data } = item;
    const ref = db.collection(collectionName).doc(id);
    batch.set(ref, data, { merge: true });
  }
  await batch.commit();
  console.log(`✓ ${collectionName}: ${items.length} documentos`);
}

async function main() {
  const db = initAdmin();
  const juegos = loadSeed('juegos');
  const cuentos = loadSeed('cuentos');

  await seedCollection(db, 'juegos', juegos);
  await seedCollection(db, 'cuentos', cuentos);

  console.log('\nSeed completado en proyecto:', projectId);
}

main().catch((err) => {
  console.error('Error al hacer seed:', err.message);
  process.exit(1);
});
