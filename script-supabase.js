/*
 * SCRIPT PÚBLICO DE AUTOELITE (script-supabase.js)
 * VERSIÓN COMPLETA Y FUSIONADA - CORREGIDA
 *
 * Combina la lógica del sitio web con la integración de Supabase.
 * Maneja el sitio público, filtros, modales y login/registro de CLIENTES.
 */

// ----------------------------------------------------------------
// CONFIGURACIÓN DE SUPABASE
// ----------------------------------------------------------------

const SUPABASE_URL = 'https://hnpznjcpyyzxhfkldkcj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucHpuamNweXl6eGhma2xka2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwODcyODMsImV4cCI6MjA3ODY2MzI4M30.7_yHRRIs_dEXduYBEoZurjIXs2grBFjwWmjKVfRbZLI';

// Inicializamos el cliente de Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variables globales
let currentLang = localStorage.getItem('lang') || 'es';
let langData = {};
let allVehicles = []; // Esta variable se llenará desde Supabase

// Evento principal de carga
document.addEventListener('DOMContentLoaded', () => {
    initialize();
});

// --- 0. INICIALIZADOR PRINCIPAL ---
async function initialize() {
    try {
        // Carga los datos primero
        await loadLangData(); // Carga textos.json
        await loadVehicles(); // Carga vehículos DESDE SUPABASE
        
        // Configura los elementos comunes
        setupThemeToggle();
        setupActiveNav();
        setupSearch(); 
        setupModalClosers();
        setupLegalModals();

        // Configura los elementos específicos de cada página
        if (document.getElementById('featured-carousel')) setupCarousel();
        if (document.getElementById('vehicle-list-container')) setupFilters();
        
        if (document.body.classList.contains('page-vehiculo-detalle')) {
            await loadVehicleDetail(); 
            setupDetailModals(); 
        }
        
        if (document.getElementById('alquiler-grid')) displayAlquiler();
        if (document.querySelector('.vender-coche-form')) setupVenderForm();
        if (document.body.classList.contains('page-valoracion')) loadValoracion(); 

        // Configura los modales que pueden estar en varias páginas
        setupPurchaseModal();
        setupSupportForms();
        setupLoginTabs(); // <-- Maneja login/registro de CLIENTES

        // Actualiza el estado del login del cliente
        updateClientLoginStatus();

    } catch (error) {
        console.error("Error en la inicialización:", error);
    }
}

// --- LÓGICA GLOBAL DE CIERRE DE MODALES ---
function setupModalClosers() {
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal-overlay').style.display = 'none';
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    document.getElementById('success-modal-close')?.addEventListener('click', () => {
        document.getElementById('success-modal').style.display = 'none';
        // Redirige al inicio solo si es el modal de compra/alquiler o soporte
        // y NO estamos en la página de valoración
        if (!window.location.href.includes('valoracion.html')) {
             window.location.href = 'index.html';
        }
    });
}

// --- LÓGICA PARA MODALES LEGALES (FOOTER) ---
function setupLegalModals() {
    const legalModal = document.getElementById('legal-modal');
    if (!legalModal) return; 

    const titleEl = document.getElementById('legal-modal-title');
    const contentEl = document.getElementById('legal-modal-content');

    document.querySelectorAll('.legal-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); 
            const title = link.innerText;
            
            if (titleEl) titleEl.innerText = title;
            if (contentEl) {
                contentEl.innerHTML = `
                    <h3>${title}</h3>
                    <p>Este es el contenido de ejemplo para la sección "${title}".</p>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                `;
            }
            legalModal.style.display = 'flex';
        });
    });
}

// --- 1. LÓGICA DE MODO NOCHE ---
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return; 

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    }

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });
}

// --- 2. LÓGICA DE IDIOMAS (desde textos.json) ---
async function loadLangData() {
    try {
        const response = await fetch('textos.json');
        if (!response.ok) throw new Error('textos.json no encontrado');
        langData = await response.json();
        updateTextContent(currentLang); 
    } catch (error) {
        console.error('Error cargando datos de idioma:', error);
        langData = {}; 
    }
    
    document.getElementById('lang-es')?.addEventListener('click', () => setLang('es'));
    document.getElementById('lang-en')?.addEventListener('click', () => setLang('en'));
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang); 
    updateTextContent(lang);
}

function updateTextContent(lang) {
    if (!langData || !langData[lang]) {
        return;
    }
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.getAttribute('data-key');
        const translation = langData[lang][key];
        if (translation) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                if (element.closest('#save-button') || element.closest('#share-button')) {
                     if (!element.classList.contains('icon')) {
                        const span = element.tagName === 'SPAN' ? element : element.querySelector('span:not(.icon)');
                        if(span) span.innerText = translation;
                        else element.innerText = translation;
                     }
                } else {
                    element.innerText = translation;
                }
            }
        }
    });
    document.getElementById('lang-es')?.classList.toggle('active', lang === 'es');
    document.getElementById('lang-en')?.classList.toggle('active', lang === 'en');
}

