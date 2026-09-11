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

const categoryConfig = {
  saludos: { title: 'Saludos', description: 'Aprende los saludos básicos en Kamëntsá.', icon: '👋', order: 1, partOfSpeech: 'phrase' },
  animales: { title: 'Animales', description: 'Aprende nombres de animales en Kamëntsá.', icon: '🐾', order: 2, partOfSpeech: 'noun' },
  pronombres: { title: 'Pronombres', description: 'Practica los pronombres personales en Kamëntsá.', icon: '👥', order: 3, partOfSpeech: 'pronoun' },
  partes_cuerpo: { title: 'Partes del cuerpo', description: 'Aprende las partes del cuerpo en Kamëntsá.', icon: '🫱', order: 4, partOfSpeech: 'noun' },
  objetos: { title: 'Objetos', description: 'Identifica objetos cotidianos en Kamëntsá.', icon: '🧰', order: 5, partOfSpeech: 'noun' },
  alimentos: { title: 'Alimentos', description: 'Aprende nombres de alimentos en Kamëntsá.', icon: '🍽️', order: 6, partOfSpeech: 'noun' },
  parentesco: { title: 'Parentesco', description: 'Aprende palabras para hablar de la familia.', icon: '👪', order: 7, partOfSpeech: 'noun' },
  numeros: { title: 'Números', description: 'Practica los números en Kamëntsá.', icon: '🔢', order: 8, partOfSpeech: 'number' },
  dias_semana: { title: 'Días de la semana', description: 'Aprende los días de la semana en Kamëntsá.', icon: '📅', order: 9, partOfSpeech: 'noun' },
  productos_chagra: { title: 'Productos de la chagra', description: 'Aprende productos tradicionales de la chagra.', icon: '🌱', order: 10, partOfSpeech: 'noun' },
  interrogativos: { title: 'Interrogativos', description: 'Formula preguntas básicas en Kamëntsá.', icon: '❓', order: 11, partOfSpeech: 'interrogative' },
  vestuario: { title: 'Vestuario', description: 'Aprende prendas y elementos del vestuario.', icon: '🧵', order: 12, partOfSpeech: 'noun' },
  tiempo: { title: 'Tiempo', description: 'Aprende palabras relacionadas con el tiempo.', icon: '🕒', order: 13, partOfSpeech: 'noun' },
  verbos: { title: 'Verbos', description: 'Practica acciones frecuentes en Kamëntsá.', icon: '🏃', order: 14, partOfSpeech: 'verb' },
  adjetivos: { title: 'Adjetivos', description: 'Describe personas y objetos en Kamëntsá.', icon: '✨', order: 15, partOfSpeech: 'adjective' },
  espacio: { title: 'Espacio', description: 'Aprende lugares y posiciones en Kamëntsá.', icon: '🗺️', order: 16, partOfSpeech: 'noun' },
  colores: { title: 'Colores', description: 'Aprende los colores en Kamëntsá.', icon: '🎨', order: 17, partOfSpeech: 'adjective' },
  profesiones: { title: 'Profesiones', description: 'Aprende nombres de profesiones en Kamëntsá.', icon: '🧑‍🏫', order: 18, partOfSpeech: 'noun' },
  autoridad: { title: 'Autoridad', description: 'Aprende palabras relacionadas con la autoridad.', icon: '🏛️', order: 19, partOfSpeech: 'noun' },
};
const legacyUnitIds = ['unit_months', 'unit_attributes', 'unit_objects', 'unit_verbs', 'unit_restaurants'];
const legacyVocabularyPrefixes = ['month_', 'attribute_', 'object_', 'verb_', 'restaurant_'];

