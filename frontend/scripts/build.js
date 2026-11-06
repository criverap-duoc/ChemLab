// frontend\scripts\build.js
// F10.3: wrapper del build de CRA.
// html5-qrcode@2.3.8 publica los .js.map de esm/ y cjs/ apuntando a fuentes .ts que
// no incluye en el paquete; source-map-loader emite un warning por cada archivo y CRA
// los convierte en ERROR cuando CI=true (GitHub Actions y Vercel), rompiendo el deploy.
// Desactivar los sourcemaps de producción es equivalente a GENERATE_SOURCEMAP=false,
// pero sin depender de la shell (cmd/bash) ni de añadir cross-env.
process.env.GENERATE_SOURCEMAP = 'false';

// Ejecuta el build estándar de react-scripts (misma salida en build/).
require('react-scripts/scripts/build');
