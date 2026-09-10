# Guía: Integrar Fondo (Angular) con Capacitor y Android Studio

## Objetivo

Esta guía explica cómo preparar el proyecto **Fondo** (Angular + Firebase) para ejecutarlo como aplicación Android mediante **Capacitor** y **Android Studio**.

La integración se hace sobre el proyecto Angular existente. **No se debe crear un proyecto Angular nuevo para Android.**

---

## 1. Requisitos previos

Cada desarrollador debe tener instalado:

- Node.js y npm
- Git
- Android Studio
- Android SDK
- Android SDK Platform-Tools
- JDK compatible con la versión de Android/Gradle utilizada por el proyecto
- **Gradle 8.12.2** (o JDK compatible con la versión de Gradle 8.12.2 utilizada por el proyecto)

Además, debe poder ejecutar el proyecto Angular normalmente.

> **Importante:** Usar una versión de Node/JDK compatible con Gradle 8.12.2 y con la versión de Capacitor instalada. Si Android Studio solicita actualizar o instalar componentes del SDK/Gradle, verificar la compatibilidad antes de aceptar.

---

## 2. Obtener el proyecto

Clonar el repositorio y entrar al proyecto:

```powershell
git clone <URL_DEL_REPOSITORIO>
cd <CARPETA_DEL_PROYECTO>
```

Si se trabaja con una rama específica:

```powershell
git checkout <rama>
```

Instalar dependencias:

```powershell
npm install
```

Comprobar que Angular funciona:

```powershell
npm start
```

Abrir la URL local que muestre Angular y verificar que la aplicación funciona antes de continuar.

---

## 3. Instalar Capacitor

Si el proyecto todavía no tiene Capacitor:

```powershell
npm install @capacitor/core @capacitor/cli
```

Inicializar Capacitor:

```powershell
npx cap init
```

Cuando solicite los datos:

### App name

```text
Fondo
```

### Package ID

```text
com.wilmerjt.fondo
```

El Package ID identifica la aplicación Android. Debe mantenerse igual entre los desarrolladores para evitar generar aplicaciones con identificadores diferentes.

---

## 4. Configuración importante de Capacitor

Angular genera actualmente los archivos de producción dentro de:

```text
dist/app-idiomas/browser
```

Por eso `webDir` debe apuntar exactamente a esa carpeta.

El archivo:

```text
capacitor.config.ts
```

debe quedar así:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wilmerjt.fondo',
  appName: 'Fondo',
  webDir: 'dist/app-idiomas/browser'
};

export default config;
```

### ¿Por qué `browser`?

El proyecto utiliza el builder moderno de Angular, que genera:

```text
dist/
└── app-idiomas/
    └── browser/
        ├── index.html
        ├── main-*.js
        └── ...
