/**
 * APLICACIÓN DE LÍNEA DE TIEMPO - FEM COMUNICACIONES
 * Lógica del Cliente (Vanilla JavaScript)
 */

// Estado de la aplicación
let timelineData = [];
let autosaveTimeout = null;
let currentLightboxIndex = 0;
let currentLightboxPhotos = [];

// Elementos del DOM
const timelineItemsContainer = document.getElementById('timelineItems');
const addSaturdayBtn = document.getElementById('addSaturdayBtn');
const searchInput = document.getElementById('searchInput');
const saveStatusBadge = document.getElementById('saveStatus');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxPrev = document.querySelector('.lightbox-prev');
const lightboxNext = document.querySelector('.lightbox-next');
const toastElement = document.getElementById('toast');

// Inicializar la aplicación al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
    loadTimelineData();
    setupEventListeners();
});

// Registrar eventos globales
function setupEventListeners() {
    // Botón Agregar Sábado
    addSaturdayBtn.addEventListener('click', addSaturday);
    
    // Campo de búsqueda
    searchInput.addEventListener('input', filterTimeline);
    
    // Cerrar Lightbox
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    
    // Navegación en Lightbox
    lightboxPrev.addEventListener('click', prevLightboxImage);
    lightboxNext.addEventListener('click', nextLightboxImage);
    
    // Atajos de teclado para Lightbox
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevLightboxImage();
        if (e.key === 'ArrowRight') nextLightboxImage();
    });
}

// ==========================================
// CARGA Y GENERACIÓN DE DATOS
// ==========================================

// Cargar datos desde el servidor
async function loadTimelineData() {
    try {
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error('Error al conectar con la base de datos');
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            timelineData = data;
        } else {
            // Generar estado inicial por defecto si el archivo está vacío
            generateInitialSaturdays();
            await saveTimelineData(true); // Guardar inmediatamente silencioso
        }
        
        renderTimeline();
    } catch (error) {
        console.error(error);
        showToast('Error al cargar la línea de tiempo. Cargando datos locales sin conexión.', 'error');
        generateInitialSaturdays();
        renderTimeline();
    }
}

// Genera los primeros sábados por defecto empezando del 15 de agosto de 2026
function generateInitialSaturdays() {
    timelineData = [];
    let currentDate = '2026-08-15'; // Sábado 15 de agosto
    
    // Generar 4 sábados iniciales
    for (let i = 0; i < 4; i++) {
        timelineData.push(createNewSaturdayObject(currentDate));
        currentDate = calculateNextSaturdayDate(currentDate);
    }
}

// Crea la estructura de datos básica de un Sábado con 4 actividades
function createNewSaturdayObject(dateString) {
    const formatted = formatSpanishDate(dateString);
    return {
        id: 'sat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        date: dateString,
        formattedDate: formatted,
        activities: [
            { id: 'act_1_' + Date.now(), name: 'Actividad 1', description: '', photos: [] },
            { id: 'act_2_' + Date.now(), name: 'Actividad 2', description: '', photos: [] },
            { id: 'act_3_' + Date.now(), name: 'Actividad 3', description: '', photos: [] },
            { id: 'act_4_' + Date.now(), name: 'Actividad 4', description: '', photos: [] }
        ]
    };
}

// ==========================================
// LÓGICA DE PERSISTENCIA (AUTOSAVE)
// ==========================================

// Guardar datos al servidor
async function saveTimelineData(silent = false) {
    if (!silent) setSaveStatus('saving');
    
    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(timelineData)
        });
        
        if (!response.ok) throw new Error('No se pudo guardar la información');
        
        if (!silent) setSaveStatus('saved');
    } catch (error) {
        console.error(error);
        if (!silent) setSaveStatus('error');
        showToast('No se pudieron guardar los cambios en el servidor.', 'error');
    }
}

// Disparar autoguardado con retardo para evitar sobrecargar al escribir
function triggerAutosave() {
    setSaveStatus('saving');
    if (autosaveTimeout) clearTimeout(autosaveTimeout);
    
    autosaveTimeout = setTimeout(() => {
        saveTimelineData();
    }, 800); // 800ms después de que el usuario deja de escribir
}