// --- 3. NAVEGACIÓN ACTIVA ---
function setupActiveNav() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (document.body.classList.contains('page-vehiculo-detalle')) { 
        document.querySelector('.main-nav a[href="vehiculos.html"]')?.classList.add('active');
    } else if (currentPage === 'alquiler.html') {
        document.querySelector('.main-nav a[href="servicios.html"]')?.classList.add('active');
    } else if (document.body.classList.contains('page-valoracion')) {
         document.querySelector('.main-nav a[href="vender.html"]')?.classList.add('active');
    } else {
        document.querySelectorAll('.main-nav a').forEach(link => {
            let linkHref = link.getAttribute('href');
            if (linkHref === currentPage || (linkHref === 'index.html' && currentPage === '')) {
                link.classList.add('active');
            }
        });
    }
}

// --- 4. CARGA DE VEHÍCULOS (¡¡MODIFICADO CON SUPABASE!!) ---
async function loadVehicles() {
    try {
        // Llama a la API de Supabase para leer la tabla 'vehiculos'
        let { data, error } = await supabase
            .from('vehiculos')
            .select('*')
            .order('destacado', { ascending: false }) // Opcional: trae destacados primero
            .order('id', { ascending: true }); 
            
        if (error) {
            throw new Error(`Error al cargar vehículos: ${error.message}`);
        }
        allVehicles = data || [];
        console.log("Vehículos cargados desde Supabase:", allVehicles.length);
        
    } catch (error) {
        console.error('Error fatal al cargar vehículos de BD, intentando JSON local...', error);
        // Fallback al JSON si falla la BD
        try {
            const response = await fetch('vehiculos.json');
            allVehicles = await response.json();
        } catch (e) {
             allVehicles = []; 
        }
    }
}
    
// --- LÓGICA DE LA BARRA DE BÚSQUEDA ---
function setupSearch() {
    document.querySelectorAll('.search-bar').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchTerm = form.querySelector('input').value;
            if (searchTerm.trim() !== '') {
                window.location.href = `vehiculos.html?search=${encodeURIComponent(searchTerm)}`;
            }
        });
    });
}

// --- 5. LÓGICAS DE MOSTRAR VEHÍCULOS ---

// 5a. Carrusel (Página de Inicio)
function setupCarousel() {
    const container = document.getElementById('featured-carousel');
    if (!container) return;
    
    const vehiculosDestacados = allVehicles.filter(v => v.destacado && v.tipo === 'venta');
    if (vehiculosDestacados.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%;">No hay destacados disponibles.</p>';
        return;
    }

    container.innerHTML = '';
    vehiculosDestacados.forEach(v => {
        container.innerHTML += createVehicleCardHTML(v, 'carousel');
    });
    
    // Lógica simple de scroll para el carrusel
    const track = container;
    let currentIndex = 0;

    function updateCarousel() {
        const cardElement = track.querySelector('.vehicle-card');
        if (!cardElement) return; 
        
        // Ajustar según tamaño de pantalla si se desea lógica de slide
        // Por simplicidad en esta versión unificada, dejamos el flex-wrap/scroll nativo o CSS
    }
    
    window.addEventListener('resize', updateCarousel);
}

// 5b. Página de Alquiler
function displayAlquiler() {
    const container = document.getElementById('alquiler-grid');
    if (!container) return;
    const vehiculosAlquiler = allVehicles.filter(v => v.tipo === 'alquiler');
    container.innerHTML = '';
    vehiculosAlquiler.forEach(v => {
        container.innerHTML += createVehicleCardHTML(v, 'grid');
    });
    updateTextContent(currentLang);
}

