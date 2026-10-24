# Base de datos de vocabulario en Firebase

Firebase es la única fuente de datos de la aplicación. El contenido definitivo Kamëntsá → Español se mantiene en `firestore/seed/vocabulario.json` y el script lo publica en Firestore.

El catálogo definitivo contiene 190 palabras, 19 categorías, 19 unidades gestionadas por el seed y 209 ejercicios (`190 multiple_choice + 19 match_words`).

## Arquitectura

```text
Firebase Authentication
  └── users/{uid}
    └── progress/{unitId}

Cloud Firestore
  ├── vocabulary/{wordId}
  ├── units/{unitId}
  │   └── exercises/{exerciseId}
  ├── juegos/{juegoId}
  └── cuentos/{cuentoId}

Firebase Storage
  └── vocabulary/{wordId}/image
  └── vocabulary/{wordId}/audio

La aplicación Angular escucha Firestore con `onSnapshot`, por lo que los cambios publicados en Firebase se reflejan en localhost sin recompilar. Si se cambia un ejercicio materializado o una unidad, la lección también recibe el cambio en tiempo real.

## Documento de vocabulario

La fuente local está en `firestore/seed/vocabulario.json`. Cada palabra tiene un ID permanente y se guarda una sola vez en `vocabulary/{wordId}`.

```json
{
  "id": "month_january",
  "category": "months",
  "sourceText": "January",
  "targetText": "enero",
  "partOfSpeech": "noun",
  "imageUrl": "",
  "audioUrl": "",
  "imageStoragePath": "",
  "audioStoragePath": "",
  "status": "draft"
}
```

Campos:

| Campo | Uso |
|---|---|
| `id` | ID único y permanente. Usa minúsculas, guiones bajos y sin espacios. |
| `category` | Categoría que se convierte en unidad: `months`, `attributes`, `objects`, `verbs`, `restaurants`, etc. |
| `sourceText` | Palabra del idioma de referencia, actualmente inglés en los ejemplos. |
| `targetText` | Traducción. Aquí se colocará la palabra de la lengua indígena. |
| `partOfSpeech` | Tipo gramatical: `noun`, `verb`, `adjective`, etc. |
| `imageUrl` | URL pública o de Firebase Storage. Puede quedar vacía. |
| `audioUrl` | URL de audio. Puede quedar vacía. |
| `imageStoragePath` | Ruta opcional, por ejemplo `vocabulary/month_january/image`. |
| `audioStoragePath` | Ruta opcional, por ejemplo `vocabulary/month_january/audio`. |
| `status` | `draft`, `published` o `archived`. |

### Estados

- `draft`: contenido en revisión.
- `published`: contenido disponible para flashcards y catálogo público.
- `archived`: contenido retirado; no debe mostrarse.

Las flashcards consultan únicamente palabras `published`. Si quieres revisar una palabra en flashcards, cambia su documento en Firebase a:

```json
{ "status": "published" }
```

Los ejercicios se generan desde las palabras. Para mantener compatibilidad con contenido antiguo, una unidad `available` puede mostrar ejercicios existentes con estado `draft` o sin `status`; los ejercicios `archived` permanecen ocultos.

## Relación entre unidades y vocabulario

Una unidad se guarda en `units/{unitId}` y mantiene referencias, no copias de palabras:

```json
{
  "title": "Basic verbs",
  "description": "Practice common actions.",
  "icon": "🏃",
  "order": 4,
  "status": "available",
  "vocabularyIds": [
    "verb_eat",
    "verb_drink",
    "verb_buy",
    "verb_go"
  ]
}
```

Una palabra puede pertenecer a varias unidades sin duplicar `vocabulary/{wordId}`. El orden de `vocabularyIds` es el orden usado por las flashcards.

El seed actual crea automáticamente estas 19 unidades cuando hay palabras en las categorías correspondientes:

```text
unit_months
unit_attributes
unit_objects
unit_verbs
unit_restaurants
```

Todas las unidades generadas por el seed llevan `status: "available"`.

Si Firestore contiene unidades manuales anteriores con IDs que no empiezan por `unit_` y no pertenecen a estas categorías, se conservan para no borrar contenido no gestionado por el seed. Por eso el total visible en Firestore puede ser mayor que 19, aunque el catálogo definitivo gestionado por este script siempre sea de 19 unidades.

## Ejercicios

Los ejercicios viven en:

```text
units/{unitId}/exercises/{exerciseId}
```

Ejemplo generado:

```json
{
  "id": "translate_verb_eat",
  "vocabularyId": "verb_eat",
  "type": "multiple_choice",
  "question": "Translate \"eat\"",
  "correctAnswer": "comer",
  "choices": ["comer", "beber", "comprar", "ir"],
  "order": 1,
  "xpReward": 10,
  "difficulty": "A1",
  "languageFrom": "en",
  "languageTo": "target",
  "status": "published"
}
```

Por cada palabra de una categoría el seed crea un ejercicio `multiple_choice`. También crea un ejercicio `match_words` para emparejar todas las palabras de la categoría.

Tipos soportados por la aplicación:

```text
word_order
multiple_choice
match_words
translate_text
listen_and_write
```

`vocabularyId` identifica la palabra de origen, pero el ejercicio conserva sus propios campos `question`, `correctAnswer` y `choices` para no romper el componente existente. Por ello, si modificas una traducción en `vocabulary` directamente desde Firebase, actualiza también el ejercicio materializado o ejecuta el seed.

## Cómo agregar una palabra

1. Abre `firestore/seed/vocabulario.json`.
2. Añade un objeto con un `id` nuevo.
3. Usa una categoría existente o agrega la categoría al mapa `categoryConfig` de `scripts/seed-firestore.mjs`.
4. Coloca la traducción revisada en `targetText`.
5. Usa `draft` mientras se revisa.
6. Cambia a `published` cuando esté lista.
7. Ejecuta:

```bash
npm run seed:firestore
```

Ejemplo:

```json
{
  "id": "restaurant_order",
  "category": "restaurants",
  "sourceText": "order",
  "targetText": "ordenar",
  "partOfSpeech": "verb",
  "imageUrl": "",
  "audioUrl": "",
  "status": "published"
}
```

El seed creará el documento de vocabulario, añadirá el ID a `units/unit_restaurants` y generará los ejercicios correspondientes.

## Cómo modificar una palabra

### Desde el JSON y el seed

Es la forma recomendada para mantener el contenido versionado:

1. Busca el objeto por `id`.
2. Modifica `targetText`, `sourceText`, audio, imagen o estado.
3. Ejecuta `npm run seed:firestore`.

El seed usa `merge`, por lo que actualiza los campos del documento sin borrar el resto de la colección. También actualiza los ejercicios generados con el mismo ID.

### Directamente en Firebase Console

También puedes modificar `vocabulary/{wordId}` en Firestore. Las flashcards reciben el cambio en tiempo real si la palabra está `published`.

Los ejercicios son documentos materializados independientes. Para que la lección use la nueva traducción debes modificar el ejercicio correspondiente o ejecutar nuevamente el seed.

## Cómo publicar o retirar contenido

Para publicar:

```text
vocabulary/{wordId}.status = "published"
```

Para retirar una palabra sin borrarla:

```text
vocabulary/{wordId}.status = "archived"
```

Recomendamos archivar antes que borrar para conservar el historial y poder restaurar contenido. Si se archiva directamente en Firebase, las flashcards la retiran automáticamente; los ejercicios `multiple_choice` generados pueden seguir visibles mientras la unidad esté `available`, por lo que conviene ejecutar el seed después de cambiar el JSON.

## Cómo crear una unidad

Las unidades estándar se crean automáticamente por categoría desde `scripts/seed-firestore.mjs`. Para crear una categoría nueva:

1. Añade palabras con esa categoría a `vocabulario.json`.
2. Agrega una entrada en `categoryConfig`:

```js
new_category: {
  title: 'New category',
  description: 'Description of the unit.',
  icon: '📚',
  order: 6,
}
```

3. Ejecuta `npm run seed:firestore`.

El seed crea `unit_new_category`, sus `vocabularyIds`, `status: "available"` y sus ejercicios.

Para una unidad manual en Firebase Console, crea `units/{unitId}` con al menos:

```json
{
  "title": "Basic greetings",
  "description": "Common greetings.",
  "icon": "👋",
  "order": 6,
  "status": "available",
  "vocabularyIds": ["greeting_hello", "greeting_goodbye"]
}
```

La aplicación escucha esa unidad y puede mostrar sus flashcards y ejercicios si existen.

## Cómo modificar una unidad

Puedes modificar en Firebase:

- `title`
- `description`
- `icon`
- `order`
- `status`
- `vocabularyIds`

Cambiar `vocabularyIds` actualiza las flashcards en tiempo real y respeta el orden de la lista. Cambiar `status` a `available` permite que se muestre en el mapa y habilita sus ejercicios compatibles.

Si la unidad se genera desde el seed, modifica `categoryConfig` o el JSON y vuelve a ejecutar el seed; de lo contrario, el siguiente seed puede restaurar los valores generados.

## Cómo eliminar una unidad

### Recomendado: retirarla

Para no perder historial, cambia:

```text
units/{unitId}.status = "locked"
```

La unidad deja de estar disponible para iniciar, pero conserva sus ejercicios y el progreso de usuarios.

### Eliminación permanente

El seed no elimina automáticamente unidades que ya no aparecen en el JSON. Para borrar permanentemente una unidad debes eliminar:

```text
units/{unitId}/exercises/{exerciseId}
units/{unitId}
```

También debes revisar y eliminar, si corresponde:

```text
users/{uid}/progress/{unitId}
```

La eliminación de subcolecciones debe hacerse con un script Admin o desde herramientas de Firebase; borrar el documento padre no siempre elimina sus subcolecciones. No borres una unidad en producción sin revisar el progreso de los usuarios.

## Cómo crear o modificar ejercicios

### Usando el seed

Es la opción recomendada para vocabulario. El seed genera ejercicios desde cada palabra y actualiza los mismos IDs:

```text
translate_{wordId}
match_{category}
```

Si modificas el catálogo, ejecuta:

```bash
npm run seed:firestore
```

### Manualmente en Firebase

Crea el documento dentro de la unidad:

```text
units/unit_restaurants/exercises/order_food
```

Ejemplo:

```json
{
  "type": "multiple_choice",
  "vocabularyId": "restaurant_menu",
  "question": "Translate menu",
  "correctAnswer": "menú",
  "choices": ["menú", "mesa", "cuenta", "mesero"],
  "order": 5,
  "xpReward": 10,
  "difficulty": "A1",
  "languageFrom": "en",
  "languageTo": "target",
  "status": "published"
}
```

La app lo recibirá en tiempo real. `LessonComponent` decide si es de vocabulario o traducción según `type`; `VocabularyLessonComponent` valida `multiple_choice`, `word_order` y `match_words`.

## Cómo eliminar ejercicios

1. Abre `units/{unitId}/exercises` en Firebase.
2. Elimina el documento específico.
3. Si la lección está abierta, el listener actualizará la lista; si era el ejercicio actual, vuelve a entrar a la unidad.

Para retirar temporalmente un ejercicio, usa:

```text
status = "archived"
```

No elimines el documento de vocabulario si solo quieres quitar una actividad: `VocabularyWord` y `ExerciseDoc` son entidades separadas.

## Flashcards

La ruta es:

```text
/vocabulary/:unitId
```

Desde el mapa se pulsa `Vocabulario`. `VocabularyService` lee `units/{unitId}.vocabularyIds` y escucha cada documento `vocabulary/{wordId}`.

Las flashcards:

- muestran imagen o placeholder;
- muestran `sourceText`;
- muestran la traducción solo al pulsar `Mostrar traducción`;
- reproducen `audioUrl` si existe;
- permiten `Anterior` y `Siguiente`;
- no otorgan XP;
- vuelven a ocultar la traducción al cambiar de palabra.

Después se pulsa `Comenzar ejercicios`, que navega a `/lesson/{unitId}`. El XP y el progreso siguen siendo responsabilidad de `LessonComponent` y `DataService`.

## Imágenes y audio en Storage

Las rutas recomendadas son:

```text
vocabulary/{wordId}/image
vocabulary/{wordId}/audio
```

En Firestore se guardan solo:

```text
imageUrl
imageStoragePath
audioUrl
audioStoragePath
```

No se guardan Base64 ni archivos binarios en Firestore. `StorageService` ya contiene métodos para subir imagen y audio; todavía no existe un panel administrativo.

Las reglas actuales permiten lectura a usuarios autenticados y bloquean escritura desde la app. La carga de archivos debe hacerse con una herramienta administrativa o credenciales controladas.

## Seed de Firebase

El script principal es `scripts/seed-firestore.mjs`.

Requiere una cuenta de servicio en:

```text
firestore/service-account.json
```

o la variable:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\ruta\service-account.json'
```