// Actualizar indicador visual de guardado
function setSaveStatus(status) {
    saveStatusBadge.className = 'save-status ' + status;
    const icon = saveStatusBadge.querySelector('i');
    const text = saveStatusBadge.querySelector('span');
    
    if (status === 'saved') {
        icon.className = 'fa-solid fa-cloud-arrow-up';
        text.innerText = 'Cambios guardados';
    } else if (status === 'saving') {
        icon.className = 'fa-solid fa-circle-notch';
        text.innerText = 'Guardando...';
    } else if (status === 'error') {
        icon.className = 'fa-solid fa-triangle-exclamation';
        text.innerText = 'Error al guardar';
    }
}

// ==========================================
// RENDERIZADO DE LA LÍNEA DE TIEMPO
// ==========================================

function renderTimeline() {
    timelineItemsContainer.innerHTML = '';
    
    if (timelineData.length === 0) {
        timelineItemsContainer.innerHTML = `
            <div class="loading-state">
                <i class="fa-solid fa-calendar-xmark"></i>
                <p>No hay sábados registrados en la línea de tiempo.</p>
            </div>
        `;
        return;
    }
    
    timelineData.forEach((saturday, satIndex) => {
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'timeline-card-wrapper';
        cardWrapper.setAttribute('data-date', saturday.date);
        cardWrapper.setAttribute('data-id', saturday.id);
        
        // Generar HTML de la tarjeta
        cardWrapper.innerHTML = `
            <!-- Nodo en la línea vertical -->
            <div class="timeline-node"></div>
            
            <!-- Tarjeta Principal del Sábado -->
            <div class="timeline-card">
                <div class="card-header">
                    <div class="card-date">
                        <i class="fa-solid fa-calendar-day"></i>
                        <h2>${saturday.formattedDate}</h2>
                    </div>
                    <button class="btn-delete-saturday" onclick="deleteSaturday('${saturday.id}')" title="Eliminar este sábado">
                        <i class="fa-solid fa-trash-can"></i>
                        <span>Eliminar</span>
                    </button>
                </div>
                
                <!-- Cuadrícula de 4 Actividades -->
                <div class="activities-grid">
                    ${saturday.activities.map((activity, actIndex) => renderActivity(activity, saturday.id, actIndex)).join('')}
                </div>
            </div>
        `;
        
        timelineItemsContainer.appendChild(cardWrapper);
    });
    
    // Asociar inputs y descripciones dinámicamente tras renderizar
    bindCardInputs();
}

// Renderiza una sola actividad
function renderActivity(activity, saturdayId, actIndex) {
    const photosHtml = [];
    
    // Renderizar exactamente 3 ranuras para fotos
    for (let slotIdx = 0; slotIdx < 3; slotIdx++) {
        const photoPath = activity.photos[slotIdx];
        
        if (photoPath) {
            // Ranura con foto cargada
            photosHtml.push(`
                <div class="photo-slot photo-slot-filled" data-slot="${slotIdx}">
                    <img src="${photoPath}" alt="Imagen ${slotIdx + 1}">
                    <div class="photo-overlay">
                        <button class="btn-photo-action btn-photo-view" onclick="openLightbox('${activity.id}', ${slotIdx})" title="Ampliar imagen">
                            <i class="fa-solid fa-expand"></i>
                        </button>
                        <button class="btn-photo-action btn-photo-delete" onclick="deletePhoto('${saturdayId}', '${activity.id}', ${slotIdx})" title="Eliminar imagen">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `);
        } else {
            // Ranura vacía (lista para subir)
            photosHtml.push(`
                <div class="photo-slot photo-slot-empty" data-slot="${slotIdx}" onclick="triggerPhotoUpload('${saturdayId}', '${activity.id}', ${slotIdx})">
                    <i class="fa-solid fa-circle-plus"></i>
                    <span>+ Imagen</span>
                </div>
            `);
        }
    }
    
    return `
        <div class="activity-card" data-act-id="${activity.id}">
            <div class="activity-header">
                <span class="activity-badge">Actividad ${actIndex + 1}</span>
                <input type="text" class="activity-title-input" 
                    value="${escapeHtml(activity.name)}" 
                    data-sat-id="${saturdayId}" 
                    data-act-id="${activity.id}" 
                    placeholder="Título de la actividad...">
            </div>
            
            <div class="activity-desc-container">
                <textarea class="activity-desc-textarea" 
                    data-sat-id="${saturdayId}" 
                    data-act-id="${activity.id}" 
                    placeholder="Escriba aquí los detalles o descripción de esta actividad...">${escapeHtml(activity.description)}</textarea>
            </div>
            
            <div class="activity-photos-container">
                <div class="photos-label">
                    <span>Fotos del registro (Máx 3)</span>
                    <span>${activity.photos.length}/3</span>
                </div>
                <div class="photo-slots-grid">
                    ${photosHtml.join('')}
                </div>
            </div>
        </div>
    `;
}

