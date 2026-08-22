# Línea de Tiempo Espacial - FEM COMUNICACIONES

Este proyecto es una aplicación web local e interactiva diseñada para la gestión y registro de actividades de **FEM COMUNICACIONES** en formato de línea de tiempo con tema del universo 3D.

La aplicación inicia el **22 de agosto de 2026** en adelante y muestra exclusivamente los días **sábado**. Cada sábado cuenta con 4 actividades preconfiguradas donde se pueden visualizar registros y fotografías locales de evidencia.

---

## 🚀 Características y Novedades

- **Fondo 3D Interactivo del Universo**: Renderizado tridimensional en tiempo real con Three.js, partículas estelares, nebulosas y efecto de paralaje interactivo al mover el ratón.
- **Línea Temporal Central Alternada**: La línea del tiempo atraviesa el centro vertical de la pantalla y las tarjetas de fechas se distribuyen alternadamente **arriba y abajo** de la línea con conectores luminosos.
- **Diseño Ultra-Premium y Moderno**: Modo oscuro con efectos de Glassmorphism (cristal esmerilado), neones rosa (`#F652A0`) y violeta.
- **Controles HUD Flotantes**: Cabecera reemplazada por un control HUD minimalista integrado en el espacio.
- **Visor Lightbox Integrado**: Permite ampliar las fotos en pantalla completa con controles interactivos.
- **Búsqueda en Tiempo Real**: Filtro rápido de actividades y fechas.

---

## 🛠️ Cómo Ejecutar en Windows (Sin dependencias)

1. Descarga o clona este repositorio en tu computadora.
2. Haz **doble clic** en el archivo **`run.bat`**.
3. Se abrirá automáticamente una ventana de terminal (servidor local en el puerto `8000`) y tu navegador predeterminado en **`http://localhost:8000/`**.
4. ¡Listo! Explora la línea de tiempo galáctica.

---

## 📂 Estructura del Directorio

- `run.bat` - Archivo iniciador que abre el navegador e inicia el servidor.
- `server.ps1` - Servidor web nativo ligero basado en PowerShell HttpListener.
- `index.html` - Maquetación con el canvas 3D y elementos HUD.
- `style.css` - Estilos del tema espacial, glassmorphism y disposición alternada arriba/abajo.
- `app.js` - Lógica de cliente, motor Three.js 3D, autoguardado y filtrado.
- `data.json` - Datos persistidos iniciando el 22 de agosto de 2026.
- `fotos/` - Carpeta donde se guardan tus fotos de evidencia.
