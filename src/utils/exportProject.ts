/// <reference types="vite/client" />
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Import all source files as raw text at compile-time to guarantee 100% clean TypeScript code without dev-server transformation
const sourceModules = (import.meta as any).glob(
  [
    '../*.{ts,tsx,css}',
    '../components/*.{ts,tsx}',
    '../data/*.{ts,tsx}',
    '../utils/*.{ts,tsx}',
  ],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  }
) as Record<string, string>;

/**
 * Creates and downloads a ready-to-deploy ZIP archive of the entire CineStream project
 * specially formatted for instant deployment on Vercel.
 */
export async function downloadProjectZip(): Promise<void> {
  const zip = new JSZip();

  // 1. package.json for Vercel
  zip.file('package.json', JSON.stringify({
    "name": "cinestream-verpel",
    "private": true,
    "version": "1.0.0",
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    },
    "dependencies": {
      "@tailwindcss/vite": "^4.1.14",
      "@vitejs/plugin-react": "^5.0.4",
      "file-saver": "^2.0.5",
      "firebase": "^12.18.0",
      "jszip": "^3.10.1",
      "lucide-react": "^0.546.0",
      "motion": "^12.23.24",
      "react": "^19.0.1",
      "react-dom": "^19.0.1",
      "tailwindcss": "^4.1.14",
      "vite": "^6.2.3"
    },
    "devDependencies": {
      "@types/file-saver": "^2.0.7",
      "@types/node": "^22.14.0",
      "typescript": "~5.8.2"
    },
    "engines": {
      "node": ">=18.0.0"
    }
  }, null, 2));

  // 2. vercel.json configuration
  zip.file('vercel.json', JSON.stringify({
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }, null, 2));

  // 3. vite.config.ts
  zip.file('vite.config.ts', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
`);

  // 4. tsconfig.json with resolveJsonModule and paths
  zip.file('tsconfig.json', JSON.stringify({
    "compilerOptions": {
      "target": "ES2022",
      "experimentalDecorators": true,
      "useDefineForClassFields": false,
      "module": "ESNext",
      "lib": ["ES2022", "DOM", "DOM.Iterable"],
      "skipLibCheck": true,
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "moduleDetection": "force",
      "allowJs": true,
      "jsx": "react-jsx",
      "paths": {
        "@/*": ["./*"]
      },
      "allowImportingTsExtensions": true,
      "noEmit": true
    },
    "include": ["src", "firebase-applet-config.json"]
  }, null, 2));

  // 5. .gitignore
  zip.file('.gitignore', `node_modules
dist
.vercel
.env
.env.local
.DS_Store
`);

  // 6. index.html
  zip.file('index.html', `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CineStream - Ver Películas Online</title>
    <meta name="description" content="Plataforma para ver y subir películas y series completas con reproductor integrado, gestión de episodios y catálogo personalizado." />
    <meta property="og:title" content="CineStream - Ver Películas Online" />
    <meta property="og:description" content="Plataforma para ver y subir películas y series completas con reproductor integrado, gestión de episodios y catálogo personalizado." />
    <meta property="og:type" content="website" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  </head>
  <body class="bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-rose-500 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

  // 7. firebase-applet-config.json
  zip.file('firebase-applet-config.json', JSON.stringify({
    "projectId": "dotted-bit-9xctm",
    "appId": "1:410330996618:web:334e7d3d0f16e96667b273",
    "apiKey": "AIzaSyD1-kTZxQjuktaIIP04uGSnbkc6XK0TAVc",
    "authDomain": "dotted-bit-9xctm.firebaseapp.com",
    "firestoreDatabaseId": "ai-studio-cinestreamverpel-f7e3b956-b355-43b4-919c-2031a62a6675",
    "storageBucket": "dotted-bit-9xctm.firebasestorage.app",
    "messagingSenderId": "410330996618",
    "measurementId": "",
    "oAuthClientId": "410330996618-5351u8miql0ba27cskor4h10o9geijln.apps.googleusercontent.com",
    "recaptchaSiteKey": ""
  }, null, 2));

  // 8. README.md with clear Vercel deployment guide
  zip.file('README.md', `# CineStream - Plataforma de Películas y Series (Listo para Vercel)

Este proyecto está 100% preparado para ser desplegado en **Vercel** sin errores.

## 🚀 Cómo desplegar en Vercel paso a paso:

### Opción 1: Con GitHub (Recomendada)
1. Descomprime este archivo ZIP en tu computadora.
2. Crea un repositorio nuevo en [GitHub](https://github.com/new).
3. Sube los archivos a tu repositorio GitHub.
4. Ve a [Vercel](https://vercel.com/new), selecciona **Import Git Repository** y elige tu repositorio.
5. Vercel detectará el framework **Vite** automáticamente.
6. Haz clic en **Deploy** y ¡listo! Tu web estará online en segundos.

### Opción 2: Con Vercel CLI
1. Abre tu terminal en la carpeta descomprimida.
2. Ejecuta \`npx vercel\`
3. Sigue las instrucciones en pantalla y selecciona las opciones por defecto.

## ✨ Características incluidas:
- Catálogo interactivo de películas y series.
- Reproductor nativo con barra de minutos, velocidad, volumen y subtítulos.
- Soporte para subir películas y series con episodios y guardado permanente en IndexedDB.
- Sincronización en la nube con Firebase Firestore.
- Configuración de rutas SPA lista en \`vercel.json\`.
`);

  // 9. Pack all raw source files into src/
  const srcFolder = zip.folder('src')!;
  
  for (const [modulePath, rawContent] of Object.entries(sourceModules)) {
    // modulePath is e.g. "../components/Navbar.tsx" or "../App.tsx"
    const relativePath = modulePath.replace(/^\.\.\//, '');
    srcFolder.file(relativePath, rawContent);
  }

  // Generate blob and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'cinestream-para-vercel.zip');
}