// Vincular los eventos onChange a los campos de texto
function bindCardInputs() {
    // Escuchar títulos
    const titleInputs = document.querySelectorAll('.activity-title-input');
    titleInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const satId = e.target.getAttribute('data-sat-id');
            const actId = e.target.getAttribute('data-act-id');
            const newName = e.target.value;
            
            updateActivityProperty(satId, actId, 'name', newName);
            triggerAutosave();
        });
    });
    
    // Escuchar descripciones
    const descTextareas = document.querySelectorAll('.activity-desc-textarea');
    descTextareas.forEach(textarea => {
        textarea.addEventListener('input', (e) => {
            const satId = e.target.getAttribute('data-sat-id');
            const actId = e.target.getAttribute('data-act-id');
            const newDesc = e.target.value;
            
            updateActivityProperty(satId, actId, 'description', newDesc);
            triggerAutosave();
        });
    });
}

// Actualiza una propiedad del JSON local
function updateActivityProperty(satId, actId, property, value) {
    const saturday = timelineData.find(s => s.id === satId);
    if (!saturday) return;
    
    const activity = saturday.activities.find(a => a.id === actId);
    if (!activity) return;
    
    activity[property] = value;
}

// ==========================================
// CONTROL DE SÁBADOS (AÑADIR / ELIMINAR)
// ==========================================

