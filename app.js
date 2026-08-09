/**
 * APLICACIÓN DE LÍNEA DE TIEMPO - FEM COMUNICACIONES
 * Lógica del Cliente (Solo Lectura)
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
            // Solo aplicar scroll horizontal si el contenedor puede hacer scroll horizontal (vista escritorio)
            if (window.innerWidth > 768 && e.deltaY !== 0) {
                container.scrollLeft += e.deltaY * 1.2;
                e.preventDefault();
            }
        });
    }
}

// ==========================================
// CARGA DE DATOS (SOLO LECTURA)
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
            // Generar datos locales en memoria como respaldo (sin persistencia en servidor)
            generateInitialSaturdays();
        }
        
        renderTimeline();
    } catch (error) {
        console.error(error);
        showToast('Error al cargar datos. Mostrando plantilla de respaldo.', 'error');
        generateInitialSaturdays();
        renderTimeline();
    }
}

// Genera los 16 sábados fijos desde el 15 de agosto de 2026 como respaldo
function generateInitialSaturdays() {
    timelineData = [];
    let currentDate = '2026-08-15'; // Sábado 15 de agosto
    
    for (let i = 0; i < 16; i++) {
        timelineData.push({
            id: 'sat_' + (i + 1),
            date: currentDate,
            formattedDate: formatSpanishDate(currentDate),
            activities: [
                { id: `sat_${i+1}_act_1`, name: 'Planificación y Bienvenida', description: 'Reunión inicial de coordinación.', photos: [] },
                { id: `sat_${i+1}_act_2`, name: 'Talleres Prácticos', description: 'Desarrollo de las dinámicas planificadas.', photos: [] },
                { id: `sat_${i+1}_act_3`, name: 'Revisión y Enlaces', description: 'Control de avances y acuerdos del día.', photos: [] },
                { id: `sat_${i+1}_act_4`, name: 'Evaluación y Cierre', description: 'Retroalimentación grupal de la jornada.', photos: [] }
            ]
        });
        currentDate = calculateNextSaturdayDate(currentDate);
    }
}

// ==========================================
// RENDERIZADO DE LA LÍNEA DE TIEMPO
// ==========================================

function renderTimeline() {
    // Limpiar contenedor e insertar la línea base del recorrido
    timelineItemsContainer.innerHTML = '<div class="timeline-line"></div>';
    
    if (timelineData.length === 0) {
        timelineItemsContainer.innerHTML = `
            <div class="loading-state">
                <i class="fa-solid fa-calendar-xmark"></i>
                <p>No hay actividades registradas en la línea de tiempo.</p>
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
            <!-- Nodo en la línea horizontal/vertical -->
            <div class="timeline-node"></div>
            
            <!-- Tarjeta Principal del Sábado -->
            <div class="timeline-card" data-sat-id="${saturday.id}">
                <div class="card-header">
                    <div class="card-date">
                        <i class="fa-solid fa-calendar-day"></i>
                        <h2>${saturday.formattedDate || formatSpanishDate(saturday.date)}</h2>
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
    
    // Renderizar las fotos existentes (subidas manualmente en la carpeta /fotos/)
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
    
    // Si no hay fotos registradas, mostramos espacios vacíos elegantes con bordes discontinuos
    while (photosHtml.length < 3) {
        photosHtml.push(`
            <div class="photo-slot photo-slot-empty" title="Sin foto cargada"></div>
        `);
    }
    
    return `
        <div class="activity-card" data-act-id="${activity.id}">
            <div class="activity-header">
                <span class="activity-badge">Actividad ${actIndex + 1}</span>
                <h3 class="activity-title">${escapeHtml(activity.name)}</h3>
            </div>
            
            <div class="activity-desc-container">
                <p class="activity-description">${escapeHtml(activity.description)}</p>
            </div>
            
            <div class="activity-photos-container">
                <div class="photos-label">
                    <span>Registro Fotográfico</span>
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
    let activity = null;
    for (let s of timelineData) {
        activity = s.activities.find(a => a.id === actId);
        if (activity) break;
    }
    
    if (!activity || !activity.photos || activity.photos.length === 0) return;
    
    currentLightboxPhotos = activity.photos.filter(p => p !== null && p !== undefined && p !== '');
    const selectedPhotoPath = activity.photos[slotIndex];
    currentLightboxIndex = currentLightboxPhotos.indexOf(selectedPhotoPath);
    
    if (currentLightboxIndex === -1) currentLightboxIndex = 0;
    
    updateLightboxContent(activity.name);
    
    lightbox.style.display = 'flex';
    lightbox.offsetWidth; // Reflow
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function updateLightboxContent(activityName) {
    const photoPath = currentLightboxPhotos[currentLightboxIndex];
    if (!photoPath) return;
    
    lightboxImg.src = photoPath;
    lightboxCaption.innerText = `${activityName} - Foto ${currentLightboxIndex + 1} de ${currentLightboxPhotos.length}`;
    
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
        document.body.style.overflow = '';
    }, 300);
}

function prevLightboxImage(e) {
    if (e) e.stopPropagation();
    if (currentLightboxPhotos.length <= 1) return;
    
    currentLightboxIndex--;
    if (currentLightboxIndex < 0) {
        currentLightboxIndex = currentLightboxPhotos.length - 1;
    }
    
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

function getActivityNameByPhoto(photoPath) {
    for (let s of timelineData) {
        for (let a of s.activities) {
            if (a.photos && a.photos.includes(photoPath)) {
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
    let visibleCount = 0;
    
    cardWrappers.forEach(wrapper => {
        const satId = wrapper.getAttribute('data-id');
        const saturday = timelineData.find(s => s.id === satId);
        if (!saturday) return;
        
        const dateMatch = saturday.formattedDate.toLowerCase().includes(query) || saturday.date.includes(query);
        const activitiesMatch = saturday.activities.some(act => {
            const nameMatch = act.name.toLowerCase().includes(query);
            const descMatch = act.description.toLowerCase().includes(query);
            return nameMatch || descMatch;
        });
        
        if (dateMatch || activitiesMatch) {
            wrapper.style.display = 'block';
            visibleCount++;
            
            const activityCards = wrapper.querySelectorAll('.activity-card');
            activityCards.forEach(card => {
                const actId = card.getAttribute('data-act-id');
                const act = saturday.activities.find(a => a.id === actId);
                
                if (query !== '' && (act.name.toLowerCase().includes(query) || act.description.toLowerCase().includes(query))) {
                    card.style.borderColor = 'var(--accent-pink)';
                    card.style.boxShadow = '0 0 15px rgba(246, 82, 160, 0.25)';
                } else {
                    card.style.borderColor = '';
                    card.style.boxShadow = '';
                }
            });
        } else {
            wrapper.style.display = 'none';
        }
    });
    
    const timelineLine = document.querySelector('.timeline-line');
    if (timelineLine) {
        if (visibleCount === 0) {
            timelineLine.style.display = 'none';
        } else {
            timelineLine.style.display = 'block';
            
            // Si hay filtros activos, ajustar la línea horizontal
            if (query !== '' && window.innerWidth > 768) {
                // Encontrar el primer y último elemento visible para ajustar los extremos de la línea
                const visibleElements = Array.from(cardWrappers).filter(el => el.style.display !== 'none');
                if (visibleElements.length > 0) {
                    const firstEl = visibleElements[0];
                    const lastEl = visibleElements[visibleElements.length - 1];
                    
                    const leftOffset = firstEl.offsetLeft + 190;
                    const rightOffset = timelineItemsContainer.offsetWidth - (lastEl.offsetLeft + 190);
                    
                    timelineLine.style.left = `${leftOffset}px`;
                    timelineLine.style.right = `${rightOffset}px`;
                }
            } else {
                // Restaurar valores por defecto
                timelineLine.style.left = '';
                timelineLine.style.right = '';
            }
        }
    }
}

// ==========================================
// UTILIDADES COMPLEMENTARIAS
// ==========================================

function formatSpanishDate(dateString) {
    const date = new Date(dateString + 'T12:00:00');
    const options = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };
    
    let formatted = date.toLocaleDateString('es-ES', options);
    formatted = formatted.replace(/^\w/, c => c.toUpperCase());
    formatted = formatted.replace(/,\s\w/, c => c.toUpperCase());
    return formatted;
}

function calculateNextSaturdayDate(lastDateString) {
    const date = new Date(lastDateString + 'T12:00:00');
    const nextDate = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const yyyy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
    const dd = String(nextDate.getDate()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd}`;
}

function showToast(message, type = 'success') {
    if (!toastElement) return;
    toastElement.innerText = message;
    toastElement.className = `toast show ${type}`;
    
    setTimeout(() => {
        toastElement.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
