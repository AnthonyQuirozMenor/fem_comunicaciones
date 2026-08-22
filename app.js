/**
 * APLICACIÓN DE LÍNEA DE TIEMPO - FEM COMUNICACIONES
 * Versión Universo 3D (Lógica de Cliente)
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
    init3DUniverse();
    loadTimelineData();
    setupEventListeners();
});

// ==========================================
// FONDO 3D INTERACTIVO DEL UNIVERSO (THREE.JS)
// ==========================================

function init3DUniverse() {
    const canvas = document.getElementById('universeCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 1000;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Generar textura brillante suave en código canvas
    function createParticleTexture() {
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 32;
        pCanvas.height = 32;
        const ctx = pCanvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(246, 82, 160, 0.8)');
        gradient.addColorStop(0.7, 'rgba(123, 44, 191, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        
        const texture = new THREE.CanvasTexture(pCanvas);
        return texture;
    }

    // Geometría de 2,500 estrellas en espacio 3D
    const starCount = 2500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    const palette = [
        new THREE.Color('#F652A0'), // Hot Pink FEM
        new THREE.Color('#ffffff'), // Blanco Estelar
        new THREE.Color('#7b2cbf'), // Violeta Cósmico
        new THREE.Color('#ff75c3'), // Rosa Neón
        new THREE.Color('#3a0ca3')  // Azul Profundo
    ];

    for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 2400;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 2400;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2400;

        const color = palette[Math.floor(Math.random() * palette.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        sizes[i] = Math.random() * 12 + 4;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 8,
        vertexColors: true,
        map: createParticleTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const starField = new THREE.Points(geometry, material);
    scene.add(starField);

    // Movimiento del ratón para efecto de paralaje 3D
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.3;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.3;
    });

    // Bucle de animación 3D
    function animate() {
        requestAnimationFrame(animate);

        starField.rotation.y += 0.0006;
        starField.rotation.x += 0.0003;

        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        camera.position.x = targetX;
        camera.position.y = -targetY;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }

    animate();

    // Redimensionamiento responsive
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Registrar eventos globales
function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', filterTimeline);
    }
    
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
    }
    
    if (lightboxPrev) lightboxPrev.addEventListener('click', prevLightboxImage);
    if (lightboxNext) lightboxNext.addEventListener('click', nextLightboxImage);
    
    document.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevLightboxImage();
        if (e.key === 'ArrowRight') nextLightboxImage();
    });

    // Scroll de rueda de ratón horizontal en escritorio
    const container = document.querySelector('.timeline-container');
    if (container) {
        container.addEventListener('wheel', (e) => {
            if (window.innerWidth > 768 && e.deltaY !== 0) {
                container.scrollLeft += e.deltaY * 1.5;
                e.preventDefault();
            }
        });
    }
}

// ==========================================
// CARGA DE DATOS DE LA LÍNEA DE TIEMPO
// ==========================================

async function loadTimelineData() {
    try {
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error('Error al conectar con la base de datos');
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            timelineData = data;
        } else {
            generateInitialSaturdays();
        }
        
        renderTimeline();
    } catch (error) {
        console.error(error);
        showToast('Cargando plantilla estelar de respaldo.', 'error');
        generateInitialSaturdays();
        renderTimeline();
    }
}

// Genera sábados de respaldo iniciando el SÁBADO 22 DE AGOSTO DE 2026
function generateInitialSaturdays() {
    timelineData = [];
    let currentDate = '2026-08-22'; // Sábado 22 de agosto de 2026
    
    for (let i = 0; i < 16; i++) {
        timelineData.push({
            id: 'sat_' + (i + 1),
            date: currentDate,
            formattedDate: formatSpanishDate(currentDate),
            activities: [
                { id: `sat_${i+1}_act_1`, name: 'Revisión y Planificación', description: 'Reunión inicial de coordinación.', photos: [] },
                { id: `sat_${i+1}_act_2`, name: 'Talleres Prácticos', description: 'Desarrollo de las dinámicas planificadas.', photos: [] },
                { id: `sat_${i+1}_act_3`, name: 'Control de Enlaces', description: 'Control de avances y acuerdos del día.', photos: [] },
                { id: `sat_${i+1}_act_4`, name: 'Evaluación y Cierre', description: 'Retroalimentación grupal de la jornada.', photos: [] }
            ]
        });
        currentDate = calculateNextSaturdayDate(currentDate);
    }
}

// ==========================================
// RENDERIZADO CON TARJETAS INTERCALADAS (ARRIBA Y ABAJO)
// ==========================================

function renderTimeline() {
    timelineItemsContainer.innerHTML = '';
    
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
        
        // Alternación de posición: Pares Arriba (card-above), Impares Abajo (card-below)
        const isAbove = (satIndex % 2 === 0);
        cardWrapper.className = `timeline-card-wrapper ${isAbove ? 'card-above' : 'card-below'}`;
        cardWrapper.setAttribute('data-date', saturday.date);
        cardWrapper.setAttribute('data-id', saturday.id);
        
        cardWrapper.innerHTML = `
            <!-- Conector Vertical -->
            <div class="timeline-connector"></div>
            
            <!-- Nodo Central en la Línea Guía -->
            <div class="timeline-node"></div>
            
            <!-- Tarjeta del Sábado -->
            <div class="timeline-card" data-sat-id="${saturday.id}">
                <div class="card-header">
                    <div class="card-date">
                        <i class="fa-solid fa-calendar-day"></i>
                        <h2>${saturday.formattedDate || formatSpanishDate(saturday.date)}</h2>
                    </div>
                </div>
                
                <div class="activities-grid">
                    ${saturday.activities.map((activity, actIndex) => renderActivity(activity, saturday.id, actIndex)).join('')}
                </div>
            </div>
        `;
        
        timelineItemsContainer.appendChild(cardWrapper);
    });
}

function renderActivity(activity, saturdayId, actIndex) {
    const photosHtml = [];
    
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
    lightbox.offsetWidth;
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
// BÚSQUEDA Y FILTRADO
// ==========================================

function filterTimeline() {
    const query = searchInput.value.toLowerCase().trim();
    const cardWrappers = document.querySelectorAll('.timeline-card-wrapper');
    
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
            wrapper.style.display = 'flex';
            
            const activityCards = wrapper.querySelectorAll('.activity-card');
            activityCards.forEach(card => {
                const actId = card.getAttribute('data-act-id');
                const act = saturday.activities.find(a => a.id === actId);
                
                if (query !== '' && (act.name.toLowerCase().includes(query) || act.description.toLowerCase().includes(query))) {
                    card.style.borderColor = 'var(--accent-pink)';
                    card.style.boxShadow = '0 0 15px rgba(246, 82, 160, 0.35)';
                } else {
                    card.style.borderColor = '';
                    card.style.boxShadow = '';
                }
            });
        } else {
            wrapper.style.display = 'none';
        }
    });
}

// ==========================================
// UTILIDADES
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
