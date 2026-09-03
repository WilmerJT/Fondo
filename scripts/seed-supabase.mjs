import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

function loadVocabulary() {
  const path = join(rootDir, 'firestore', 'seed', 'vocabulario.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}

function normalizeWord(word) {
  return {
    id: word.id,
    category: word.category,
    source_text: word.sourceText,
    target_text: word.targetText,
    part_of_speech: word.partOfSpeech || 'noun',
    image_url: word.imageUrl || '',
    audio_url: word.audioUrl || '',
    status: word.status || 'draft',
  };
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Faltan variables de entorno: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_ANON_KEY).');
    console.error('Ejemplo:');
    console.error('set SUPABASE_URL=https://xyz.supabase.co');
    console.error('set SUPABASE_SERVICE_ROLE_KEY=tu_clave');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const vocabulary = loadVocabulary();
  const rows = vocabulary.map(normalizeWord);

  const { data, error } = await supabase
    .from('vocabulary')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: false });

  if (error) {
    console.error('Error al subir el vocabulario a Supabase:', error.message);
    process.exit(1);
  }

  console.log('✓ vocabulario subido correctamente a Supabase:', rows.length, 'palabras');
  console.log('IDs:', rows.map((item) => item.id).join(', '));
  console.log('Tabla:', 'vocabulary');
  console.log('Datos insertados:', data?.length ?? rows.length);
}

main().catch((error) => {
  console.error('Error inesperado:', error.message);
  process.exit(1);
});
