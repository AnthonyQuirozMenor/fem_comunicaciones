/**
 * APLICACIÓN DE LÍNEA DE TIEMPO - FEM COMUNICACIONES
 * Lógica del Cliente (Vanilla JavaScript)
 */

// Estado de la aplicación
let timelineData = [];
let currentLightboxIndex = 0;
let currentLightboxPhotos = [];

// Elementos del DOM
const timelineItemsContainer = document.getElementById('timelineItems');
const searchInput = document.getElementById('searchInput');
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

    // Traducción de scroll de rueda vertical a horizontal
    const container = document.querySelector('.timeline-container');
    if (container) {
        container.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                container.scrollLeft += e.deltaY * 1.2;
                e.preventDefault();
            }
        });
    }
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

// Genera los 16 sábados fijos desde el 15 de agosto de 2026 hasta el 28 de noviembre de 2026
function generateInitialSaturdays() {
    timelineData = [];
    let currentDate = '2026-08-15'; // Sábado 15 de agosto
    
    // Generar exactamente 16 sábados
    for (let i = 0; i < 16; i++) {
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
            { id: 'act_1_' + Date.now(), name: 'Actividad 1', description: 'hola', photos: [] },
            { id: 'act_2_' + Date.now(), name: 'Actividad 2', description: 'hola', photos: [] },
            { id: 'act_3_' + Date.now(), name: 'Actividad 3', description: 'hola', photos: [] },
            { id: 'act_4_' + Date.now(), name: 'Actividad 4', description: 'hola', photos: [] }
        ]
    };
}

// ==========================================
// LÓGICA DE PERSISTENCIA
// ==========================================

// Guardar datos al servidor
async function saveTimelineData(silent = false) {
    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(timelineData)
        });
        
        if (!response.ok) throw new Error('No se pudo guardar la información');
    } catch (error) {
        console.error(error);
        if (!silent) showToast('No se pudieron guardar los cambios en el servidor.', 'error');
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
            <!-- Nodo en la línea horizontal -->
            <div class="timeline-node"></div>
            
            <!-- Tarjeta Principal del Sábado -->
            <div class="timeline-card" data-sat-id="${saturday.id}">
                <div class="card-header">
                    <div class="card-date">
                        <i class="fa-solid fa-calendar-day"></i>
                        <h2>${saturday.formattedDate}</h2>
                    </div>
                </div>
                
                <!-- Cuadrícula de 4 Actividades -->
                <div class="activities-grid">
                    ${saturday.activities.map((activity, actIndex) => renderActivity(activity, saturday.id, actIndex)).join('')}
                </div>
            </div>
        `;
        
        timelineItemsContainer.appendChild(cardWrapper);
    });
    
}

// Renderiza una sola actividad
function renderActivity(activity, saturdayId, actIndex) {
    const photosHtml = [];
    
    // Renderizar solo las fotos existentes
    if (activity.photos && activity.photos.length > 0) {
        activity.photos.forEach((photoPath, slotIdx) => {
            if (photoPath) {
                photosHtml.push(`
                    <div class="photo-slot photo-slot-filled" data-slot="${slotIdx}">
                        <img src="${photoPath}" alt="Imagen ${slotIdx + 1}">
                        <div class="photo-overlay">
                            <button class="btn-photo-action btn-photo-view" onclick="openLightbox('${activity.id}', ${slotIdx})" title="Ampliar imagen">
                                <i class="fa-solid fa-expand"></i>
                            </button>
                        </div>
                    </div>
                `);
            }
        });
    }
    
    return `
        <div class="activity-card" data-act-id="${activity.id}">
            <div class="activity-header">
                <span class="activity-badge">Actividad 1</span>
                <h3 class="activity-title">${escapeHtml(activity.name)}</h3>
            </div>
            
            <div class="activity-desc-container">
                <p class="activity-description">${escapeHtml(activity.description)}</p>
            </div>
            
            <div class="activity-photos-container">
                <div class="photos-label">
                    <span>Fotos del registro</span>
                </div>
                <div class="photo-slots-grid">
                    ${photosHtml.join('')}
                </div>
            </div>
        </div>
    `;
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
