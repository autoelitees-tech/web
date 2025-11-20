/*
 * SCRIPT PÚBLICO DE AUTOELITE (script-supabase.js)
 * VERSIÓN FINAL COMPLETA - GITHUB & SUPABASE READY
 */

// ----------------------------------------------------------------
// 1. CONFIGURACIÓN DE SUPABASE
// ----------------------------------------------------------------
// Sustituye estas variables con las de tu proyecto si cambian
const SUPABASE_URL = 'https://hnpznjcpyyzxhfkldkcj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucHpuamNweXl6eGhma2xka2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwODcyODMsImV4cCI6MjA3ODY2MzI4M30.7_yHRRIs_dEXduYBEoZurjIXs2grBFjwWmjKVfRbZLI';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variables globales del sistema
let currentLang = localStorage.getItem('lang') || 'es';
let langData = {};
let allVehicles = []; 

// Evento principal: Inicia todo cuando el HTML carga
document.addEventListener('DOMContentLoaded', () => {
    initialize();
});

// ----------------------------------------------------------------
// 2. FUNCIÓN INICIALIZADORA
// ----------------------------------------------------------------
async function initialize() {
    try {
        console.log("Iniciando AutoElite...");

        // 1. Cargar datos esenciales
        await loadLangData(); 
        await loadVehicles(); 
        
        // 2. Configurar elementos comunes de la interfaz
        setupThemeToggle();
        setupActiveNav();
        setupSearch(); 
        setupModalClosers();
        setupLegalModals();

        // 3. Detectar en qué página estamos y activar funciones específicas
        if (document.getElementById('featured-carousel')) setupCarousel();
        if (document.getElementById('vehicle-list-container')) setupFilters();
        
        // Página de detalles
        if (document.body.classList.contains('page-vehiculo-detalle')) {
            await loadVehicleDetail(); 
            setupDetailModals(); 
        }
        
        // Otras páginas
        if (document.getElementById('alquiler-grid')) displayAlquiler();
        if (document.querySelector('.vender-coche-form')) setupVenderForm();
        if (document.body.classList.contains('page-valoracion')) loadValoracion(); 

        // 4. Funcionalidades globales (Login, Soporte, Reservas)
        setupPurchaseModal();
        setupSupportForms();
        setupLoginTabs(); 
        updateClientLoginStatus();

        console.log("AutoElite cargado correctamente.");

    } catch (error) {
        console.error("Error crítico en la inicialización:", error);
    }
}

// ----------------------------------------------------------------
// 3. GESTIÓN DE DATOS (VEHÍCULOS Y TEXTOS)
// ----------------------------------------------------------------

async function loadVehicles() {
    try {
        // Intenta cargar desde la base de datos Supabase
        let { data, error } = await supabase
            .from('vehiculos')
            .select('*')
            .order('id', { ascending: true });
            
        if (error) throw error;
        
        allVehicles = data || [];
        console.log(`Cargados ${allVehicles.length} vehículos desde Base de Datos.`);
        
    } catch (error) {
        console.warn('Fallo al cargar de BD, intentando modo local (vehiculos.json)...', error);
        try {
            // Fallback: Si falla la base de datos, carga el archivo local
            const response = await fetch('vehiculos.json');
            allVehicles = await response.json();
        } catch (e) {
            console.error('No se pudieron cargar vehículos ni de BD ni local.', e);
            allVehicles = [];
        }
    }
}

async function loadLangData() {
    try {
        const response = await fetch('textos.json');
        if (response.ok) {
            langData = await response.json();
            updateTextContent(currentLang);
        }
    } catch (error) {
        console.error('Error cargando traducciones:', error);
    }

    // Eventos de los botones de idioma
    const btnEs = document.getElementById('lang-es');
    const btnEn = document.getElementById('lang-en');
    if(btnEs) btnEs.addEventListener('click', () => setLang('es'));
    if(btnEn) btnEn.addEventListener('click', () => setLang('en'));
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    updateTextContent(lang);
}