// 5c. Filtros y Lista de Venta (Página de Vehículos)
function setupFilters() {
    const filterForm = document.getElementById('filter-form');
    if (!filterForm) return;

    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search')?.toLowerCase() || '';
    
    // Llenar input de búsqueda si viene por URL
    const searchInput = document.querySelector('.search-bar input');
    if(searchInput && searchTerm) searchInput.value = searchTerm;

    const potenciaInput = document.getElementById('filter-potencia');
    const potenciaOutput = document.getElementById('potencia-output');

    const applyFilters = () => {
        const filters = {
            marca: document.getElementById('filter-marca').value,
            color: document.getElementById('filter-color').value,
            precio: parseInt(document.getElementById('filter-precio').value),
            km: parseInt(document.getElementById('filter-km').value),
            potencia: parseInt(potenciaInput.value), 
            ano: parseInt(document.getElementById('filter-ano').value)
        };
        
        const vehiculosVenta = allVehicles.filter(v => v.tipo === 'venta');
        const filteredVehicles = vehiculosVenta.filter(v => {
            const vNombre = v.nombre ? v.nombre.toLowerCase() : '';
            const vMarca = v.marca ? v.marca.toLowerCase() : '';
            const matchesSearch = searchTerm === '' || 
                                  vNombre.includes(searchTerm) ||
                                  vMarca.includes(searchTerm);
            
            const matchesFilters = (filters.marca === 'todas' || v.marca === filters.marca) &&
                                   (filters.color === 'todos' || v.color === filters.color) &&
                                   (v.precio <= filters.precio) &&
                                   (v.kilometraje <= filters.km) &&
                                   (v.potencia_cv <= filters.potencia) && 
                                   (v.ano >= filters.ano);

            return matchesSearch && matchesFilters;
        });
        displayVehicleList(filteredVehicles);
    };
    
    filterForm.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', applyFilters);
    });

    document.getElementById('filter-precio')?.addEventListener('input', e => {
        document.getElementById('precio-output').innerText = `€${parseInt(e.target.value).toLocaleString('es-ES')}`;
    });
    document.getElementById('filter-km')?.addEventListener('input', e => {
        document.getElementById('km-output').innerText = `${parseInt(e.target.value).toLocaleString('es-ES')} km`;
    });
    potenciaInput?.addEventListener('input', e => {
        potenciaOutput.innerText = `${parseInt(e.target.value).toLocaleString('es-ES')} CV`;
    });

    applyFilters();
}

// 5d. Dibuja la lista de vehículos (vehiculos.html)
function displayVehicleList(vehicles) {
    const container = document.getElementById('vehicle-list-container');
    if (!container) return;
    container.innerHTML = '';
    if (vehicles.length === 0) {
        container.innerHTML = `<p data-key="filter_no_results">No se encontraron vehículos con esos criterios.</p>`;
        updateTextContent(currentLang);
        return;
    }
    vehicles.forEach(v => {
        const specs = v.datos_tecnicos || {}; 
        const subtitle = specs.linea_equipos || `${v.marca} ${v.ano}`;
        
        // Gestionar array de galería
        let thumbnailsHTML = '';
        const gallery = v.imagenes_galeria || [];
        for (let i = 0; i < 3; i++) {
            if (gallery[i]) {
                thumbnailsHTML += `<img src="${gallery[i]}" alt="Miniatura ${i+1}">`;
            }
        }

        container.innerHTML += `
            <div class="vehicle-list-item">
                <div class="list-item-image-gallery">
                    <div class="list-item-image">
                        <img src="${v.imagenUrl}" alt="${v.nombre}">
                    </div>
                    <div class="list-item-thumbnails">
                        ${thumbnailsHTML}
                    </div>
                </div>
                <div class="list-item-content">
                    <h3>${v.nombre}</h3>
                    <p class="list-item-subtitle">${subtitle}</p>
                    <div class="list-item-specs">
                        <span>${(v.kilometraje || 0).toLocaleString('es-ES')} km</span>
                        <span>${specs.caja_de_cambios || 'Automático'}</span>
                        <span>${v.potencia_cv || ''} CV</span>
                        <span>${specs.combustible || 'Gasolina'}</span>
                    </div>
                    <div class="list-item-price">€${(v.precio || 0).toLocaleString('es-ES')}</div>
                    <a href="vehiculo-detalle.html?id=${v.id}" class="btn btn-primario" data-key="vehiculos_btn_ver_detalles">Ver Detalles</a>
                </div>
            </div>
        `;
    });
    updateTextContent(currentLang);
}
    