Después ejecuta:

```bash
npm run seed:firestore
```

El seed carga:

```text
vocabulario.json → vocabulary
categorías → units
palabras → exercises
juegos.json → juegos
cuentos.json → cuentos
```

Usa batches de 450 operaciones y `merge: true`. Antes de cargar, retira únicamente las unidades y palabras generadas por el catálogo de prueba anterior (`unit_months`, `unit_attributes`, `unit_objects`, `unit_verbs`, `unit_restaurants` y sus prefijos de palabras legacy). No elimina unidades manuales ni contenido fuera de ese conjunto.

### Límites importantes del seed

- Agregar o modificar datos sí se publica.
- Quitar una palabra del JSON no borra automáticamente `vocabulary/{wordId}`.
- Quitar una categoría no borra automáticamente la unidad ni sus ejercicios.
- Para eliminar contenido se debe hacer una limpieza explícita y revisar el progreso.
- El seed usa los valores actuales del JSON; una edición manual en Firebase puede ser reemplazada al ejecutarlo nuevamente.

## Seguridad

Las reglas de Firestore permiten a usuarios autenticados leer `units`, `exercises` y `vocabulary`, pero bloquean su escritura desde el cliente. El progreso solo puede escribirlo el usuario dueño de `users/{uid}`.

Las reglas de Storage permiten leer recursos de vocabulario a usuarios autenticados y bloquean escritura directa. No compartas credenciales de servicio en el repositorio.