function validateVocabulary(vocabulary) {
  const categories = Object.keys(categoryConfig);
  const errors = [];
  if (vocabulary.length !== 190) {
    errors.push(`se esperaban exactamente 190 palabras y hay ${vocabulary.length}`);
  }
  const ids = new Set();
  const categoryCounts = new Map(categories.map((category) => [category, 0]));
  let previousCategory = categories[0];
  vocabulary.forEach((word, index) => {
    if (!word.id || ids.has(word.id)) errors.push(`ID duplicado o vacío en la posición ${index + 1}: ${word.id || '(vacío)'}`);
    ids.add(word.id);
    if (!categoryConfig[word.category]) errors.push(`categoría desconocida en ${word.id}: ${word.category}`);
    else categoryCounts.set(word.category, categoryCounts.get(word.category) + 1);
    if (categoryConfig[word.category] && categories.indexOf(word.category) < categories.indexOf(previousCategory)) {
      errors.push(`el orden de categorías cambia hacia atrás en ${word.id}`);
    }
    if (categoryConfig[word.category]) previousCategory = word.category;
    if (!String(word.sourceText || '').trim()) errors.push(`sourceText vacío en ${word.id}`);
    if (!String(word.targetText || '').trim()) errors.push(`targetText vacío en ${word.id}`);
    if (word.status !== 'published') errors.push(`${word.id} debe tener status published`);
    const expectedPartOfSpeech = categoryConfig[word.category]?.partOfSpeech;
    if (expectedPartOfSpeech && word.partOfSpeech !== expectedPartOfSpeech) {
      errors.push(`${word.id} debe tener partOfSpeech ${expectedPartOfSpeech}`);
    }
  });
  categories.forEach((category) => {
    if (!categoryCounts.get(category)) errors.push(`categoría sin vocabulario: ${category}`);
  });
  if (errors.length) throw new Error(`Validación de vocabulario fallida:\n- ${errors.join('\n- ')}`);
  return categoryCounts;
}

function validateCuentos(cuentos) {
  const errors = [];
  const ids = new Set();
  const seenPageIds = new Set();

  cuentos.forEach((cuento, index) => {
    if (!cuento.id || ids.has(cuento.id)) {
      errors.push(`cuento duplicado o sin id en la posición ${index + 1}: ${cuento.id || '(vacío)'}`);
    }
    ids.add(cuento.id);
    if (!String(cuento.title || '').trim()) errors.push(`cuento sin title: ${cuento.id || index + 1}`);
    if (!String(cuento.description || '').trim()) errors.push(`cuento sin description: ${cuento.id || index + 1}`);
    if (!Array.isArray(cuento.pages)) {
      if (!String(cuento.content || '').trim()) {
        errors.push(`cuento sin pages ni content: ${cuento.id || index + 1}`);
      }
      return;
    }
    if (cuento.pages.length === 0) errors.push(`cuento sin páginas: ${cuento.id || index + 1}`);
    const orders = [];
    cuento.pages.forEach((page, pageIndex) => {
      if (!page || typeof page !== 'object') {
        errors.push(`página inválida en ${cuento.id} posición ${pageIndex + 1}`);
        return;
      }
      if (!page.id || seenPageIds.has(`${cuento.id}:${page.id}`)) {
        errors.push(`id de página duplicado o vacío en ${cuento.id}: ${page.id || '(vacío)'}`);
      }
      seenPageIds.add(`${cuento.id}:${page.id}`);
      if (typeof page.order !== 'number') errors.push(`orden inválido en ${cuento.id}:${page.id}`);
      orders.push(page.order);
      const hasKamentsa = String(page.kamentsaText || '').trim().length > 0;
      const hasSpanish = String(page.spanishText || '').trim().length > 0;
      if (!hasKamentsa && !hasSpanish) errors.push(`página sin texto en ${cuento.id}:${page.id}`);
    });
    const sorted = [...orders].sort((a, b) => a - b);
    if (orders.length && JSON.stringify(sorted) !== JSON.stringify(orders)) {
      errors.push(`orden de páginas no consecutivo en ${cuento.id}`);
    }
    const expected = Array.from({ length: orders.length }, (_, i) => i + 1);
    if (orders.length && JSON.stringify(sorted) !== JSON.stringify(expected)) {
      errors.push(`orden de páginas no empieza en 1 o no es consecutivo en ${cuento.id}`);
    }
  });

  if (errors.length) {
    throw new Error(`Validación de cuentos fallida:\n- ${errors.join('\n- ')}`);
  }
}

