# Componentes especializados de Lecciones

Este documento describe los componentes especializados para diferentes tipos de lecciones en app-idiomas.

## Resumen

El sistema de lecciones se ha refactorizado para usar **componentes especializados** por tipo de ejercicio. Esto mejora:
- **Mantenibilidad**: Cada tipo tiene su propia UI y lógica
- **UX**: Diseños optimizados para cada tipo de aprendizaje
- **Escalabilidad**: Fácil agregar nuevos tipos sin tocar `LessonComponent`

## Componentes

### VocabularyLessonComponent
Maneja ejercicios de vocabulario: `word_order`, `multiple_choice`, `match_words`

**Ubicación:** `src/app/components/lesson/vocabulary-lesson.component.ts`

**Props:**
- `@Input exercise: ExerciseDoc | null` - Ejercicio actual
- `@Input exerciseIndex: number` - Índice (0-based)
- `@Input totalExercises: number` - Total de ejercicios en lección
- `@Output answerSubmitted` - Emite `ExerciseResult`

**Tipos soportados:**

#### word_order
Usuario ordena palabras seleccionándolas de un banco hacia la respuesta.
```
Palabras disponibles: [café] [la] [quiero]
Tu respuesta: [Arrastra aquí]
```

#### multiple_choice
Usuario selecciona una opción de una lista.
```
○ Opción A
○ Opción B (correcta)
○ Opción C
```

#### match_words
Usuario empareja términos izquierda con derecha usando dropdowns.
```
Origen:          Destino:
gato      ←→    [select: perro, gato, pájaro]
perro     ←→    [select: perro, gato, pájaro]
```

### TranslationLessonComponent
Maneja ejercicios de traducción: `translate_text`, `listen_and_write`

**Ubicación:** `src/app/components/lesson/translation-lesson.component.ts`

**Props:** Idénticas a VocabularyLessonComponent

**Tipos soportados:**

#### translate_text
Usuario escribe la traducción en un textarea.
```
Pregunta: "Translate 'hello' to Spanish"
[Textarea: Escribe la traducción...]
```

#### listen_and_write
Usuario escucha audio (si existe) y escribe lo que oyó.
```
[Botón: 🔊 Escuchar] (opcional)
[Textarea: Escribe lo que escuches...]
```

## Flujo de comunicación

```
LessonComponent (padre)
  ↓
  ├─ Carga ejercicios
  ├─ Determina lessonType (vocabulary | translation)
  ├─ Renderiza componente especializado
  │
  └─→ VocabularyLessonComponent | TranslationLessonComponent (hijo)
       ↓
       ├─ User interactúa con UI
       ├─ Presiona COMPROBAR
       ├─ Valida respuesta (normalize)
       └─ Emite answerSubmitted
           ↓
       LessonComponent recibe resultado
       ├─ Si incorrecto: alert "Inténtalo de nuevo"
       ├─ Si correcto:
       │  ├─ addXP a Firestore
       │  ├─ Si es último: completeUnit (desbloquea siguiente)
       │  └─ Avanza índice o muestra pantalla final
```

## ExerciseResult Interface

```typescript
interface ExerciseResult {
  correct: boolean;      // ¿Respuesta correcta?
  xpEarned: number;      // XP para esta respuesta
  exerciseId?: string;   // ID del ejercicio (opcional)
}
```

## Validación

Ambos componentes normalizan la respuesta antes de comparar:
```typescript
normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}
```

Esto permite que `"Café"`, `"café"`, `"CAFÉ"` y `"café "` sean equivalentes.

## Estilos

### VocabularyLessonComponent
- **Color principal:** Púrpura (`#667eea` → `#764ba2`)
- **Badge:** "Ordenar palabras", "Opción múltiple", "Emparejar palabras"
- **Palabras:** Botones con gradiente purple, hover elevado
- **Respuesta:** Botones amarillos cuando seleccionados

### TranslationLessonComponent
- **Color principal:** Rosa (`#f093fb` → `#f5576c`)
- **Badge:** "Traducción", "Escucha y escribe"
- **Audio:** Botón con ícono speaker, deshabilitado mientras reproduce
- **Textarea:** Foco en rosa, con contador de caracteres

## Agregar un nuevo tipo

1. Crear componente hijo (p. ej., `ListeningLessonComponent`)
2. Importar en `LessonComponent`
3. Actualizar getter `lessonType` para incluir nuevo tipo
4. Agregar `@case` en el `@switch` del template
5. Documentar en `flujo-app.md`

## Testing

**VocabularyLessonComponent:**
```typescript
it('should normalize and compare word order answers', () => {
  component.exercise = { type: 'word_order', correctAnswer: 'Hola mundo' };
  component.selectedWords = ['hola', 'MUNDO'];
  component.checkAnswer();
  expect(component.answerSubmitted.emit).toHaveBeenCalledWith({ correct: true, ... });
});
```

**TranslationLessonComponent:**
```typescript
it('should play audio when button clicked', () => {
  spyOn(HTMLAudioElement.prototype, 'play');
  component.exercise = { audioUrl: 'test.mp3' };
  component.playAudio();
  expect(HTMLAudioElement.prototype.play).toHaveBeenCalled();
});
```

## Referencias

- **Lección:** `src/app/components/lesson/lesson.component.ts`
- **Tipos de ejercicio:** `src/app/models/exercise.types.ts`
- **Flujo app:** `docs/flujo-app.md`