function updateTextContent(lang) {
    if (!langData[lang]) return;
    document.documentElement.lang = lang;
    
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.getAttribute('data-key');
        const text = langData[lang][key];
        if (text) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = text;
            } else {
                // Si el elemento tiene iconos, intentamos no borrarlos
                if (element.children.length > 0 && !element.querySelector('span')) {
                     // Si es complejo, lo dejamos (ej. estructuras anidadas manuales)
                } else {
                     // Lógica simple: busca un span interno o reemplaza todo
                     const span = element.querySelector('span:not(.icon)');
                     if(span) span.innerText = text;
                     else element.innerText = text;
                }
            }
        }
    });
    
    document.getElementById('lang-es')?.classList.toggle('active', lang === 'es');
    document.getElementById('lang-en')?.classList.toggle('active', lang === 'en');
}

// ----------------------------------------------------------------
// 4. INTERFAZ DE USUARIO (UI)
// ----------------------------------------------------------------

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    // Cargar preferencia guardada
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    }
    
    themeToggle.addEventListener('change', () => {
        if(themeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });
}

function setupActiveNav() {
    // Resalta el enlace del menú actual
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.main-nav a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === path) {
            link.classList.add('active');
        } else {
            link.classList.remove('active'); // Limpiar activos anteriores
        }
    });
}

function setupSearch() {
    document.querySelectorAll('.search-bar').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const term = form.querySelector('input').value;
            if (term.trim()) {
                window.location.href = `vehiculos.html?search=${encodeURIComponent(term)}`;
            }
        });
    });
}

function setupModalClosers() {
    // Cierra cualquier modal al hacer clic en X o fuera del contenido
    document.querySelectorAll('.modal-close-btn, .modal-overlay').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target === el || e.target.classList.contains('modal-close-btn')) {
                const modal = el.closest('.modal-overlay');
                if (modal) modal.style.display = 'none';
            }
        });
    });

    // Botón específico del modal de éxito
    document.getElementById('success-modal-close')?.addEventListener('click', () => {
        document.getElementById('success-modal').style.display = 'none';
        // Si no estamos en valoración, volver al inicio
        if (!window.location.href.includes('valoracion.html')) {
            window.location.href = 'index.html';
        }
    });
}

// ----------------------------------------------------------------
// 5. LÓGICA DE VEHÍCULOS (LISTADOS Y FILTROS)
// ----------------------------------------------------------------

function setupCarousel() {
    const container = document.getElementById('featured-carousel');
    if (!container) return;
    
    // Filtrar destacados de venta
    const destacados = allVehicles.filter(v => v.destacado === true && v.tipo === 'venta');
    
    if (destacados.length === 0) {
        container.innerHTML = '<p class="no-results">Próximamente nuevos vehículos destacados.</p>';
        return;
    }

    container.innerHTML = destacados.map(v => createVehicleCardHTML(v)).join('');
}