```

Por lo tanto, Capacitor debe copiar los archivos desde:

```text
dist/app-idiomas/browser
```

y no desde:

```text
dist
```

ni desde:

```text
dist/app-idiomas
```

---

## 5. Instalar Android para Capacitor

Instalar la plataforma Android:

```powershell
npm install @capacitor/android
```

Crear el proyecto Android:

```powershell
npx cap add android
```

Este comando crea la carpeta:

```text
android/
```

dentro del proyecto.

### Importante

`npx cap add android` se ejecuta **una sola vez** por proyecto/clon.

Una vez que la carpeta `android` existe, para actualizarla se utiliza:

```powershell
npx cap sync android
```

No se debe ejecutar repetidamente `npx cap add android`.

---

## 6. Construir Angular

Antes de sincronizar Capacitor:

```powershell
npm run build
```

El resultado esperado debe indicar algo parecido a:

```text
Application bundle generation complete.
Output location: ...\dist\app-idiomas
```

Aunque Angular muestre `dist/app-idiomas`, el `index.html` está dentro de:

```text
dist/app-idiomas/browser
```

Se puede comprobar con:

```powershell
Test-Path .\dist\app-idiomas\browser\index.html
```

Debe responder:

```text
True
```

---

## 7. Sincronizar Angular con Android

Después del build:

```powershell
npx cap sync android
```

Una sincronización correcta debe mostrar algo similar a:

```text
√ Copying web assets from browser to android\app\src\main\assets\public
√ Creating capacitor.config.json in android\app\src\main\assets
√ Updating Android plugins
√ update android
√ Sync finished
```

Esto significa que los archivos compilados de Angular fueron copiados al proyecto Android.

---

## 8. Abrir el proyecto en Android Studio

Ejecutar:

```powershell
npx cap open android
```

También se puede abrir manualmente desde Android Studio.

### Muy importante

Si se abre manualmente, abrir:

```text
<PROYECTO>\android
```

y **no** la carpeta raíz:

```text
<PROYECTO>
```

Android Studio debe trabajar con el proyecto nativo ubicado en:

```text
android/
```

---

## 9. Primera apertura en Android Studio

La primera vez Android Studio puede tardar porque debe:

- Descargar dependencias de Gradle.
- Sincronizar el proyecto.
- Configurar el Android SDK.
- Descargar componentes necesarios.
- Indexar el proyecto.

Esperar a que termine el **Gradle Sync**.

Si Android Studio solicita instalar SDKs o aceptar licencias, hacerlo.

---

## 10. Ejecutar en un teléfono Android

### En el teléfono

Activar:

1. Opciones de desarrollador.
2. Depuración USB.

Conectar el teléfono mediante USB.

Aceptar en el teléfono el mensaje:

```text
¿Permitir depuración USB?
```

### En Android Studio

Seleccionar el teléfono en la lista de dispositivos.

Después pulsar:

```text
Run ▶
```

Android Studio compilará e instalará la aplicación.

La aplicación debe aparecer en el teléfono como:

```text
Fondo
```

con Package ID:

```text
com.wilmerjt.fondo
```

---

## 11. Ejecutar en un emulador

También se puede utilizar un dispositivo virtual Android.

En Android Studio:

```text
Device Manager
```

Crear un dispositivo virtual si todavía no existe.

Después:

1. Iniciar el emulador.
2. Seleccionarlo como dispositivo.
3. Pulsar `Run ▶`.

---

## 12. Flujo normal de desarrollo

Una vez que Capacitor ya está configurado, **no es necesario volver a agregar Android**.

Cada vez que se modifique código Angular:

```powershell
npm run build
npx cap sync android
```

Después:

```powershell
npx cap open android
```

o, si Android Studio ya está abierto, simplemente ejecutar nuevamente:

```text
Run ▶
```

### Resumen

```text
Modificar Angular
       ↓
npm run build
       ↓
npx cap sync android
       ↓
Android Studio
       ↓
Run ▶
       ↓
Aplicación Android
```

---

## 13. Generar un APK

Cuando la aplicación esté lista para probar:

### Opción desde Android Studio

En Android Studio:

```text
Build
→ Build Bundle(s) / APK(s)
→ Build APK(s)
```

Android Studio generará el APK de la variante seleccionada.

Para una versión de distribución, posteriormente debe configurarse un **keystore** y generar un APK/AAB firmado.

> No compartir ni subir el archivo `.jks`/keystore ni sus contraseñas al repositorio.

---

## 14. Firebase en Android

La aplicación Fondo utiliza Firebase desde Angular.

La arquitectura es:

```text
                    ┌────────────────────┐
                    │      Firebase      │
                    │                    │
                    │ Auth               │
                    │ Firestore          │
                    │ Storage            │
                    └─────────▲──────────┘
                              │
                              │
┌─────────────────────────────┴──────────────────────────┐
│                         Fondo                          │
│                                                       │
│ Angular                                                │
│                                                       │
│ ┌──────────────┐ ┌──────────────┐ ┌────────────────┐ │
│ │ Login/Auth   │ │ Firestore    │ │ Storage        │ │
│ └──────────────┘ └──────────────┘ └────────────────┘ │
│                                                       │
└─────────────────────────────▲─────────────────────────┘
                              │
                         Capacitor
                              │
                              ▼
                         Android APK