## Resumen operativo

```text
Editar firestore/seed/vocabulario.json
        ↓
npm run seed:firestore
        ↓
vocabulary/{wordId}
units/{unitId}.vocabularyIds
units/{unitId}/exercises/{exerciseId}
        ↓
Flashcards y lecciones escuchan Firebase
        ↓
Exercises → XP + progreso del usuario
```

Para una corrección rápida en Firebase:

- traducción o audio de flashcard: editar `vocabulary/{wordId}`;
- palabra visible en flashcards: `status = published`;
- unidad visible: `units/{unitId}.status = available`;
- ejercicio manual: crear documento dentro de `units/{unitId}/exercises`;
- retirar sin borrar: `status = archived`;
- eliminar permanentemente: borrar documento y sus referencias después de revisar progreso.
# Base de datos de vocabulario en Firebase

La fuente editable del contenido está en `firestore/seed/vocabulario.json`. Cada palabra vive una sola vez en `vocabulary/{wordId}` y puede reutilizarse en lecciones y juegos.

## Formato de una palabra

```json
{
  "id": "month_january",
  "category": "months",
  "sourceText": "January",
  "targetText": "enero",
  "partOfSpeech": "noun",
  "imageUrl": "",
  "audioUrl": "",
  "status": "draft"
}
```