function setupFilters() {
    const form = document.getElementById('filter-form');
    if (!form) return;
    
    // Rellenar búsqueda si viene por URL
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search') ? params.get('search').toLowerCase() : '';

    const applyFilters = () => {
        const marca = document.getElementById('filter-marca').value;
        const color = document.getElementById('filter-color').value;
        const precio = parseInt(document.getElementById('filter-precio').value) || 9999999;
        const km = parseInt(document.getElementById('filter-km').value) || 9999999;
        const potencia = parseInt(document.getElementById('filter-potencia').value) || 9999;
        const ano = parseInt(document.getElementById('filter-ano').value) || 0;
        
        const filtered = allVehicles.filter(v => {
            // Filtros básicos
            if (v.tipo !== 'venta') return false;
            if (marca !== 'todas' && v.marca !== marca) return false;
            if (color !== 'todos' && v.color !== color) return false;
            if (v.precio > precio) return false;
            if (v.kilometraje > km) return false;
            if ((v.potencia_cv || 0) > potencia) return false;
            if (v.ano < ano) return false;

            // Filtro de texto (barra de búsqueda)
            if (search) {
                const fullName = (v.nombre + ' ' + v.marca).toLowerCase();
                if (!fullName.includes(search)) return false;
            }

            return true;
        });

        displayVehicleList(filtered);
    };

    // Listeners para inputs
    form.querySelectorAll('select, input').forEach(i => i.addEventListener('input', applyFilters));
    
    // Actualizar etiquetas de rango (sliders)
    ['precio', 'km', 'potencia'].forEach(id => {
        const input = document.getElementById(`filter-${id}`);
        const output = document.getElementById(`${id}-output`);
        if(input && output) {
            input.addEventListener('input', (e) => {
                let val = parseInt(e.target.value).toLocaleString('es-ES');
                let suffix = id === 'precio' ? '€' : (id === 'km' ? ' km' : ' CV');
                output.innerText = id === 'precio' ? (suffix + val) : (val + suffix);
            });
        }
    });

    applyFilters(); // Ejecutar al inicio
}

function displayVehicleList(list) {
    const container = document.getElementById('vehicle-list-container');
    if(!container) return;
    
    if(list.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No se encontraron vehículos con esos criterios.</p>';
        return;
    }
    
    // Generar HTML
    container.innerHTML = list.map(v => {
        // Miniaturas de galería (primeras 3)
        const gallery = v.imagenes_galeria || [];
        let thumbsHTML = '';
        for(let i=0; i<3; i++) {
            if(gallery[i]) thumbsHTML += `<img src="${gallery[i]}" alt="thumb">`;
        }

        return `
        <div class="vehicle-list-item">
            <div class="list-item-image-gallery">
                <div class="list-item-image">
                    <img src="${v.imagenUrl}" alt="${v.nombre}">
                </div>
                <div class="list-item-thumbnails">${thumbsHTML}</div>
            </div>
            <div class="list-item-content">
                <h3>${v.nombre}</h3>
                <p class="list-item-subtitle">${v.marca} ${v.ano}</p>
                <div class="list-item-specs">
                    <span>${(v.kilometraje||0).toLocaleString()} km</span>
                    <span>${v.potencia_cv || '-'} CV</span>
                    <span>${v.color}</span>
                </div>
                <div class="list-item-price">€${(v.precio||0).toLocaleString()}</div>
                <a href="vehiculo-detalle.html?id=${v.id}" class="btn btn-primario">Ver Detalles</a>
            </div>
        </div>`;
    }).join('');
}

function displayAlquiler() {
    const container = document.getElementById('alquiler-grid');
    if(!container) return;
    
    const list = allVehicles.filter(v => v.tipo === 'alquiler');
    if (list.length === 0) {
        container.innerHTML = '<p>No hay vehículos de alquiler disponibles en este momento.</p>';
        return;
    }
    
    container.innerHTML = list.map(v => createVehicleCardHTML(v)).join('');
}

// Helper para crear tarjetas (usado en carrusel y alquiler)
function createVehicleCardHTML(v) {
    const isAlquiler = v.tipo === 'alquiler';
    const btnText = isAlquiler ? 'Reservar' : 'Ver Detalles';
    const btnLink = isAlquiler ? '#' : `vehiculo-detalle.html?id=${v.id}`;
    const btnClass = isAlquiler ? 'btn-buy' : ''; // btn-buy activa el modal
    const priceSuffix = isAlquiler ? '/día' : '';

    return `
        <div class="vehicle-card">
            <div class="card-image-large">
                <img src="${v.imagenUrl}" alt="${v.nombre}">
            </div>
            <div class="card-content">
                <h3>${v.nombre}</h3>
                <div class="card-data">
                    <span>${v.ano}</span>
                    <span>${(v.kilometraje || 0).toLocaleString()} km</span>
                </div>
                <div class="price">€${(v.precio || 0).toLocaleString()}${priceSuffix}</div>
            </div>
            <div class="card-footer">
                ${isAlquiler 
                    ? `<button class="btn btn-primario full-width ${btnClass}" data-id="${v.id}">${btnText}</button>`
                    : `<a href="${btnLink}" class="btn btn-primario full-width">${btnText}</a>`
                }
            </div>
        </div>
    `;
}

