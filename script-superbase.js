/*
 * SCRIPT PÚBLICO DE AUTOELITE (script-supabase.js)
 * Conectado a Supabase
 * Maneja la lógica del sitio público y el login/registro de CLIENTES.
 */

// ----------------------------------------------------------------
// ¡¡IMPORTANTE!!
// 1. REEMPLAZA CON TUS PROPIAS CLAVES DE SUPABASE
// 2. AÑADE ESTO A TODOS TUS HTML PÚBLICOS (index.html, vehiculos.html, etc.)
//    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//    <script defer src="script-supabase.js"></script>
// ----------------------------------------------------------------

const SUPABASE_URL = 'URL_DE_TU_PROYECTO_SUPABASE';
const SUPABASE_KEY = 'TU_CLAVE_PUBLICA_ANON_SUPABASE';

// Si las claves no están puestas, detiene el script para evitar errores
if (SUPABASE_URL === 'URL_DE_TU_PROYECTO_SUPABASE' || SUPABASE_KEY === 'TU_CLAVE_PUBLICA_ANON_SUPABASE') {
    alert('ERROR: Faltan las claves de Supabase en script-supabase.js');
    throw new Error("Faltan las claves de Supabase. Revisa el archivo script-supabase.js");
}

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variables globales
let currentLang = localStorage.getItem('lang') || 'es';
let langData = {};
let allVehicles = [];

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
            loadVehicleDetail();
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