// Añadir un nuevo sábado
function addSaturday() {
    let newDate = '2026-08-15'; // Fecha inicial si no hay elementos
    
    if (timelineData.length > 0) {
        // Encontrar la fecha más reciente y sumarle 7 días
        const sortedSaturdays = [...timelineData].sort((a, b) => new Date(a.date) - new Date(b.date));
        const lastSaturday = sortedSaturdays[sortedSaturdays.length - 1];
        newDate = calculateNextSaturdayDate(lastSaturday.date);
    }
    
    const newSaturday = createNewSaturdayObject(newDate);
    timelineData.push(newSaturday);
    
    // Volver a ordenar por fecha para mantener el timeline coherente
    timelineData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    saveTimelineData();
    renderTimeline();
    
    // Hacer scroll suave hacia el nuevo elemento
    setTimeout(() => {
        const element = document.querySelector(`[data-id="${newSaturday.id}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Efecto flash de luz sutil
            element.querySelector('.timeline-card').style.boxShadow = '0 0 40px rgba(217, 70, 239, 0.4)';
            setTimeout(() => {
                element.querySelector('.timeline-card').style.boxShadow = '';
            }, 1000);
        }
    }, 100);
    
    showToast(`Se agregó el sábado ${formatSpanishDate(newDate)}`);
}

// Eliminar un sábado
function deleteSaturday(satId) {
    const saturday = timelineData.find(s => s.id === satId);
    if (!saturday) return;
    
    if (confirm(`¿Está seguro de eliminar el Sábado ${saturday.formattedDate} y todas sus actividades? Esta acción no se puede deshacer.`)) {
        timelineData = timelineData.filter(s => s.id !== satId);
        saveTimelineData();
        renderTimeline();
        showToast('Sábado eliminado correctamente.', 'success');
    }
}

// ==========================================
// SUBIDA Y ELIMINACIÓN DE FOTOS
// ==========================================

// Iniciar proceso de subida simulando clic en un input oculto
function triggerPhotoUpload(satId, actId, slotIndex) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'hidden-file-input';
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Mostrar animación de cargando en la ranura
        setPhotoSlotLoading(actId, slotIndex, true);
        
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'X-File-Name': file.name
                },
                body: file // Envío del archivo binario puro
            });
            
            if (!response.ok) throw new Error('Error al subir el archivo');
            
            const result = await response.json();
            
            if (result.status === 'success' && result.filePath) {
                // Guardar ruta de la foto en la actividad correspondiente
                const saturday = timelineData.find(s => s.id === satId);
                const activity = saturday.activities.find(a => a.id === actId);
                
                // Asegurar que la imagen se coloque en la ranura correcta
                activity.photos[slotIndex] = result.filePath;
                
                await saveTimelineData();
                renderTimeline();
                showToast('Foto cargada exitosamente.', 'success');
            } else {
                throw new Error('Respuesta inválida del servidor');
            }
        } catch (error) {
            console.error(error);
            showToast('No se pudo subir la foto. Intente de nuevo.', 'error');
            setPhotoSlotLoading(actId, slotIndex, false);
        }
    });
    
    fileInput.click();
}

// Cambiar la visualización del slot a "Cargando..."
function setPhotoSlotLoading(actId, slotIndex, isLoading) {
    const activityCard = document.querySelector(`[data-act-id="${actId}"]`);
    if (!activityCard) return;
    
    const slot = activityCard.querySelectorAll('.photo-slot')[slotIndex];
    if (!slot) return;
    
    if (isLoading) {
        slot.className = 'photo-slot photo-slot-loading';
        slot.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Subiendo...</span>
        `;
        slot.onclick = null; // Desactivar clics
    } else {
        slot.className = 'photo-slot photo-slot-empty';
        slot.innerHTML = `
            <i class="fa-solid fa-circle-plus"></i>
            <span>+ Imagen</span>
        `;
    }
}

// Eliminar una foto de una actividad
function deletePhoto(satId, actId, slotIndex) {
    if (confirm('¿Está seguro de eliminar esta imagen?')) {
        const saturday = timelineData.find(s => s.id === satId);
        const activity = saturday.activities.find(a => a.id === actId);
        
        // Quitar la foto de la ranura (dejar el espacio como undefined/vaciado)
        activity.photos.splice(slotIndex, 1);
        
        saveTimelineData();
        renderTimeline();
        showToast('Foto eliminada.', 'success');
    }
}

// ==========================================
// VISUALIZADOR DE IMÁGENES (LIGHTBOX)
// ==========================================

function openLightbox(actId, slotIndex) {
    // Buscar la actividad para extraer sus fotos
    let activity = null;
    for (let s of timelineData) {
        activity = s.activities.find(a => a.id === actId);
        if (activity) break;
    }
    
    if (!activity || !activity.photos || activity.photos.length === 0) return;
    
    // Guardar las fotos actuales de la actividad y la posición inicial
    currentLightboxPhotos = activity.photos.filter(p => p !== null && p !== undefined);
    const selectedPhotoPath = activity.photos[slotIndex];
    currentLightboxIndex = currentLightboxPhotos.indexOf(selectedPhotoPath);
    
    if (currentLightboxIndex === -1) currentLightboxIndex = 0;
    
    updateLightboxContent(activity.name);
    
    lightbox.style.display = 'flex';
    // Forzar reflow para animación
    lightbox.offsetWidth;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Detener scroll de fondo
}

function updateLightboxContent(activityName) {
    const photoPath = currentLightboxPhotos[currentLightboxIndex];
    if (!photoPath) return;
    
    lightboxImg.src = photoPath;
    lightboxCaption.innerText = `${activityName} - Foto ${currentLightboxIndex + 1} de ${currentLightboxPhotos.length}`;
    
    // Ocultar botones de navegación si solo hay una imagen
    if (currentLightboxPhotos.length <= 1) {
        lightboxPrev.style.display = 'none';
        lightboxNext.style.display = 'none';
    } else {
        lightboxPrev.style.display = 'flex';
        lightboxNext.style.display = 'flex';
    }
}

function closeLightbox() {
    lightbox.classList.remove('active');
    setTimeout(() => {
        lightbox.style.display = 'none';
        lightboxImg.src = '';
        document.body.style.overflow = ''; // Restaurar scroll
    }, 300);
}

function prevLightboxImage(e) {
    if (e) e.stopPropagation();
    if (currentLightboxPhotos.length <= 1) return;
    
    currentLightboxIndex--;
    if (currentLightboxIndex < 0) {
        currentLightboxIndex = currentLightboxPhotos.length - 1;
    }
    
    // Obtener el nombre de la actividad basándonos en la foto actual
    const activityName = getActivityNameByPhoto(currentLightboxPhotos[currentLightboxIndex]);
    updateLightboxContent(activityName);
}

function nextLightboxImage(e) {
    if (e) e.stopPropagation();
    if (currentLightboxPhotos.length <= 1) return;
    
    currentLightboxIndex++;
    if (currentLightboxIndex >= currentLightboxPhotos.length) {
        currentLightboxIndex = 0;
    }
    
    const activityName = getActivityNameByPhoto(currentLightboxPhotos[currentLightboxIndex]);
    updateLightboxContent(activityName);
}

// Helper para encontrar el título de la actividad por la ruta de la foto
function getActivityNameByPhoto(photoPath) {
    for (let s of timelineData) {
        for (let a of s.activities) {
            if (a.photos.includes(photoPath)) {
                return a.name;
            }
        }
    }
    return 'Actividad';
}

// ==========================================
// FILTRO DE BÚSQUEDA
// ==========================================

function filterTimeline() {
    const query = searchInput.value.toLowerCase().trim();
    const cardWrappers = document.querySelectorAll('.timeline-card-wrapper');
    
    cardWrappers.forEach(wrapper => {
        const satId = wrapper.getAttribute('data-id');
        const saturday = timelineData.find(s => s.id === satId);
        if (!saturday) return;
        
        // Coincidencia con fecha
        const dateMatch = saturday.formattedDate.toLowerCase().includes(query) || saturday.date.includes(query);
        
        // Coincidencia con actividades
        const activitiesMatch = saturday.activities.some(act => {
            const nameMatch = act.name.toLowerCase().includes(query);
            const descMatch = act.description.toLowerCase().includes(query);
            return nameMatch || descMatch;
        });
        
        if (dateMatch || activitiesMatch) {
            wrapper.style.display = 'block';
            
            // Si la búsqueda es específica de alguna actividad, podemos resaltar las tarjetas internas
            const activityCards = wrapper.querySelectorAll('.activity-card');
            activityCards.forEach(card => {
                const actId = card.getAttribute('data-act-id');
                const act = saturday.activities.find(a => a.id === actId);
                
                if (query !== '' && (act.name.toLowerCase().includes(query) || act.description.toLowerCase().includes(query))) {
                    card.style.borderColor = 'var(--accent-indigo)';
                    card.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.2)';
                } else {
                    card.style.borderColor = '';
                    card.style.boxShadow = '';
                }
            });
        } else {
            wrapper.style.display = 'none';
        }
    });
    
    // Ocultar o mostrar la línea vertical central según si hay resultados visibles
    const visibleCards = document.querySelectorAll('.timeline-card-wrapper[style="display: block;"], .timeline-card-wrapper:not([style])');
    const timelineLine = document.querySelector('.timeline-line');
    
    if (visibleCards.length === 0) {
        timelineLine.style.display = 'none';
    } else {
        timelineLine.style.display = 'block';
    }
}

// ==========================================
// UTILIDADES COMPLEMENTARIAS
// ==========================================

// Formatear fecha YYYY-MM-DD en texto largo en español
function formatSpanishDate(dateString) {
    // Añadimos hora local (T12:00:00) para evitar desfase por huso horario en UTC
    const date = new Date(dateString + 'T12:00:00');
    
    const options = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };
    
    let formatted = date.toLocaleDateString('es-ES', options);
    
    // Capitalizar primera letra del día y del mes
    formatted = formatted.replace(/^\w/, c => c.toUpperCase());
    
    // Reemplazar después de comas (por ejemplo: "Sábado, 15 de agosto...")
    formatted = formatted.replace(/,\s\w/, c => c.toUpperCase());
    
    return formatted;
}

// Calcular el siguiente sábado sumando 7 días
function calculateNextSaturdayDate(lastDateString) {
    const date = new Date(lastDateString + 'T12:00:00');
    const nextDate = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const yyyy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
    const dd = String(nextDate.getDate()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd}`;
}

// Mostrar alertas tipo Toast en la esquina inferior derecha
function showToast(message, type = 'success') {
    toastElement.innerText = message;
    toastElement.className = `toast show ${type}`;
    
    setTimeout(() => {
        toastElement.classList.remove('show');
    }, 3000);
}

// Escapar caracteres HTML peligrosos
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