// ----------------------------------------------------------------
// 6. PÁGINA DE DETALLE
// ----------------------------------------------------------------

async function loadVehicleDetail() {
    const id = new URLSearchParams(window.location.search).get('id');
    
    // Si no hay datos cargados aun, esperar
    if (allVehicles.length === 0) await loadVehicles();

    const v = allVehicles.find(veh => veh.id == id);
    
    if (!v) {
        document.getElementById('vehicle-title-placeholder').innerText = "Vehículo no encontrado";
        return;
    }
    
    // Rellenar textos básicos
    document.getElementById('vehicle-title-placeholder').innerText = v.nombre;
    document.getElementById('vehicle-subtitle-placeholder').innerText = `${v.marca} ${v.ano}`;
    
    const priceSuffix = v.tipo === 'alquiler' ? '/día' : '';
    document.getElementById('vehicle-price-placeholder').innerText = `€${(v.precio||0).toLocaleString()}${priceSuffix}`;
    
    // Imagen Principal
    const mainImg = document.getElementById('gallery-main-placeholder');
    if(mainImg) mainImg.src = v.imagenUrl || 'assets/coche-default.png';

    // Galería
    const galleryContainer = document.getElementById('gallery-thumbnails-container');
    const gallery = [v.imagenUrl, ...(v.imagenes_galeria || [])].filter(Boolean);
    
    if(galleryContainer) {
        galleryContainer.innerHTML = gallery.map((src, i) => 
            `<img src="${src}" class="${i===0?'active':''}" onclick="changeMainImage(this.src, this)">`
        ).join('');
    }
    
    // Datos técnicos
    const specsDiv = document.getElementById('specs-grid-container');
    if (specsDiv) {
        // Mezclamos datos raíz con el objeto JSON
        const specs = {
            "Marca": v.marca,
            "Año": v.ano,
            "Color": v.color,
            "Potencia": v.potencia_cv + ' CV',
            ...(v.datos_tecnicos || {})
        };
        
        specsDiv.innerHTML = Object.entries(specs).map(([k, val]) => `
            <div class="spec-item">
                <span>${k}</span>
                <strong>${val}</strong>
            </div>
        `).join('');
    }

    // Configurar botón de acción en sidebar
    const actionBtn = document.querySelector('.sidebar-box .btn-primario');
    if(actionBtn) {
        if(v.tipo === 'alquiler') {
            actionBtn.innerText = "Reservar Ahora";
            actionBtn.classList.add('btn-buy'); // Activa modal
            actionBtn.setAttribute('data-id', v.id);
            actionBtn.href = "#";
        } else {
            actionBtn.innerText = "Contactar Vendedor";
            actionBtn.href = "soporte.html"; // Redirige a soporte
        }
    }
}

// Función global para galería (necesaria para el onclick en string HTML)
window.changeMainImage = function(src, el) {
    document.getElementById('gallery-main-placeholder').src = src;
    document.querySelectorAll('.gallery-thumbnails img').forEach(img => img.classList.remove('active'));
    el.classList.add('active');
}