// 5e. Carga la página de detalle (¡¡MODIFICADO CON SUPABASE!!)
async function loadVehicleDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleId = parseInt(urlParams.get('id'));
    if (!vehicleId) {
        document.getElementById('vehicle-title-placeholder').innerText = "Vehículo no encontrado";
        return;
    }

    if (allVehicles.length === 0) {
        await loadVehicles(); 
    }

    const vehicle = allVehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
        document.getElementById('vehicle-title-placeholder').innerText = "Vehículo no encontrado o ID incorrecto.";
        return;
    }

    // --- Rellenar la página ---
    document.title = `${vehicle.nombre} - AutoElite`;
    document.getElementById('vehicle-title-placeholder').innerText = vehicle.nombre;
    const specs = vehicle.datos_tecnicos || {};
    document.getElementById('vehicle-subtitle-placeholder').innerText = specs.linea_equipos || `${vehicle.marca} ${vehicle.ano}`;

    const priceSuffix = vehicle.tipo === 'alquiler' ? '<span data-key="alquiler_por_dia">/día</span>' : '';
    document.getElementById('vehicle-price-placeholder').innerHTML = `€${vehicle.precio.toLocaleString('es-ES')} ${priceSuffix}`;

    const priceBadge = document.getElementById('vehicle-price-badge');
    const priceBadgeText = document.getElementById('vehicle-price-badge-text');
    const monthlyPaymentEl = document.getElementById('vehicle-monthly-payment');
    const financingBox = document.querySelector('.financing-calculator');

    if (vehicle.tipo === 'venta') {
        if (vehicle.calificacion_precio && langData[currentLang]) {
            priceBadge.className = 'price-badge ' + vehicle.calificacion_precio;
            const calif_key = 'calif_' + vehicle.calificacion_precio;
            const translation = langData[currentLang][calif_key];
            if (translation) {
                priceBadgeText.innerText = translation;
                priceBadgeText.setAttribute('data-key', calif_key);
            }
            priceBadge.style.display = 'inline-flex';
        } else {
            priceBadge.style.display = 'none';
        }

        if (vehicle.pago_mensual > 0) {
            const monthlyPaymentText = `<span data-key="finan_desde">desde</span> <strong>€${vehicle.pago_mensual.toLocaleString('es-ES')} / mes</strong>`;
            monthlyPaymentEl.innerHTML = monthlyPaymentText;
            monthlyPaymentEl.style.display = 'block';
            
            document.getElementById('financing-monthly-price').innerText = `€${vehicle.pago_mensual.toLocaleString('es-ES')}`;
            if(financingBox) financingBox.style.display = 'block';
        } else {
            monthlyPaymentEl.style.display = 'none';
            if(financingBox) financingBox.style.display = 'none';
        }
        
        const finanPrecio = document.getElementById('finan-precio-total');
        if(finanPrecio) finanPrecio.innerText = `€${vehicle.precio.toLocaleString('es-ES')}`;

    } else {
        // Modo Alquiler
        if(priceBadge) priceBadge.style.display = 'none';
        if(monthlyPaymentEl) monthlyPaymentEl.style.display = 'none';
        if(financingBox) financingBox.style.display = 'none';
        
        const contactButton = document.querySelector('.price-box .btn-primario');
        if(contactButton) {
            contactButton.setAttribute('data-key', 'servicios_btn_reservar');
            contactButton.innerText = 'Reservar Ahora';
            contactButton.classList.add('btn-buy');
            contactButton.setAttribute('data-id', vehicle.id); 
            contactButton.setAttribute('data-name', vehicle.nombre);
        }
    }
    
    // --- Lógica del Carrusel de Imágenes ---
    const mainImage = document.getElementById('gallery-main-placeholder');
    const thumbnailsContainer = document.getElementById('gallery-thumbnails-container');
    const prevButton = document.getElementById('prev-image');
    const nextButton = document.getElementById('next-image');
    const zoomButton = document.getElementById('zoom-image');
    const zoomModal = document.getElementById('zoom-modal');
    const zoomImage = document.getElementById('zoom-modal-image');
    
    const galleryImages = [vehicle.imagenUrl, ...(vehicle.imagenes_galeria || [])];
    const uniqueGalleryImages = [...new Set(galleryImages.filter(Boolean))]; 
    
    let currentImageIndex = 0;

    function updateGallery(index) {
        currentImageIndex = index;
        mainImage.src = uniqueGalleryImages[currentImageIndex];
        if(thumbnailsContainer) {
            thumbnailsContainer.querySelectorAll('img').forEach((img, i) => {
                img.classList.toggle('active', i === currentImageIndex);
            });
        }
    }

    if(thumbnailsContainer) {
        thumbnailsContainer.innerHTML = '';
        uniqueGalleryImages.forEach((imgUrl, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgUrl;
            thumb.alt = `Foto ${index + 1}`;
            if (index === 0) thumb.classList.add('active');
            thumb.addEventListener('click', () => updateGallery(index));
            thumbnailsContainer.appendChild(thumb);
        });
    }

    if(prevButton) prevButton.onclick = () => updateGallery((currentImageIndex - 1 + uniqueGalleryImages.length) % uniqueGalleryImages.length);
    if(nextButton) nextButton.onclick = () => updateGallery((currentImageIndex + 1) % uniqueGalleryImages.length);
    
    if (uniqueGalleryImages.length <= 1) {
        if(prevButton) prevButton.style.display = 'none';
        if(nextButton) nextButton.style.display = 'none';
    }

    if(zoomButton) {
        zoomButton.onclick = () => {
            zoomImage.src = uniqueGalleryImages[currentImageIndex];
            zoomModal.style.display = 'flex';
        };
    }
    
    if (uniqueGalleryImages.length > 0) {
        updateGallery(0); 
    } else {
        mainImage.src = 'assets/coche-default.png';
    }

    // --- Rellenar Datos Técnicos ---
    const specsContainer = document.getElementById('specs-grid-container');
    if (specsContainer) {
        specsContainer.innerHTML = '';
        const specMap = {
            "categoria": "Categoría", "kilometraje": "Kilometraje", "potencia": "Potencia", 
            "combustible": "Combustible", "caja_de_cambios": "Caja de cambios", 
            "primera_inscripcion": "Primera inscripción", "desplazamiento": "Desplazamiento",
            "linea_equipos": "Línea de equipos", "origen": "Origen"
        };
        for (const key in specMap) {
            if (specs && specs[key]) {
                specsContainer.innerHTML += `
                    <div class="spec-item">
                        <span data-key="spec_${key}">${specMap[key]}</span>
                        <span>${specs[key]}</span>
                    </div>
                `;
            }
        }
    }

    // --- Rellenar Vendedor (Simulado) ---
    const sellerContainer = document.getElementById('vehicle-seller-box');
    const seller = { nombre: "AutoElite", rating: 4.8, reviews: 215, direccion: "Av. Villa Rosa, 1, 29004 Málaga" };
    if (sellerContainer && seller.nombre) { 
        sellerContainer.innerHTML = `
            <h4>${seller.nombre}</h4>
            <div class="seller-rating">
                <span class="stars">${'★'.repeat(Math.floor(seller.rating))}${'☆'.repeat(5 - Math.floor(seller.rating))}</span>
                <span>(${seller.reviews} <span data-key="vendedor_opiniones">opiniones</span>)</span>
            </div>
            <p>${seller.direccion || ''}</p>
        `;
    }
    
    updateTextContent(currentLang);
}
    
