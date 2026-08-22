/**
 * APLICACIÓN DE LÍNEA DE TIEMPO - FEM COMUNICACIONES
 * Versión Universo 3D Espacial (Lógica de Cliente)
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
// FONDO 3D INTERACTIVO CON MILES DE ESTRELLAS (THREE.JS)
// ==========================================

function init3DUniverse() {
    const canvas = document.getElementById('universeCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3500);
    camera.position.z = 1000;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Textura de punto estelar brillante
    function createStarTexture() {
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 32;
        pCanvas.height = 32;
        const ctx = pCanvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.25, 'rgba(246, 82, 160, 0.9)');
        gradient.addColorStop(0.65, 'rgba(123, 44, 191, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        
        return new THREE.CanvasTexture(pCanvas);
    }

    const starTexture = createStarTexture();

    // ------------------------------------------
    // CAPA 1: Polvo estelar de fondo (6,000 estrellas pequeñas)
    // ------------------------------------------
    const bgStarCount = 6000;
    const bgGeometry = new THREE.BufferGeometry();
    const bgPositions = new Float32Array(bgStarCount * 3);
    const bgColors = new Float32Array(bgStarCount * 3);

    const bgPalette = [
        new THREE.Color('#ffffff'),
        new THREE.Color('#e2e8f0'),
        new THREE.Color('#f472b6'),
        new THREE.Color('#c084fc')
    ];

    for (let i = 0; i < bgStarCount; i++) {
        bgPositions[i * 3] = (Math.random() - 0.5) * 3200;
        bgPositions[i * 3 + 1] = (Math.random() - 0.5) * 3200;
        bgPositions[i * 3 + 2] = (Math.random() - 0.5) * 3200;

        const color = bgPalette[Math.floor(Math.random() * bgPalette.length)];
        bgColors[i * 3] = color.r;
        bgColors[i * 3 + 1] = color.g;
        bgColors[i * 3 + 2] = color.b;
    }

    bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    bgGeometry.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

    const bgMaterial = new THREE.PointsMaterial({
        size: 3,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false
    });

    const bgStarField = new THREE.Points(bgGeometry, bgMaterial);
    scene.add(bgStarField);

    // ------------------------------------------
    // CAPA 2: Estrellas brillantes y destellos (2,000 estrellas)
    // ------------------------------------------
    const fgStarCount = 2000;
    const fgGeometry = new THREE.BufferGeometry();
    const fgPositions = new Float32Array(fgStarCount * 3);
    const fgColors = new Float32Array(fgStarCount * 3);
    const fgSizes = new Float32Array(fgStarCount);

    const fgPalette = [
        new THREE.Color('#F652A0'), // Hot Pink FEM
        new THREE.Color('#ffffff'), // Blanco brillante
        new THREE.Color('#7b2cbf'), // Violeta profundo
        new THREE.Color('#00f5d4'), // Cyan cósmico
        new THREE.Color('#ff75c3')  // Rosa neón
    ];

    for (let i = 0; i < fgStarCount; i++) {
        fgPositions[i * 3] = (Math.random() - 0.5) * 2800;
        fgPositions[i * 3 + 1] = (Math.random() - 0.5) * 2800;
        fgPositions[i * 3 + 2] = (Math.random() - 0.5) * 2800;

        const color = fgPalette[Math.floor(Math.random() * fgPalette.length)];
        fgColors[i * 3] = color.r;
        fgColors[i * 3 + 1] = color.g;
        fgColors[i * 3 + 2] = color.b;

        fgSizes[i] = Math.random() * 10 + 4;
    }

    fgGeometry.setAttribute('position', new THREE.BufferAttribute(fgPositions, 3));
    fgGeometry.setAttribute('color', new THREE.BufferAttribute(fgColors, 3));

    const fgMaterial = new THREE.PointsMaterial({
        size: 8,
        vertexColors: true,
        map: starTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const fgStarField = new THREE.Points(fgGeometry, fgMaterial);
    scene.add(fgStarField);

    // Movimiento con el ratón
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.4;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.4;
    });

    // Bucle de animación del universo
    function animate() {
        requestAnimationFrame(animate);

        bgStarField.rotation.y += 0.0003;
        bgStarField.rotation.x += 0.00015;

        fgStarField.rotation.y += 0.0007;
        fgStarField.rotation.x += 0.00035;

        targetX += (mouseX - targetX) * 0.04;
        targetY += (mouseY - targetY) * 0.04;

        camera.position.x = targetX;
        camera.position.y = -targetY;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }

    animate();

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

    // Scroll de rueda de ratón horizontal
    const container = document.querySelector('.timeline-container');
    if (container) {
        container.addEventListener('wheel', (e) => {
            if (window.innerWidth > 768 && e.deltaY !== 0) {
                container.scrollLeft += e.deltaY * 1.5;
                e.preventDefault();
            }
        });
    }

    window.addEventListener('resize', updateTimelineLine);
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

// Genera los 14 sábados desde el 22 DE AGOSTO hasta el 21 DE NOVIEMBRE DE 2026
function generateInitialSaturdays() {
    timelineData = [];
    let currentDate = '2026-08-22';
    
    for (let i = 0; i < 14; i++) {
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
// RENDERIZADO Y CÁLCULO EXACTO DE LA LÍNEA DE TIEMPO
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
            <div class="timeline-connector"></div>
            <div class="timeline-node"></div>
            
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

    // Calcular la línea central para que termine exactamente en el nodo del 21 de noviembre
    setTimeout(updateTimelineLine, 50);
}

// Ajusta la línea horizontal para que inicie en el primer nodo (22-Ago) y termine en el último (21-Nov)
function updateTimelineLine() {
    const line = document.querySelector('.timeline-line');
    const wrappers = document.querySelectorAll('.timeline-card-wrapper');
    if (!line || wrappers.length === 0) return;
    
    if (window.innerWidth <= 768) {
        line.style.left = '';
        line.style.width = '';
        line.style.right = '';
        return;
    }
    
    const firstWrapper = wrappers[0];
    const lastWrapper = wrappers[wrappers.length - 1];
    
    const firstNodeX = firstWrapper.offsetLeft + (firstWrapper.offsetWidth / 2);
    const lastNodeX = lastWrapper.offsetLeft + (lastWrapper.offsetWidth / 2);
    
    line.style.left = `${firstNodeX}px`;
    line.style.width = `${lastNodeX - firstNodeX}px`;
    line.style.right = 'auto';
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

    setTimeout(updateTimelineLine, 50);
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
