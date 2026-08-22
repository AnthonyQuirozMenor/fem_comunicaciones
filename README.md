# Línea de Tiempo Espacial - FEM COMUNICACIONES

Este proyecto es una aplicación web local e interactiva diseñada para la gestión y registro de actividades de **FEM COMUNICACIONES** en formato de línea de tiempo con tema del universo 3D.

La aplicación abarca el periodo del **22 de agosto de 2026** al **21 de noviembre de 2026** y muestra exclusivamente los días **sábado**. Cada sábado cuenta con 4 actividades preconfiguradas donde se pueden visualizar registros y fotografías locales de evidencia.

---

## 🚀 Características y Novedades

- **Fondo 3D de Miles de Estrellas**: Renderizado tridimensional en tiempo real con Three.js compuesto por más de 8,000 estrellas en múltiples capas de profundidad, rotación suave y efecto de paralaje interactivo.
- **Línea Temporal Central con Remate Exacto**: La línea del tiempo atraviesa el centro vertical de la pantalla y se extiende **exactamente desde el 22 de agosto hasta el nodo final del 21 de noviembre de 2026** con su flecha guía.
- **Tarjetas Alternadas**: Las tarjetas de las fechas se posicionan alternadamente **arriba y abajo** de la línea central con conectores verticales luminosos.
- **Diseño Ultra-Premium y Moderno**: Modo oscuro con efectos de Glassmorphism (cristal esmerilado), neones rosa (`#F652A0`) y violeta.
- **Controles HUD Flotantes**: Cabecera reemplazada por un control HUD minimalista integrado en el espacio.
- **Visor Lightbox Integrado**: Permite ampliar las fotos en pantalla completa con controles interactivos.

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
- `style.css` - Estilos del tema espacial, glassmorphism y línea dinámica.
- `app.js` - Lógica de cliente, motor Three.js 3D de 8,000 estrellas y cálculo dinámico de la línea de tiempo.
- `data.json` - Datos del 22 de agosto al 21 de noviembre de 2026.
- `fotos/` - Carpeta donde se guardan tus fotos de evidencia.