// 5f. LÓGICA DE MODALES DE DETALLE (¡¡MODIFICADO CON SUPABASE!!)
function setupDetailModals() {
    const priceInfoModal = document.getElementById('price-info-modal');
    const financingModal = document.getElementById('financing-modal');

    document.getElementById('open-price-info')?.addEventListener('click', () => {
        if (priceInfoModal) priceInfoModal.style.display = 'flex';
    });
    
    document.getElementById('open-financing-modal')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (financingModal) financingModal.style.display = 'flex';
    });

    // Lógica del botón de Guardar (Favoritos)
    const saveButton = document.getElementById('save-button');
    saveButton?.addEventListener('click', async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Por favor, inicia sesión como cliente para guardar vehículos.");
            window.location.href = 'login.html';
            return;
        }

        const vehicleId = parseInt(new URLSearchParams(window.location.search).get('id'));
        if (!vehicleId) return;
        
        const isSaved = saveButton.classList.contains('saved');

        try {
            if (isSaved) {
                // Borrar de favoritos
                const { error } = await supabase
                    .from('favoritos_clientes')
                    .delete()
                    .match({ cliente_id: user.id, vehiculo_id: vehicleId });
                if (error) throw error;
                
                saveButton.classList.remove('saved');
                const icon = saveButton.querySelector('.icon');
                const text = saveButton.querySelector('span:last-child');
                icon.innerText = '☆';
                text.setAttribute('data-key', 'vehiculos_btn_guardar');
                updateTextContent(currentLang);

            } else {
                // Añadir a favoritos
                const { error } = await supabase
                    .from('favoritos_clientes')
                    .insert({ cliente_id: user.id, vehiculo_id: vehicleId });
                if (error) throw error;

                saveButton.classList.add('saved');
                const icon = saveButton.querySelector('.icon');
                const text = saveButton.querySelector('span:last-child');
                icon.innerText = '★';
                text.innerText = 'Guardado';
                text.removeAttribute('data-key');
            }
        } catch (error) {
            console.error("Error al guardar en favoritos:", error.message);
            alert(`Error al guardar: ${error.message}`);
        }
    });

    // Lógica del botón de Compartir
    const shareButton = document.getElementById('share-button');
    shareButton?.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            const text = shareButton.querySelector('span:last-child');
            const originalTextKey = text.getAttribute('data-key');
            const originalText = text.innerText;
            
            text.innerText = '¡Copiado!';
            text.setAttribute('data-key', 'vehiculos_copiado');
            setTimeout(() => {
                text.innerText = originalText;
                text.setAttribute('data-key', originalTextKey);
                updateTextContent(currentLang);
            }, 2000);
        });
    });

    // Lógica de la calculadora de financiación
    document.getElementById('finan-modal-calculate')?.addEventListener('click', () => {
        const precioText = document.getElementById('finan-precio-total').innerText;
        const precioTotal = parseFloat(precioText.replace(/[^0-9,-]+/g,"").replace('.','').replace(',','.'));
        const entrada = parseFloat(document.getElementById('finan-entrada').value) || 0;
        const pagoMes = parseFloat(document.getElementById('finan-mensual').value);
        const resultadoDiv = document.getElementById('finan-resultado');

        if (!pagoMes || pagoMes <= 0) {
            resultadoDiv.innerHTML = `<p data-key="finan_modal_error_mes">Introduce un pago mensual válido.</p>`;
            updateTextContent(currentLang);
            return;
        }

        const totalAFinanciar = precioTotal - entrada;
        if (totalAFinanciar <= 0) {
            resultadoDiv.innerHTML = `<p>No necesitas financiación.</p>`;
            return;
        }
        
        const interesAnual = 0.05; // 5% de interés
        const interesMensual = interesAnual / 12;

        if (pagoMes <= totalAFinanciar * interesMensual) {
            resultadoDiv.innerHTML = `<p data-key="finan_modal_error_interes">El pago mensual es demasiado bajo...</p>`;
            updateTextContent(currentLang);
            return;
        }

        const numMeses = -Math.log(1 - (totalAFinanciar * interesMensual) / pagoMes) / Math.log(1 + interesMensual);
        const totalMeses = Math.ceil(numMeses);
        const numAnios = Math.floor(totalMeses / 12);
        const mesesRestantes = totalMeses % 12;

        resultadoDiv.innerHTML = `
            <p data-key="finan_modal_resultado">Tiempo de financiación estimado:</p>
            <h4>${numAnios} <span data-key="finan_modal_anios">años</span> y ${mesesRestantes} <span data-key="finan_modal_meses">meses</span></h4>
        `;
        updateTextContent(currentLang);
    });
}

