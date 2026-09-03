# Base de datos de vocabulario

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

La lista de IDs evita copiar traducciones en cada juego. El seed también rellena `examples` con `sourceText` para que los juegos actuales funcionen inmediatamente. El siguiente paso de integración es que cada juego lea `vocabulary/{id}` y filtre `status == "published"`, eliminando gradualmente ese campo legacy.
