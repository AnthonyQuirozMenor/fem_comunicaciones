# Línea de Tiempo - FEM COMUNICACIONES

Este proyecto es una aplicación web local e interactiva diseñada para la gestión y registro de actividades de **FEM COMUNICACIONES** en formato de línea de tiempo.

La aplicación inicia el **15 de agosto de 2026** en adelante y muestra exclusivamente los días **sábado**. Cada sábado cuenta con 4 actividades preconfiguradas donde se pueden registrar detalles y subir hasta 3 fotografías locales de evidencia.

---

## 🚀 Características

- **Diseño Premium y Moderno**: Interfaz con modo oscuro, efectos de Glassmorphism (cristal esmerilado) y gradientes ambientales.
- **Autoguardado Inteligente**: Todos los cambios en los títulos de las actividades, descripciones e imágenes se guardan automáticamente localmente sin necesidad de presionar ningún botón.
- **Carga de Imágenes**: Permite subir hasta 3 fotos por actividad. Las fotos se almacenan localmente en la carpeta física `fotos/`.
- **Visor Lightbox**: Permite ampliar las fotos en pantalla completa con controles interactivos de navegación.
- **Búsqueda Integrada**: Filtro rápido de actividades y fechas desde la cabecera.
- **Ampliación de la Línea de Tiempo**: Botón dinámico para agregar automáticamente el siguiente sábado del calendario.

---

## 🛠️ Cómo Ejecutar en Windows (Sin dependencias)

No necesitas instalar Node.js, Python ni bases de datos. Todo funciona utilizando utilidades nativas de Windows.

1. Descarga o clona este repositorio en tu computadora.
2. Haz **doble clic** en el archivo **`run.bat`**.
3. Se abrirá automáticamente una ventana de terminal (que ejecuta el servidor local en el puerto `8000`) y se abrirá tu navegador predeterminado en **`http://localhost:8000/`**.
4. ¡Listo! Puedes comenzar a llenar tus actividades y subir imágenes.

*Nota: Para cerrar la aplicación, simplemente cierra la ventana negra de la terminal.*

---

## 📂 Estructura del Directorio

- `run.bat` - Archivo iniciador que abre el navegador e inicia el servidor.
- `server.ps1` - Servidor web nativo ligero basado en PowerShell HttpListener.
- `index.html` - Maquetación y estructura principal de la aplicación.
- `style.css` - Estilos visuales del tema oscuro de alto nivel.
- `app.js` - Lógica de cliente, autoguardado, carga y filtrado.
- `fotos/` - Carpeta donde se guardan tus fotos subidas físicamente.
- `.gitignore` - Configuración para evitar que tus fotos de registro privadas y archivos de datos temporales se suban al repositorio público.