// --- 6. SIMULACIÓN DE COMPRA (MODAL) (¡¡MODIFICADO CON SUPABASE!!) ---
function setupPurchaseModal() {
    const purchaseModal = document.getElementById('purchase-modal');
    const successModal = document.getElementById('success-modal');
    if (!purchaseModal || !successModal) return; 

    let currentVehicleId = null;
    let currentVehicleType = null;
    
    document.body.addEventListener('click', function(e) {
        const target = e.target.closest('.btn-buy');
        if (target) {
            e.preventDefault(); 
            const vehicleId = target.getAttribute('data-id');
            const vehicle = allVehicles.find(v => v.id == vehicleId);
            if (!vehicle) {
                console.error("No se encontró el vehículo para el modal de compra");
                return;
            }

            currentVehicleId = vehicle.id;
            currentVehicleType = vehicle.tipo; // 'venta' o 'alquiler'
            
            const modalNameEl = purchaseModal.querySelector('#modal-vehicle-name');
            if (modalNameEl) modalNameEl.innerText = vehicle.nombre;
            purchaseModal.style.display = 'flex';
        }
    });

    purchaseModal.querySelector('#purchase-modal-confirm')?.addEventListener('click', async () => {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Determinar si es reserva de alquiler o lead de venta
        // (En este diseño simplificado usamos leads_venta para ambos, o podríamos separar)
        let tableName = 'leads_venta'; 
        let record = {
            vehiculo_id: currentVehicleId,
            cliente_id: user ? user.id : null,
            estado: 'nuevo'
        };

        try {
            const { error } = await supabase.from(tableName).insert(record);
            if (error) throw error;

            purchaseModal.style.display = 'none';
            successModal.style.display = 'flex';
        } catch (error) {
            console.error("Error al guardar el lead:", error.message);
            alert(`Error al confirmar interés: ${error.message}`);
        }
    });
}


// --- 7. FORMULARIOS DE SOPORTE (¡¡MODIFICADO CON SUPABASE!!) ---
function setupSupportForms() {
    const contactForm = document.getElementById('contact-form');
    contactForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(contactForm);
        const data = {
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            mensaje: formData.get('necesidad')
        };

        try {
            const { error } = await supabase.from('mensajes_soporte').insert(data);
            if (error) throw error;
            
            contactForm.reset();
            const successModal = document.getElementById('success-modal');
            if (successModal) successModal.style.display = 'flex';

        } catch (error) {
            console.error("Error al enviar mensaje de soporte:", error.message);
            alert(`Error al enviar el mensaje: ${error.message}`);
        }
    });

    // Lógica del Chat Simulado
    const chatForm = document.getElementById('chat-form');
    chatForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const chatInput = document.getElementById('chat-input-text');
        const chatBox = document.querySelector('.chat-box');
        const userMessage = chatInput.value;
        if (userMessage.trim() === '') return;

        chatBox.innerHTML += `<div class="chat-message user">${userMessage}</div>`;
        chatInput.value = '';
        chatBox.scrollTop = chatBox.scrollHeight;

        setTimeout(() => {
            let botResponse = 'Gracias por tu pregunta. (Simulación)';
            if (userMessage.toLowerCase().includes('horario')) {
                botResponse = 'Nuestro horario es de L-V de 9:00 a 20:00.';
            }
            chatBox.innerHTML += `<div class="chat-message bot">${botResponse}</div>`;
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 1000);
    });
}