// --- LÓGICA DE CIERRE DE MODALES (Global) ---
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
        // Redirige al inicio solo si es el modal de compra/alquiler
        if (window.location.href.includes('alquiler.html') || window.location.href.includes('vehiculo-detalle.html')) {
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
                    <p>Cargando contenido... (Este es un texto de ejemplo. Deberías cargar tu contenido real aquí).</p>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                `;
            }
            legalModal.style.display = 'flex';
        });
    });
}

// --- 1. LÓGICA DE MODO NOCHE ---
function setupThemeToggle() {
    // ... (Tu código original - no necesita cambios)
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
    // ... (Tu código original - no necesita cambios)
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
    // ... (Tu código original - no necesita cambios)
    currentLang = lang;
    localStorage.setItem('lang', lang); 
    updateTextContent(lang);
}

function updateTextContent(lang) {
    // ... (Tu código original - no necesita cambios)
    if (!langData || !langData[lang]) {
        console.warn(`No se encontraron textos para el idioma: ${lang}`);
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
                        element.innerText = translation;
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
    // ... (Tu código original - no necesita cambios)
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

// --- 4. CARGA DE VEHÍCULOS (¡¡MODIFICADO!!) ---
async function loadVehicles() {
    try {
        // Llama a la API de Supabase para leer la tabla 'vehiculos'
        let { data, error } = await supabase
            .from('vehiculos')
            .select('*'); // Pide todas las columnas
            
        if (error) {
            throw new Error(`Error al cargar vehículos: ${error.message}`);
        }
        allVehicles = data || [];
    } catch (error) {
        console.error('Error fatal al cargar vehículos:', error);
        allVehicles = []; 
    }
}
    
// --- LÓGICA DE LA BARRA DE BÚSQUEDA ---
function setupSearch() {
    // ... (Tu código original - no necesita cambios)
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
// (Estas funciones no cambian, ya que leen de la variable 'allVehicles'
// que ahora es llenada por Supabase)

// 5a. Carrusel (Página de Inicio)
function setupCarousel() {
    // ... (Tu código original - no necesita cambios)
    const container = document.getElementById('featured-carousel');
    if (!container) return;
    const vehiculosDestacados = allVehicles.filter(v => v.destacado && v.tipo === 'venta');
    if (vehiculosDestacados.length === 0) return;
    vehiculosDestacados.forEach(v => {
        container.innerHTML += createVehicleCardHTML(v, 'carousel');
    });
    // ... resto de la lógica del carrusel ...
}

// 5b. Página de Alquiler
function displayAlquiler() {
    // ... (Tu código original - no necesita cambios)
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
    // ... (Tu código original - no necesita cambios)
    const filterForm = document.getElementById('filter-form');
    if (!filterForm) return;
    // ... resto de la lógica de filtros ...
    const applyFilters = () => {
        const filters = {
            marca: document.getElementById('filter-marca').value,
            color: document.getElementById('filter-color').value,
            precio: parseInt(document.getElementById('filter-precio').value),
            km: parseInt(document.getElementById('filter-km').value),
            potencia: parseInt(document.getElementById('filter-potencia').value), 
            ano: parseInt(document.getElementById('filter-ano').value)
        };
        const vehiculosVenta = allVehicles.filter(v => v.tipo === 'venta');
        // ... resto de la lógica de filtrado ...
        const filteredVehicles = vehiculosVenta.filter(v => {
            return (filters.marca === 'todas' || v.marca === filters.marca) &&
                   (filters.color === 'todos' || v.color === filters.color) &&
                   (v.precio <= filters.precio) &&
                   (v.kilometraje <= filters.km) &&
                   (v.potencia_cv <= filters.potencia) && 
                   (v.ano >= filters.ano);
        });
        displayVehicleList(filteredVehicles);
    };
    filterForm.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', applyFilters);
    });
    // ... (event listeners de los sliders) ...
    applyFilters();
}

// 5d. Dibuja la lista de vehículos (vehiculos.html)
function displayVehicleList(vehicles) {
    // ... (Tu código original - no necesita cambios)
    const container = document.getElementById('vehicle-list-container');
    if (!container) return;
    container.innerHTML = '';
    if (vehicles.length === 0) {
        container.innerHTML = `<p data-key="filter_no_results">No se encontraron vehículos.</p>`;
        updateTextContent(currentLang);
        return;
    }
    vehicles.forEach(v => {
        // ... (creación del HTML de la tarjeta) ...
        const gallery = Array.isArray(v.imagenes_galeria) ? v.imagenes_galeria : [];
        // ...
        container.innerHTML += `...`; // Tu HTML de tarjeta de lista
    });
    updateTextContent(currentLang);
}
    
// 5e. Carga la página de detalle
async function loadVehicleDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleId = parseInt(urlParams.get('id'));
    if (!vehicleId) {
        document.getElementById('vehicle-title-placeholder').innerText = "Vehículo no encontrado";
        return;
    }

    // Espera a que allVehicles esté cargado (si initialize aún no ha terminado)
    if (allVehicles.length === 0) {
        console.warn("Vehículos aún no cargados, reintentando...");
        // Si allVehicles está vacío, intenta cargarlos de nuevo (puede que el usuario haya llegado aquí directamente)
        await loadVehicles();
        if (allVehicles.length === 0) {
             document.getElementById('vehicle-title-placeholder').innerText = "Error al cargar vehículo.";
             return;
        }
    }

    const vehicle = allVehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
        document.getElementById('vehicle-title-placeholder').innerText = "Vehículo no encontrado";
        return;
    }

    // ... (Tu código original para rellenar la página - no necesita cambios)
    // Rellena título, precio, galería, datos técnicos, etc.
    document.title = `${vehicle.nombre} - AutoElite`;
    document.getElementById('vehicle-title-placeholder').innerText = vehicle.nombre;
    // ...
    const priceSuffix = vehicle.tipo === 'alquiler' ? '<span data-key="alquiler_por_dia">/día</span>' : '';
    document.getElementById('vehicle-price-placeholder').innerHTML = `€${vehicle.precio.toLocaleString('es-ES')} ${priceSuffix}`;
    // ...
    const mainImage = document.getElementById('gallery-main-placeholder');
    const thumbnailsContainer = document.getElementById('gallery-thumbnails-container');
    const galleryImages = [vehicle.imagenUrl, ...(Array.isArray(vehicle.imagenes_galeria) ? vehicle.imagenes_galeria : [])];
    const uniqueGalleryImages = [...new Set(galleryImages.filter(Boolean))];
    // ... (lógica de la galería) ...
    
    // Rellenar Datos Técnicos (¡MODIFICADO! para leer JSONB)
    const specsContainer = document.getElementById('specs-grid-container');
    specsContainer.innerHTML = '';
    const specs = vehicle.datos_tecnicos; // 'datos_tecnicos' es un objeto JSONB
    const specMap = {
        "categoria": "Categoría", "kilometraje": "Kilometraje", "potencia": "Potencia", 
        "combustible": "Combustible", "caja_de_cambios": "Caja de cambios", 
        "primera_inscripcion": "Primera inscripción"
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
    // ...
    updateTextContent(currentLang);
}
    
// 5f. LÓGICA DE MODALES DE DETALLE (¡¡MODIFICADO!!)
function setupDetailModals() {
    // ... (Tu código para abrir modales 'price-info' y 'financing' - no necesita cambios)
    document.getElementById('open-price-info')?.addEventListener('click', () => { /* ... */ });
    document.getElementById('open-financing-modal')?.addEventListener('click', (e) => { /* ... */ });
    
    // Lógica del botón de Guardar (¡¡MODIFICADO!!)
    const saveButton = document.getElementById('save-button');
    saveButton?.addEventListener('click', async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Por favor, inicia sesión como cliente para guardar vehículos.");
            window.location.href = 'login.html';
            return;
        }

        const vehicleId = parseInt(new URLSearchParams(window.location.search).get('id'));
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
                // ... (actualizar texto y icono)
            } else {
                // Añadir a favoritos
                const { error } = await supabase
                    .from('favoritos_clientes')
                    .insert({ cliente_id: user.id, vehiculo_id: vehicleId });
                if (error) throw error;
                saveButton.classList.add('saved');
                // ... (actualizar texto y icono)
            }
        } catch (error) {
            alert(`Error al guardar: ${error.message}`);
        }
    });

    // ... (Tu código para 'share-button' y 'financing-calculator' - no necesitan cambios)
    // ...
}

// --- 6. SIMULACIÓN DE COMPRA (MODAL) (¡¡MODIFICADO!!) ---
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
            if (!vehicle) return;

            currentVehicleId = vehicle.id;
            currentVehicleType = vehicle.tipo; // 'venta' o 'alquiler'
            
            const modalNameEl = purchaseModal.querySelector('#modal-vehicle-name');
            if (modalNameEl) modalNameEl.innerText = vehicle.nombre;
            purchaseModal.style.display = 'flex';
        }
    });

    purchaseModal.querySelector('#purchase-modal-confirm')?.addEventListener('click', async () => {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Aunque un cliente no esté logueado, podemos registrar el interés anónimamente.
        // Idealmente, pediríamos el login aquí. Por simplicidad, lo guardamos.
        
        let tableName = currentVehicleType === 'venta' ? 'leads_venta' : 'reservas_alquiler';
        let record = {
            vehiculo_id: currentVehicleId,
            cliente_id: user ? user.id : null, // Guarda el ID del cliente si está logueado
            estado: user ? 'nuevo' : 'pendiente_anonimo'
        };

        try {
            const { error } = await supabase.from(tableName).insert(record);
            if (error) throw error;

            purchaseModal.style.display = 'none';
            successModal.style.display = 'flex';
        } catch (error) {
            alert(`Error al confirmar interés: ${error.message}`);
        }
    });
}


// --- 7. FORMULARIOS DE SOPORTE (¡¡MODIFICADO!!) ---
function setupSupportForms() {
    const contactForm = document.getElementById('contact-form');
    contactForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(contactForm);
        const data = {
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            mensaje: formData.get('necesidad') // 'necesidad' es el name del textarea
        };

        try {
            const { error } = await supabase.from('mensajes_soporte').insert(data);
            if (error) throw error;
            
            contactForm.reset();
            const successModal = document.getElementById('success-modal');
            if (successModal) successModal.style.display = 'flex';

        } catch (error) {
            alert(`Error al enviar el mensaje: ${error.message}`);
        }
    });

    // ... (Tu código de chat-form - no necesita cambios, es una simulación)
    const chatForm = document.getElementById('chat-form');
    chatForm?.addEventListener('submit', (e) => {
        // ...
    });
}

// --- 8. LÓGICA DE LOGIN/REGISTRO (CLIENTES) (¡¡MODIFICADO!!) ---
function setupLoginTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    if (!tabLinks.length) return;
    // ... (Tu código para cambiar de pestaña - no necesita cambios)

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
            
            // ¡Éxito! Redirigir a la página principal
            window.location.href = 'index.html';
        } catch (error) {
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
                        nombre_completo: nombre // Añade el nombre a los metadatos
                    }
                }
            });
            if (authError) throw authError;

            // 2. Insertar en la tabla 'clientes' (si tienes RLS, esto necesita una policy)
            const { error: profileError } = await supabase
                .from('clientes')
                .insert({ id: authData.user.id, nombre_completo: nombre, email: email });

            if (profileError) {
                // Si falla la inserción del perfil, es un problema, pero el usuario ya está creado
                console.warn("Usuario creado en Auth, pero error al crear perfil:", profileError.message);
            }
            
            alert('¡Registro completado! Revisa tu email para confirmar tu cuenta.');
            // (Simulación de email) - Cambia a la pestaña de login
            document.querySelector('.tab-link[data-tab="login-form-box"]').click();

        } catch (error) {
            alert(`Error en el registro: ${error.message}`);
        }
    });
}

// --- 9. ACTUALIZAR ESTADO DEL LOGIN (CLIENTE) ---
async function updateClientLoginStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    const loginLink = document.querySelector('a.login-link');
    
    if (user) {
        // Usuario logueado (cliente)
        loginLink.innerText = "Mi Cuenta";
        loginLink.href = "#"; // O a una página "mi-cuenta.html"
        // Añadir un botón de logout
        const logoutButton = document.createElement('a');
        logoutButton.innerText = "Salir";
        logoutButton.href = "#";
        logoutButton.style.cursor = "pointer";
        logoutButton.style.marginLeft = "10px";
        logoutButton.onclick = async (e) => {
            e.preventDefault();
            await supabase.auth.signOut();
            window.location.reload();
        };
        loginLink.parentNode.insertBefore(logoutButton, loginLink.nextSibling);
        
    } else {
        // Usuario no logueado
        loginLink.innerText = "Acceso Clientes";
        loginLink.href = "login.html";
    }
}


// --- 10. Formulario Vender Coche (¡¡MODIFICADO!!) ---
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
            cliente_id: user ? user.id : null // Asocia al cliente si está logueado
        };

        try {
            // Insertar en Supabase y pedir que devuelva el 'id'
            const { data: insertedData, error } = await supabase
                .from('solicitudes_valoracion')
                .insert(data)
                .select('id')
                .single(); // .single() para obtener un solo objeto en lugar de un array

            if (error) throw error;
            
            // Redirige a valoracion.html pasando el ID de la solicitud
            window.location.href = `valoracion.html?id=${insertedData.id}`;
            
        } catch (error) {
            alert(`Error al enviar la valoración: ${error.message}`);
        }
    });
    
    // ... (Tu código para el placeholder del select - no necesita cambios)
}

// --- 11. Cargar datos en la página de Valoración (¡¡MODIFICADO!!) ---
async function loadValoracion() {
    const urlParams = new URLSearchParams(window.location.search);
    const valoracionId = parseInt(urlParams.get('id'));

    if (!valoracionId) {
        document.getElementById('valoracion-container').innerHTML = '<h1>Error</h1><p>No se encontró un ID de valoración. Por favor, <a href="vender.html">vuelva a intentarlo</a>.</p>';
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

        // 2. Calcular el precio (misma lógica que antes)
        let precioBase = 40000;
        // ... (Tu lógica de cálculo de precio)
        if (data.marca === 'Porsche') precioBase += 30000;
        // ...
        
        const precioFinal = Math.floor(precioBase);

        // 3. Actualizar la fila en Supabase con el precio estimado
        await supabase
            .from('solicitudes_valoracion')
            .update({ precio_estimado: precioFinal })
            .eq('id', valoracionId);

        // 4. Mostrar los datos en la página
        document.getElementById('valoracion-precio').innerText = `€${precioFinal.toLocaleString('es-ES')}`;
        document.getElementById('valoracion-resumen').innerHTML = `
            <li><span>Marca</span> <span>${data.marca}</span></li>
            <li><span>Modelo</span> <span>${data.modelo}</span></li>
            <li><span>Año</span> <span>${data.inscripcion}</span></li>
            <li><span>Kilometraje</span> <span>< ${data.kilometraje} km</span></li>
            <li><span>Estado</span> <span>${data.estado}</span></li>
        `;

    } catch (error) {
         document.getElementById('valoracion-container').innerHTML = `<h1>Error</h1><p>${error.message}</p>`;
    }
}


// --- FUNCIÓN DE AYUDA Creador de Tarjetas de Coche ---
function createVehicleCardHTML(v, type) {
    // ... (Tu código original - MODIFICADO para usar v.id)
    let priceSuffix = '';
    let buttonKey = 'vehiculos_btn_buy';
    if (v.tipo === 'alquiler') {
        priceSuffix = `<span data-key="alquiler_por_dia">/día</span>`;
        buttonKey = 'servicios_btn_reservar';
    }
    
    const buttonHTML = v.tipo === 'venta' ?
        `<a href="vehiculo-detalle.html?id=${v.id}" class="btn btn-primario full-width" data-key="vehiculos_btn_ver_detalles">Ver Detalles</a>` :
        `<button class="btn btn-primario full-width btn-buy" 
                 data-id="${v.id}" 
                 data-name="${v.nombre}"
                 data-key="${buttonKey}">
            Reservar
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
                    <span>${v.kilometraje.toLocaleString('es-ES')} km</span>
                    <span>${v.color}</span>
                </div>
                <div class="price">€${v.precio.toLocaleString('es-ES')} ${priceSuffix}</div>
            </div>
            <div class="card-footer">
                ${buttonHTML}
            </div>
        </div>
    `;
}