function setupDetailModals() {
    // Modal de Financiación
    document.getElementById('open-financing-modal')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('financing-modal').style.display = 'flex';
    });
    
    // Calculadora
    document.getElementById('finan-modal-calculate')?.addEventListener('click', () => {
        const precioText = document.getElementById('vehicle-price-placeholder').innerText;
        const precio = parseFloat(precioText.replace(/[^0-9]/g, '')) || 0;
        const entrada = parseFloat(document.getElementById('finan-entrada').value) || 0;
        const mensual = parseFloat(document.getElementById('finan-mensual').value) || 0;
        
        const res = document.getElementById('finan-resultado');
        if(mensual <= 0) {
            res.innerText = "Introduce una cuota mensual válida.";
            return;
        }
        
        const financiar = precio - entrada;
        if(financiar <= 0) {
            res.innerText = "No necesitas financiación.";
            return;
        }
        
        const meses = Math.ceil(financiar / mensual);
        const anios = Math.floor(meses / 12);
        const mesesResto = meses % 12;
        
        res.innerHTML = `<h4>Tiempo estimado: ${anios} años y ${mesesResto} meses</h4><p>(Sin intereses calculados)</p>`;
    });

    // Botón Guardar (Favoritos)
    const saveBtn = document.getElementById('save-button');
    if(saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if(!user) {
                alert("Inicia sesión para guardar favoritos.");
                return;
            }
            const vid = new URLSearchParams(window.location.search).get('id');
            
            // Alternar guardado (lógica simplificada: siempre intenta guardar)
            const { error } = await supabase.from('favoritos_clientes').insert({
                cliente_id: user.id,
                vehiculo_id: vid
            });
            
            if(error) {
                if(error.code === '23505') alert("Ya tienes este vehículo guardado."); // Error duplicado
                else alert("Error al guardar.");
            } else {
                alert("Vehículo guardado en favoritos.");
                saveBtn.classList.add('saved');
            }
        });
    }
}

// ----------------------------------------------------------------
// 7. MODALES Y FORMULARIOS GLOBALES
// ----------------------------------------------------------------

function setupPurchaseModal() {
    const modal = document.getElementById('purchase-modal');
    if(!modal) return;
    
    // Delegación de eventos para botones "btn-buy" (creados dinámicamente)
    document.body.addEventListener('click', (e) => {
        if(e.target.classList.contains('btn-buy')) {
            e.preventDefault();
            const vid = e.target.getAttribute('data-id');
            
            // Buscar nombre del coche
            const v = allVehicles.find(veh => veh.id == vid);
            if(v) {
                document.getElementById('modal-vehicle-name').innerText = v.nombre;
                modal.setAttribute('data-current-vid', vid); // Guardar ID en el modal
                modal.style.display = 'flex';
            }
        }
    });

    // Confirmar compra
    document.getElementById('purchase-modal-confirm')?.addEventListener('click', async () => {
        const vid = modal.getAttribute('data-current-vid');
        const { data: { user } } = await supabase.auth.getUser();
        
        // Insertar Lead
        const { error } = await supabase.from('leads_venta').insert({
            vehiculo_id: vid,
            cliente_id: user ? user.id : null,
            estado: 'nuevo'
        });
        
        if(!error) {
            modal.style.display = 'none';
            document.getElementById('success-modal').style.display = 'flex';
        } else {
            alert("Error al procesar la solicitud. Inténtalo más tarde.");
        }
    });
}

function setupSupportForms() {
    const form = document.getElementById('contact-form');
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            
            const { error } = await supabase.from('mensajes_soporte').insert({
                nombre: fd.get('nombre'),
                email: fd.get('email'),
                telefono: fd.get('telefono'),
                mensaje: fd.get('necesidad')
            });
            
            if(!error) {
                form.reset();
                document.getElementById('success-modal').style.display = 'flex';
            } else {
                alert("Error al enviar mensaje.");
            }
        });
    }
}

// ----------------------------------------------------------------
// 8. LOGIN Y REGISTRO DE CLIENTES
// ----------------------------------------------------------------