// --- 8. LÓGICA DE LOGIN/REGISTRO (CLIENTES) (¡¡MODIFICADO CON SUPABASE!!) ---
function setupLoginTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    if (!tabLinks.length) return;

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            link.classList.add('active');
            
            const activeTab = document.getElementById(tabId);
            if (activeTab) activeTab.classList.add('active');
        });
    });

    // Formulario de Login de CLIENTE
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            if (error) throw error;
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Error en login de cliente:", error.message);
            alert(`Error al iniciar sesión: ${error.message}`);
        }
    });

    // Formulario de Registro de CLIENTE
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            // 1. Crear el usuario en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        nombre_completo: nombre 
                    }
                }
            });
            if (authError) throw authError;
            if (!authData.user) throw new Error("No se pudo crear el usuario.");

            // 2. Insertar en la tabla 'clientes'
            const { error: profileError } = await supabase
                .from('clientes')
                .insert({ id: authData.user.id, nombre_completo: nombre, email: email });

            if (profileError) {
                console.warn("Usuario creado en Auth, pero error al crear perfil:", profileError.message);
            }
            
            alert('¡Registro completado! Ya puedes iniciar sesión.');
            // Cambiar a la pestaña de login automáticamente
            document.querySelector('.tab-link[data-tab="login-form-box"]').click();

        } catch (error) {
            console.error("Error en registro de cliente:", error.message);
            alert(`Error en el registro: ${error.message}`);
        }
    });
}

// --- 9. ACTUALIZAR ESTADO DEL LOGIN (CLIENTE) ---
async function updateClientLoginStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    const loginLink = document.querySelector('a.login-link');
    if (!loginLink) return;
    
    if (user) {
        // ¿Es un empleado? Comprobamos tabla empleados
        const { data: empleado } = await supabase.from('empleados').select('id').eq('id', user.id).single();
        if (empleado) return; // Si es empleado, no tocamos el link de clientes

        // Es un CLIENTE logueado
        loginLink.innerText = "Mi Cuenta";
        loginLink.href = "#"; 
        
        // Añadir un botón de logout si no existe
        if (!document.getElementById('logout-button-client')) {
            const logoutButton = document.createElement('a');
            logoutButton.id = 'logout-button-client';
            logoutButton.innerText = "(Salir)";
            logoutButton.href = "#";
            logoutButton.style.cursor = "pointer";
            logoutButton.style.marginLeft = "10px";
            logoutButton.style.fontSize = "0.8rem";
            logoutButton.onclick = async (e) => {
                e.preventDefault();
                await supabase.auth.signOut();
                window.location.reload();
            };
            loginLink.parentNode.insertBefore(logoutButton, loginLink.nextSibling);
        }
        
    } else {
        // Usuario no logueado
        loginLink.innerText = "Acceso Clientes";
        loginLink.href = "login.html";
    }
}


// --- 10. Formulario Vender Coche (Valoración) ---
function setupVenderForm() {
    const venderForm = document.querySelector('.vender-coche-form');
    venderForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        
        const data = {
            marca: document.getElementById('vender-marca').value,
            modelo: document.getElementById('vender-modelo').value,
            inscripcion: document.getElementById('vender-inscripcion').value,
            kilometraje: document.getElementById('vender-kilometraje').value,
            estado: document.getElementById('vender-estado').value,
            combustible: document.getElementById('vender-combustible').value,
            equipamiento: {
                techo: document.getElementById('eq-techo').checked,
                navegador: document.getElementById('eq-navegador').checked,
                asientos: document.getElementById('eq-asientos').checked,
                camara: document.getElementById('eq-camara').checked
            },
            cliente_id: user ? user.id : null
        };

        try {
            const { data: insertedData, error } = await supabase
                .from('solicitudes_valoracion')
                .insert(data)
                .select('id')
                .single(); 

            if (error) throw error;
            
            window.location.href = `valoracion.html?id=${insertedData.id}`;
            
        } catch (error) {
            console.error("Error al enviar valoración:", error.message);
            alert(`Error al enviar la valoración: ${error.message}`);
        }
    });
    
    venderForm?.querySelectorAll('select').forEach(s => {
        s.addEventListener('change', () => s.classList.remove('placeholder'));
    });
}