- `sourceText`: idioma de referencia, en este ejemplo inglés.
- `targetText`: traducción. Sustituir el valor por la palabra de la lengua indígena.
- `category`: sección estable para filtrar y organizar contenido (`months`, `attributes`, `objects`, etc.).
- `id`: identificador permanente, sin espacios ni acentos. No lo cambies al corregir una traducción.
- `status`: usar `draft` mientras se revisa y `published` cuando esté listo para usuarios.
- `imageUrl` y `audioUrl`: opcionales; se pueden completar después.

## Cómo se relaciona con las lecciones

El seed crea estas rutas:

```text
vocabulary/{wordId}
units/{unitId}
units/{unitId}/exercises/{exerciseId}
```

Cada unidad toma las palabras de una categoría y genera ejercicios `multiple_choice` y `match_words`. La aplicación ya consume la subcolección `units/{unitId}/exercises`, por lo que no hay que cambiar el componente de lecciones para este primer catálogo.

## Cómo agregar vocabulario

1. Añade un objeto a `firestore/seed/vocabulario.json`.
2. Usa un `id` nuevo y conserva la misma estructura.
3. Cambia `targetText` por la traducción indígena revisada.
4. Ejecuta `npm run seed:firestore`.
5. Marca `status` como `published` cuando audio, ortografía y traducción estén validados.

El seed usa `merge`, así que agregar o corregir documentos no borra otras colecciones. Para producción, las credenciales se leen desde `firestore/service-account.json` o `GOOGLE_APPLICATION_CREDENTIALS`; ese archivo nunca debe subirse al repositorio.

## Escalabilidad y juegos

Los juegos pueden reutilizar las mismas palabras guardando una lista de IDs, por ejemplo:

```json
{
  "id": "word_search",
  "type": "word_search",
  "vocabularyIds": ["month_january", "month_february", "object_book"]
}
```

La lista de IDs evita copiar traducciones en cada juego. El seed también rellena `examples` con `sourceText` para que los juegos actuales funcionen inmediatamente. Firebase es la única fuente de datos de vocabulario.
