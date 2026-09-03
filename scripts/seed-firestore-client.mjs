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
    return {
      ...juego,
      vocabularyIds: idsByCategory(category),
      examples: wordsByCategory(category).length ? wordsByCategory(category) : juego.examples,
    };
  });
}

async function clearCollection(db, collectionName) {
  const snap = await getDocs(collection(db, collectionName));
  for (const docSnap of snap.docs) {
    await deleteDoc(docSnap.ref);
  }
}

async function seedUnit(db, unit) {
  const { id, exercises, ...unitData } = unit;
  const unitRef = doc(collection(db, 'units'), id);
  await unitRef.set(unitData, { merge: true });

  for (let start = 0; start < exercises.length; start += 450) {
    const batch = writeBatch(db);
    for (const exercise of exercises.slice(start, start + 450)) {
      const { id: exerciseId, ...data } = exercise;
      const exerciseRef = doc(collection(db, 'units', id, 'exercises'), exerciseId);
      batch.set(exerciseRef, data, { merge: true });
    }
    await batch.commit();
  }
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
  const vocabulario = loadSeed('vocabulario');
  const juegos = linkGamesToVocabulary(loadSeed('juegos'), vocabulario);
  const cuentos = loadSeed('cuentos');
  const units = buildUnits(vocabulario);

  await clearCollection(db, 'vocabulary');
  await clearCollection(db, 'juegos');
  await clearCollection(db, 'cuentos');

  const unitsSnap = await getDocs(collection(db, 'units'));
  for (const unitDoc of unitsSnap.docs) {
    await deleteDoc(unitDoc.ref);
    const exercisesSnap = await getDocs(collection(db, 'units', unitDoc.id, 'exercises'));
    for (const exerciseDoc of exercisesSnap.docs) {
      await deleteDoc(exerciseDoc.ref);
    }
  }

  const batch = writeBatch(db);
  for (const item of vocabulario) {
    const { id, ...data } = item;
    batch.set(doc(collection(db, 'vocabulary'), id), data, { merge: true });
  }
  for (const item of juegos) {
    const { id, ...data } = item;
    batch.set(doc(collection(db, 'juegos'), id), data, { merge: true });
  }
  for (const item of cuentos) {
    const { id, ...data } = item;
    batch.set(doc(collection(db, 'cuentos'), id), data, { merge: true });
  }
  await batch.commit();

  for (const unit of units) {
    await seedUnit(db, unit);
  }

  console.log('✓ Colecciones cargadas en Firestore:', vocabulario.length, 'palabras,', juegos.length, 'juegos,', cuentos.length, 'cuentos y', units.length, 'unidades');
}

main().catch((error) => {
  console.error('Error cargando datos:', error.message);
  process.exit(1);
});