```

En principio, Firebase Web continúa funcionando dentro de la aplicación Capacitor porque Angular se ejecuta dentro del WebView.

---

## 15. Pruebas recomendadas después de instalar la APK

Antes de considerar terminada la integración Android, probar:

### Autenticación

- Registro
- Login
- Logout
- Persistencia de sesión

### Firestore

- Carga del Learning Path
- Carga de unidades
- Carga de ejercicios
- Actualización de progreso
- XP
- Racha

### Vocabulary

- Carga de vocabulario
- Flashcards
- Navegación anterior/siguiente
- Traducción
- Imágenes
- Audio

### Firebase Storage

Comprobar que las imágenes/audio cargan correctamente desde Storage.

### Navegación

Probar:

```text
/welcome
/login
/dashboard
/learning-path
/lesson/:id
/profile
/juegos
/cuentos
/vocabulary/:unitId
```

### Juegos

Probar los juegos existentes.

---

## 16. Solución del error encontrado durante la configuración

Durante la primera configuración apareció:

```text
The web assets directory (.\dist) must contain an index.html file.
```

La causa fue que Capacitor estaba configurado inicialmente con:

```ts
webDir: 'dist'
```

pero Angular genera el `index.html` en:

```text
dist/app-idiomas/browser
```

La solución fue cambiar:

```ts
webDir: 'dist/app-idiomas/browser'
```

Después:

```powershell
npm run build
npx cap sync android
```

La sincronización terminó correctamente.

---

## 17. Verificación rápida para un compañero

Después de clonar el proyecto, el flujo esperado es:

```powershell
npm install
```

Si Capacitor ya está incluido en `package.json`, no es necesario instalarlo manualmente.

Construir:

```powershell
npm run build
```

Comprobar:

```powershell
Test-Path .\dist\app-idiomas\browser\index.html
```

Debe devolver:

```text
True
```

Sincronizar:

```powershell
npx cap sync android
```

Abrir Android Studio:

```powershell
npx cap open android
```

Después ejecutar con un dispositivo o emulador.

---

## 18. Comandos principales

### Primera configuración

```powershell
npm install
npm install @capacitor/core @capacitor/cli
npx cap init
npm install @capacitor/android
npx cap add android
npm run build
npx cap sync android
npx cap open android
```

### Trabajo diario después de la configuración

```powershell
npm install
npm run build
npx cap sync android
npx cap open android
```

Si Android Studio ya está abierto, después de `sync` normalmente basta con volver a ejecutar la aplicación.

---

## 19. No hacer

### No crear otro proyecto Angular

Android se integra sobre el proyecto existente mediante Capacitor.

### No ejecutar constantemente

```powershell
npx cap add android
```

Solo se ejecuta cuando la plataforma Android todavía no existe.

### No configurar

```ts
webDir: 'dist'
```

Para este proyecto.

Debe utilizarse:

```ts
webDir: 'dist/app-idiomas/browser'
```

### No subir credenciales de Firebase Admin

Archivos como:

```text
service-account.json
```

contienen credenciales privadas y nunca deben subirse al repositorio.

### No subir keystores

Los archivos de firma Android y sus contraseñas deben mantenerse fuera del repositorio o gestionarse mediante un sistema seguro de secretos.

---

## 20. Estado final de la integración

La integración realizada deja el proyecto con:

```text
Fondo/
├── src/
├── scripts/
├── firestore/
├── dist/
├── android/                  ← Proyecto nativo Android
├── capacitor.config.ts      ← Configuración Capacitor
├── package.json
└── ...
```

Configuración principal:

```ts
const config: CapacitorConfig = {
  appId: 'com.wilmerjt.fondo',
  appName: 'Fondo',
  webDir: 'dist/app-idiomas/browser'
};
```

El proyecto Angular se compila y Capacitor copia los archivos generados al proyecto Android.

---

## 21. Comando de emergencia si `sync` vuelve a fallar

Primero comprobar:

```powershell
Test-Path .\dist\app-idiomas\browser\index.html
```

Si devuelve `False`:

```powershell
npm run build
```

Después:

```powershell
npx cap sync android
```

Si devuelve `True` pero Capacitor continúa usando `dist`, revisar `capacitor.config.ts` y confirmar:

```ts
webDir: 'dist/app-idiomas/browser'
```

---

## Resultado esperado

Al finalizar, cualquier compañero con el proyecto correctamente instalado debe poder:

```text
Clonar repositorio
      ↓
npm install
      ↓
npm run build
      ↓
npx cap sync android
      ↓
npx cap open android
      ↓
Android Studio
      ↓
Run ▶
      ↓
Fondo funcionando en Android
```