function setupLoginTabs() {
    // Lógica de pestañas (Login / Registro)
    document.querySelectorAll('.tab-link').forEach(t => {
        t.addEventListener('click', () => {
            // Quitar active de todos
            document.querySelectorAll('.tab-link').forEach(x => x.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
            
            // Poner active al actual
            t.classList.add('active');
            document.getElementById(t.dataset.tab).classList.add('active');
        });
    });

    // LOGIN
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if(!error) window.location.href = 'index.html';
        else alert("Error de acceso: " + error.message);
    });

    // REGISTRO
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const pass = document.getElementById('register-password').value;
        
        // 1. Crear usuario Auth
        const { data, error } = await supabase.auth.signUp({
            email, password: pass,
            options: { data: { full_name: name } }
        });
        
        if(error) {
            alert(error.message);
            return;
        }
        
        // 2. Crear perfil en tabla publica 'clientes'
        if(data.user) {
            const { error: profileError } = await supabase.from('clientes').insert({
                id: data.user.id,
                nombre_completo: name,
                email: email
            });
            
            if(!profileError) {
                alert("Cuenta creada. Por favor inicia sesión.");
                // Cambiar a pestaña login
                document.querySelector('[data-tab="login-form-box"]').click();
            }
        }
    });
}

async function updateClientLoginStatus() {
    // Comprobar si hay usuario logueado
    const { data: { session } } = await supabase.auth.getSession();
    const link = document.querySelector('.login-link');
    
    if(link && session) {
        link.innerText = "Mi Cuenta";
        link.href = "#";
        
        // Crear botón salir si no existe
        if(!document.getElementById('btn-logout')) {
            const logout = document.createElement('a');
            logout.id = 'btn-logout';
            logout.innerText = "(Salir)";
            logout.href = "#";
            logout.style.marginLeft = "10px";
            logout.style.fontSize = "0.8em";
            logout.addEventListener('click', async (e) => {
                e.preventDefault();
                await supabase.auth.signOut();
                window.location.reload();
            });
            link.parentNode.insertBefore(logout, link.nextSibling);
        }
    }
}

// ----------------------------------------------------------------
// 9. FORMULARIO DE TASACIÓN (VENDER)
// ----------------------------------------------------------------

function setupVenderForm() {
    const form = document.querySelector('.vender-coche-form');
    if(!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const { data: { user } } = await supabase.auth.getUser();
        
        const record = {
            marca: document.getElementById('vender-marca').value,
            modelo: document.getElementById('vender-modelo').value,
            inscripcion: document.getElementById('vender-inscripcion').value,
            kilometraje: document.getElementById('vender-kilometraje').value,
            estado: document.getElementById('vender-estado').value,
            combustible: document.getElementById('vender-combustible').value,
            equipamiento: {
                techo: document.getElementById('eq-techo').checked,
                navegador: document.getElementById('eq-navegador').checked
            },
            cliente_id: user ? user.id : null
        };

        const { data, error } = await supabase
            .from('solicitudes_valoracion')
            .insert(record)
            .select()
            .single();
            
        if(!error && data) {
            window.location.href = `valoracion.html?id=${data.id}`;
        } else {
            alert("Error al enviar valoración.");
        }
    });
}

async function loadValoracion() {
    const id = new URLSearchParams(window.location.search).get('id');
    if(!id) return;
    
    const { data } = await supabase.from('solicitudes_valoracion').select('*').eq('id', id).single();
    if(data) {
        // Cálculo simulado de precio
        let precio = 20000; 
        if(data.marca === 'Porsche') precio += 30000;
        if(data.estado === 'excelente') precio *= 1.2;
        
        document.getElementById('valoracion-precio').innerText = `€${precio.toLocaleString()}`;
        // Guardar precio calculado si no existe
        if(!data.precio_estimado) {
            supabase.from('solicitudes_valoracion').update({ precio_estimado: precio }).eq('id', id).then();
        }
    }
}

function setupLegalModals() {
    // Funcionalidad simple para enlaces del footer
    document.querySelectorAll('.legal-links a').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const m = document.getElementById('legal-modal');
            if(m) {
                document.getElementById('legal-modal-title').innerText = a.innerText;
                document.getElementById('legal-modal-content').innerHTML = "<p>Texto legal genérico...</p>";
                m.style.display = 'flex';
            }
        });
    });
}
