/**
 * Carga contenido de vocabulario, lecciones, juegos y cuentos en Firestore.
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
  for (let start = 0; start < items.length; start += 450) {
    const batch = db.batch();
    for (const item of items.slice(start, start + 450)) {
      const { id, ...data } = item;
      const ref = db.collection(collectionName).doc(id);
      batch.set(ref, data, { merge: true });
    }
    await batch.commit();
  }
  console.log(`✓ ${collectionName}: ${items.length} documentos`);
}

function buildUnits(vocabulary) {
  const categoryConfig = {
    months: { title: 'Months of the year', description: 'Learn the months of the year.', icon: '📅', order: 1 },
    attributes: { title: 'Attributes', description: 'Describe people, objects and places.', icon: '🎨', order: 2 },
    objects: { title: 'Everyday objects', description: 'Name objects from daily life.', icon: '🎒', order: 3 },
  };

  return Object.entries(categoryConfig).flatMap(([category, config]) => {
    const words = vocabulary.filter((word) => word.category === category);
    if (words.length === 0) return [];
    const choices = words.map((word) => word.targetText);
    const exercises = words.map((word, index) => ({
      id: `translate_${word.id}`,
      type: 'multiple_choice',
      question: `Translate "${word.sourceText}"`,
      correctAnswer: word.targetText,
      choices,
      order: index + 1,
      xpReward: 10,
      difficulty: 'A1',
      languageFrom: 'en',
      languageTo: 'target',
      status: word.status,
    }));
    exercises.push({
      id: `match_${category}`,
      type: 'match_words',
      question: `Match the ${config.title.toLowerCase()}`,
      correctAnswer: '',
      matchPairs: words.map((word) => ({ left: word.sourceText, right: word.targetText })),
      order: exercises.length + 1,
      xpReward: 20,
      difficulty: 'A1',
      languageFrom: 'en',
      languageTo: 'target',
      status: words.every((word) => word.status === 'published') ? 'published' : 'draft',
    });
    return [{
      id: `unit_${category}`,
      title: config.title,
      description: config.description,
      icon: config.icon,
      order: config.order,
      level: 'Principiante A1',
      exercises,
    }];
  });
}

function linkGamesToVocabulary(juegos, vocabulary) {
  const wordsByCategory = (category) => vocabulary
    .filter((word) => word.category === category)
    .map((word) => word.sourceText);
  const idsByCategory = (category) => vocabulary
    .filter((word) => word.category === category)
    .map((word) => word.id);

  return juegos.map((juego) => {
    const category = juego.id === 'garden' ? 'objects' :
      juego.id === 'paint' ? 'attributes' : 'months';
    const categoryWords = wordsByCategory(category);
    return {
      ...juego,
      vocabularyIds: idsByCategory(category),
      examples: categoryWords.length ? categoryWords : juego.examples,
    };
  });
}

async function seedUnit(db, unit) {
  const { id, exercises, ...unitData } = unit;
  await db.collection('units').doc(id).set(unitData, { merge: true });
  for (let start = 0; start < exercises.length; start += 450) {
    const batch = db.batch();
    for (const exercise of exercises.slice(start, start + 450)) {
      const { id: exerciseId, ...data } = exercise;
      batch.set(db.collection('units').doc(id).collection('exercises').doc(exerciseId), data, { merge: true });
    }
    await batch.commit();
  }
  console.log(`✓ units/${id}: ${exercises.length} ejercicios`);
}

async function main() {
  const db = initAdmin();
  const juegosSeed = loadSeed('juegos');
  const cuentos = loadSeed('cuentos');
  const vocabulary = loadSeed('vocabulario');
  const juegos = linkGamesToVocabulary(juegosSeed, vocabulary);
  const units = buildUnits(vocabulary);

  await seedCollection(db, 'vocabulary', vocabulary);
  for (const unit of units) {
    await seedUnit(db, unit);
  }
  await seedCollection(db, 'juegos', juegos);
  await seedCollection(db, 'cuentos', cuentos);

  console.log('\nSeed completado en proyecto:', projectId);
}

main().catch((err) => {
  console.error('Error al hacer seed:', err.message);
  process.exit(1);
});