async function deleteCollection(db, collectionRef) {
  const snapshot = await collectionRef.get();
  for (let start = 0; start < snapshot.docs.length; start += 450) {
    const batch = db.batch();
    snapshot.docs.slice(start, start + 450).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
}

async function removeLegacyGeneratedContent(db) {
  for (const unitId of legacyUnitIds) {
    const unitRef = db.collection('units').doc(unitId);
    await deleteCollection(db, unitRef.collection('exercises'));
    await unitRef.delete();
  }
  const vocabularySnapshot = await db.collection('vocabulary').get();
  const legacyWords = vocabularySnapshot.docs.filter((item) =>
    legacyVocabularyPrefixes.some((prefix) => item.id.startsWith(prefix)),
  );
  for (let start = 0; start < legacyWords.length; start += 450) {
    const batch = db.batch();
    legacyWords.slice(start, start + 450).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
  if (legacyWords.length) console.log(`✓ contenido legacy retirado: ${legacyWords.length} palabras`);
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
  return Object.entries(categoryConfig).flatMap(([category, config]) => {
    const words = vocabulary.filter((word) => word.category === category);
    if (words.length === 0) return [];
    const choices = [...new Set(words.map((word) => word.targetText))];
    const exercises = words.map((word, index) => ({
      id: `translate_${word.id}`,
      vocabularyId: word.id,
      type: 'multiple_choice',
      question: `¿Qué significa "${word.sourceText}"?`,
      correctAnswer: word.targetText,
      choices: [...choices],
      order: index + 1,
      xpReward: 10,
      difficulty: 'A1',
      languageFrom: 'kamentsa',
      languageTo: 'es',
      status: 'published',
    }));
    exercises.push({
      id: `match_${category}`,
      type: 'match_words',
      question: 'Relaciona las palabras en Kamëntsá con su significado en español.',
      correctAnswer: '',
      matchPairs: words.map((word) => ({ left: word.sourceText, right: word.targetText })),
      order: exercises.length + 1,
      xpReward: 20,
      difficulty: 'A1',
      languageFrom: 'kamentsa',
      languageTo: 'es',
      status: 'published',
    });
    return [{
      id: `unit_${category}`,
      title: config.title,
      description: config.description,
      icon: config.icon,
      order: config.order,
      level: 'Principiante A1',
      status: 'available',
      vocabularyIds: words.map((word) => word.id),
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
  validateCuentos(cuentos);
  const categoryCounts = validateVocabulary(vocabulary);
  const juegos = linkGamesToVocabulary(juegosSeed, vocabulary);
  const units = buildUnits(vocabulary);

  await removeLegacyGeneratedContent(db);
  await seedCollection(db, 'vocabulary', vocabulary);
  for (const unit of units) {
    await seedUnit(db, unit);
  }
  await seedCollection(db, 'juegos', juegos);
  await seedCollection(db, 'cuentos', cuentos);

  console.log('\nSeed completado en proyecto:', projectId);
  console.log(`Vocabulary: ${vocabulary.length} words`);
  console.log(`Units: ${units.length}`);
  console.log(`Exercises: ${units.reduce((total, unit) => total + unit.exercises.length, 0)}`);
  console.log(`Published: ${vocabulary.filter((word) => word.status === 'published').length}`);
  for (const [category, count] of categoryCounts) console.log(`  ${category}: ${count}`);
}

main().catch((err) => {
  console.error('Error al hacer seed:', err.message);
  process.exit(1);
});