// --- 11. Cargar datos en la página de Valoración ---
async function loadValoracion() {
    const urlParams = new URLSearchParams(window.location.search);
    const valoracionId = parseInt(urlParams.get('id'));

    if (!valoracionId) {
        document.getElementById('valoracion-container').innerHTML = '<h1>Error</h1><p>No se encontraron datos para la valoración. Por favor, <a href="vender.html">vuelva a intentarlo</a>.</p>';
        return;
    }

    try {
        // 1. Buscar la solicitud en Supabase
        const { data, error } = await supabase
            .from('solicitudes_valoracion')
            .select('*')
            .eq('id', valoracionId)
            .single();

        if (error) throw error;
        if (!data) throw new Error("Valoración no encontrada.");

        // 2. Algoritmo de precio simulado
        let precioBase = 40000;
        if (data.marca === 'Porsche') precioBase += 30000;
        if (data.marca === 'BMW') precioBase += 15000;
        if (data.marca === 'Mercedes-Benz') precioBase += 18000;
        if (data.marca === 'Audi') precioBase += 12000;
        
        if (data.estado === 'excelente') precioBase *= 1.15;
        if (data.estado === 'bueno') precioBase *= 1.0;
        if (data.estado === 'usado') precioBase *= 0.85;
        
        // Ajuste por KM
        const kmVal = parseInt(data.kilometraje);
        if (kmVal <= 10000) precioBase *= 1.1;
        else if (kmVal >= 100000) precioBase *= 0.9;
        else if (kmVal >= 150000) precioBase *= 0.75;
        
        const equip = data.equipamiento || {};
        if (equip.techo) precioBase += 1500;
        if (equip.asientos) precioBase += 1000;
        if (equip.navegador) precioBase += 500;
        if (equip.camara) precioBase += 800;
        
        const precioFinal = Math.floor(precioBase);

        // 3. Actualizar la fila en Supabase con el precio estimado
        // (Solo si aún no tiene precio)
        if(!data.precio_estimado) {
            await supabase
                .from('solicitudes_valoracion')
                .update({ precio_estimado: precioFinal })
                .eq('id', valoracionId);
        } else {
            // Si ya tenía precio, usamos el guardado
            // (o podríamos recalcularlo, pero dejémoslo así)
        }

        // 4. Mostrar los datos en la página
        document.getElementById('valoracion-precio').innerText = `€${(data.precio_estimado || precioFinal).toLocaleString('es-ES')}`;
        document.getElementById('valoracion-resumen').innerHTML = `
            <li><span>Marca</span> <span>${data.marca}</span></li>
            <li><span>Modelo</span> <span>${data.modelo}</span></li>
            <li><span>Año</span> <span>${data.inscripcion}</span></li>
            <li><span>Kilometraje</span> <span>${data.kilometraje} km</span></li>
            <li><span>Estado</span> <span>${data.estado}</span></li>
            <li><span>Equipamiento</span> <span>${[
                (equip.techo ? 'Techo Solar' : ''),
                (equip.navegador ? 'Navegador' : ''),
                (equip.asientos ? 'Asientos Calef.' : ''),
                (equip.camara ? 'Cámara 360' : '')
            ].filter(Boolean).join(', ') || 'Base'}</span></li>
        `;
        
    } catch (error) {
        console.error("Error al cargar valoración:", error.message);
        document.getElementById('valoracion-container').innerHTML = `<h1>Error al cargar</h1><p>${error.message}</p>`;
    }
}

// --- FUNCIÓN DE AYUDA Creador de Tarjetas de Coche ---
function createVehicleCardHTML(v, type) {
    let priceSuffix = '';
    let buttonKey = 'vehiculos_btn_buy';
    let buttonText = 'Comprar';
    let btnLink = `vehiculo-detalle.html?id=${v.id}`;
    let btnClass = '';

    if (v.tipo === 'alquiler') {
        priceSuffix = `<span data-key="alquiler_por_dia">/día</span>`;
        buttonKey = 'servicios_btn_reservar';
        buttonText = 'Reservar';
        btnLink = '#';
        btnClass = 'btn-buy'; // Clase para abrir modal directamente
    } else {
        buttonText = 'Ver Detalles';
        buttonKey = 'vehiculos_btn_ver_detalles';
    }
    
    const buttonHTML = v.tipo === 'venta' ?
        `<a href="${btnLink}" class="btn btn-primario full-width" data-key="${buttonKey}">${buttonText}</a>` :
        `<button class="btn btn-primario full-width ${btnClass}" 
                 data-id="${v.id}" 
                 data-name="${v.nombre}"
                 data-key="${buttonKey}">
            ${buttonText}
        </button>`;

    return `
        <div class="vehicle-card">
            <div class="card-image-large">
                <img src="${v.imagenUrl}" alt="${v.nombre}">
            </div>
            <div class="card-content">
                <h3>${v.nombre}</h3>
                <div class="card-data">
                    <span>${v.ano}</span>
                    <span>${(v.kilometraje || 0).toLocaleString('es-ES')} km</span>
                    <span>${v.color}</span>
                </div>
                <div class="price">€${(v.precio || 0).toLocaleString('es-ES')} ${priceSuffix}</div>
            </div>
            <div class="card-footer">
                ${buttonHTML}
            </div>
        </div>
    `;
}