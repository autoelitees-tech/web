/* Archivo: script.js */

document.addEventListener('DOMContentLoaded', () => {

    let currentLang = localStorage.getItem('lang') || 'es';
    let langData = {};
    let allVehicles = [];

    // --- 0. INICIALIZADOR PRINCIPAL ---
    async function initialize() {
        try {
            // Carga los datos primero
            await loadLangData(); 
            await loadVehicles();
            
            // Configura los elementos comunes
            setupThemeToggle();
            setupActiveNav();
            setupSearch(); 
            setupModalClosers(); // <-- ¡ARREGLADO! Llamada a la lógica global de modales
            setupLegalModals(); // <-- ¡NUEVO! Añadida la lógica para los modales legales

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
            setupLoginTabs();
            setupStaffLogin();

        } catch (error) {
            console.error("Error en la inicialización:", error);
            // Muestra un error al usuario si algo vital falla
            // document.body.innerHTML = "Error al cargar el sitio. Por favor, intente más tarde.";
        }
    }

    // --- ¡NUEVO! LÓGICA GLOBAL DE CIERRE DE MODALES ---
    // Esta función se encarga de cerrar todos los modales en todas las páginas.
    function setupModalClosers() {
        
        // Cierre genérico al clicar en el botón 'X' (modal-close-btn)
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // closest() encuentra el modal-overlay padre y lo oculta
                btn.closest('.modal-overlay').style.display = 'none';
            });
        });

        // Cierre genérico al clicar en el fondo (overlay)
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                // Si el clic es sobre el propio fondo (el overlay) y no sobre su contenido
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    
        // Lógica específica del botón "Aceptar" del modal de éxito
        // Esto ahora funcionará en CUALQUIER página (ej. alquiler.html o soporte.html)
        document.getElementById('success-modal-close')?.addEventListener('click', () => {
            window.location.href = 'index.html'; // Redirige al inicio
        });
    }

    // --- ¡NUEVO! LÓGICA PARA MODALES LEGALES (FOOTER) ---
    function setupLegalModals() {
        const legalModal = document.getElementById('legal-modal');
        if (!legalModal) return; // Salir si el modal no existe en esta página

        const titleEl = document.getElementById('legal-modal-title');
        const contentEl = document.getElementById('legal-modal-content');

        document.querySelectorAll('.legal-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Evita que el enlace '#' recargue la página

                const key = link.getAttribute('data-key');
                const title = link.innerText;
                
                // Rellenar el modal
                if (titleEl) titleEl.innerText = title;
                if (contentEl) {
                    // Contenido de ejemplo (reemplazar con el contenido real)
                    contentEl.innerHTML = `
                        <h3>${title}</h3>
                        <p>Este es el contenido de ejemplo para la sección "${title}".</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                    `;
                }
                
                // Mostrar el modal
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

    // --- 2. LÓGICA DE IDIOMAS ---
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
                    // Evita sobreescribir el contenido de los botones de compartir/guardar
                    if (element.closest('#save-button') || element.closest('#share-button')) {
                         if (!element.classList.contains('icon')) { // No sobreescribir el icono
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
        const currentPage = window.location.pathname.split('/').pop();
        
        if (document.body.classList.contains('page-vehiculo-detalle')) { 
            document.querySelector('.main-nav a[href="vehiculos.html"]')?.classList.add('active');
        } else if (currentPage === 'alquiler.html') {
            document.querySelector('.main-nav a[href="servicios.html"]')?.classList.add('active');
        } else if (document.body.classList.contains('page-valoracion')) {
             document.querySelector('.main-nav a[href="vender.html"]')?.classList.add('active');
        } else {
            document.querySelectorAll('.main-nav a').forEach(link => {
                // Maneja el caso de "index.html" o raíz vacía
                let linkHref = link.getAttribute('href');
                if (linkHref === currentPage || (linkHref === 'index.html' && currentPage === '')) {
                    link.classList.add('active');
                }
            });
        }
    }

    // --- 4. CARGA DE VEHÍCULOS (Centralizada) ---
    async function loadVehicles() {
        try {
            const response = await fetch('vehiculos.json');
            if (!response.ok) {
                throw new Error(`Error al cargar vehiculos.json: ${response.status} ${response.statusText}`);
            }
            allVehicles = await response.json();
        } catch (error) {
            console.error('Error fatal al cargar vehículos:', error);
            allVehicles = []; 
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
        if (vehiculosDestacados.length === 0) return; // No hacer nada si no hay vehículos

        vehiculosDestacados.forEach(v => {
            container.innerHTML += createVehicleCardHTML(v, 'carousel');
        });
        
        const track = container;
        let currentIndex = 0;

        // ... (El resto de la lógica del carrusel está bien)
        function getCardsToShow() {
            if (window.innerWidth <= 768) return 1;
            if (window.innerWidth <= 1200) return 2;
            return 3;
        }

        function updateCarousel() {
            const cardsToShow = getCardsToShow();
            const cardElement = track.querySelector('.vehicle-card');
            if (!cardElement) return; // Salir si no se han renderizado tarjetas

            const cardWidth = cardElement.clientWidth;
            const cardMargin = 16 * 2; 
            const totalWidth = cardWidth + cardMargin;
            const numCards = track.children.length;
            
            if (numCards <= cardsToShow) {
                 track.style.transform = `translateX(0px)`;
                 return;
            }
            
            const maxIndex = numCards - cardsToShow; 
            
            if (currentIndex < 0) currentIndex = 0;
            if (currentIndex > maxIndex) currentIndex = maxIndex;
            track.style.transform = `translateX(-${currentIndex * totalWidth}px)`;
        }
        
        window.addEventListener('resize', updateCarousel);
        updateCarousel(); // Llama una vez
        setTimeout(updateCarousel, 100); // Llama otra vez por si las imágenes tardan en cargar
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
                const matchesSearch = searchTerm === '' || 
                                      v.nombre.toLowerCase().includes(searchTerm) ||
                                      v.marca.toLowerCase().includes(searchTerm) ||
                                      (v.datos_tecnicos?.linea_equipos || '').toLowerCase().includes(searchTerm);
                
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
            container.innerHTML = `<p data-key="filter_no_results">No se encontraron vehículos.</p>`;
            updateTextContent(currentLang);
            return;
        }
        vehicles.forEach(v => {
            const specs = v.datos_tecnicos;
            const subtitle = v.datos_tecnicos?.linea_equipos || `${v.marca} ${v.ano}`;
            
            const gallery = Array.isArray(v.imagenes_galeria) ? v.imagenes_galeria : [];
            const thumbnails = gallery.slice(0, 3); 
            
            let thumbnailsHTML = '';
            for (let i = 0; i < 3; i++) {
                const imgSrc = thumbnails[i] ? thumbnails[i] : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                thumbnailsHTML += `<img src="${imgSrc}" alt="Miniatura ${i+1}">`;
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
                            <span>${v.kilometraje.toLocaleString('es-ES')} km</span>
                            <span>${specs?.caja_de_cambios || 'Automático'}</span>
                            <span>${specs?.potencia || ''}</span>
                            <span>${specs?.combustible || 'Gasolina'}</span>
                        </div>
                        <div class="list-item-price">€${v.precio.toLocaleString('es-ES')}</div>
                        <a href="vehiculo-detalle.html?id=${v.id}" class="btn btn-primario" data-key="vehiculos_btn_ver_detalles">Ver Detalles</a>
                    </div>
                </div>
            `;
        });
        updateTextContent(currentLang);
    }
    
    // 5e. Carga la página de detalle (¡CORREGIDO!)
    function loadVehicleDetail() {
        const urlParams = new URLSearchParams(window.location.search);
        const vehicleId = parseInt(urlParams.get('id'));
        if (!vehicleId) {
            document.getElementById('vehicle-title-placeholder').innerText = "Vehículo no encontrado";
            return;
        }

        // Espera a que allVehicles esté cargado (si initialize aún no ha terminado)
        if (allVehicles.length === 0) {
            console.warn("Vehículos aún no cargados, esperando...");
            // Esto es un fallback, pero initialize() debería manejarlo
            setTimeout(loadVehicleDetail, 100); 
            return;
        }

        const vehicle = allVehicles.find(v => v.id === vehicleId);
        if (!vehicle) {
            document.getElementById('vehicle-title-placeholder').innerText = "Vehículo no encontrado";
            return;
        }

        document.title = `${vehicle.nombre} - AutoElite`;
        document.getElementById('vehicle-title-placeholder').innerText = vehicle.nombre;
        document.getElementById('vehicle-subtitle-placeholder').innerText = vehicle.datos_tecnicos?.linea_equipos || `${vehicle.marca} ${vehicle.ano}`;

        // --- Rellenar Sidebar Nueva ---
        const priceSuffix = vehicle.tipo === 'alquiler' ? '<span data-key="alquiler_por_dia">/día</span>' : '';
        document.getElementById('vehicle-price-placeholder').innerHTML = `€${vehicle.precio.toLocaleString('es-ES')} ${priceSuffix}`;

        const priceBadge = document.getElementById('vehicle-price-badge');
        const priceBadgeText = document.getElementById('vehicle-price-badge-text');
        const monthlyPaymentEl = document.getElementById('vehicle-monthly-payment');
        const financingBox = document.querySelector('.financing-calculator');

        if (vehicle.tipo === 'venta') {
            // Rellenar distintivo de precio
            if (vehicle.calificacion_precio && langData[currentLang]) {
                priceBadge.className = 'price-badge ' + vehicle.calificacion_precio;
                
                // --- ¡CORRECCIÓN 1! ---
                const calif_key = 'calif_' + vehicle.calificacion_precio;
                const translation = langData[currentLang][calif_key];
                if (translation) {
                    priceBadgeText.innerText = translation;
                    priceBadgeText.setAttribute('data-key', calif_key);
                }
                // --- Fin Corrección 1 ---

                priceBadge.style.display = 'inline-flex';
            } else {
                priceBadge.style.display = 'none';
            }

            // Rellenar pago mensual
            if (vehicle.pago_mensual > 0) {
                const monthlyPaymentText = `<span data-key="finan_desde">desde</span> <strong>€${vehicle.pago_mensual.toLocaleString('es-ES')} / mes</strong>`;
                monthlyPaymentEl.innerHTML = monthlyPaymentText;
                monthlyPaymentEl.style.display = 'block';
                
                document.getElementById('financing-monthly-price').innerText = `€${vehicle.pago_mensual.toLocaleString('es-ES')}`;
                financingBox.style.display = 'block';
            } else {
                monthlyPaymentEl.style.display = 'none';
                financingBox.style.display = 'none';
            }
            
            // Rellenar precio en modal de financiación
            const finanPrecio = document.getElementById('finan-precio-total');
            if(finanPrecio) finanPrecio.innerText = `€${vehicle.precio.toLocaleString('es-ES')}`;

        } else {
            // Ocultar todo si es alquiler
            priceBadge.style.display = 'none';
            monthlyPaymentEl.style.display = 'none';
            if (financingBox) financingBox.style.display = 'none';
            
            // Cambiar botón principal a "Reservar" (simulación) si es alquiler
            const contactButton = document.querySelector('.price-box .btn-primario');
            if(contactButton) {
                contactButton.setAttribute('data-key', 'servicios_btn_reservar');
                contactButton.innerText = 'Reservar Ahora';
                // Añadimos 'btn-buy' para que el modal 'setupPurchaseModal' lo detecte
                contactButton.classList.add('btn-buy');
                contactButton.setAttribute('data-name', vehicle.nombre); // Añadimos el nombre para el modal
            }
        }
        
        // --- Lógica del Carrusel ---
        const mainImage = document.getElementById('gallery-main-placeholder');
        const thumbnailsContainer = document.getElementById('gallery-thumbnails-container');
        const prevButton = document.getElementById('prev-image');
        const nextButton = document.getElementById('next-image');
        const zoomButton = document.getElementById('zoom-image');
        const zoomModal = document.getElementById('zoom-modal');
        const zoomImage = document.getElementById('zoom-modal-image');
        // const zoomCloseButton = document.getElementById('zoom-modal-close'); // <- Quitado, se usa el global
        
        const galleryImages = [vehicle.imagenUrl, ...(Array.isArray(vehicle.imagenes_galeria) ? vehicle.imagenes_galeria : [])];
        const uniqueGalleryImages = [...new Set(galleryImages.filter(Boolean))]; // Filtra nulos o undefined
        
        let currentImageIndex = 0;

        function updateGallery(index) {
            currentImageIndex = index;
            mainImage.src = uniqueGalleryImages[currentImageIndex];
            thumbnailsContainer.querySelectorAll('img').forEach((img, i) => {
                img.classList.toggle('active', i === currentImageIndex);
            });
        }

        thumbnailsContainer.innerHTML = '';
        uniqueGalleryImages.forEach((imgUrl, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgUrl;
            thumb.alt = `Foto ${index + 1}`;
            if (index === 0) thumb.classList.add('active');
            thumb.addEventListener('click', () => updateGallery(index));
            thumbnailsContainer.appendChild(thumb);
        });

        prevButton.onclick = () => updateGallery((currentImageIndex - 1 + uniqueGalleryImages.length) % uniqueGalleryImages.length);
        nextButton.onclick = () => updateGallery((currentImageIndex + 1) % uniqueGalleryImages.length);
        
        if (uniqueGalleryImages.length <= 1) {
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
        }

        zoomButton.onclick = () => {
            zoomImage.src = uniqueGalleryImages[currentImageIndex];
            zoomModal.style.display = 'flex';
        };
        // zoomCloseButton.onclick = () => zoomModal.style.display = 'none'; // <- Quitado, se usa el global
        // zoomModal.onclick = (e) => { if (e.target === zoomModal) zoomModal.style.display = 'none'; }; // <- Quitado, se usa el global
        
        if (uniqueGalleryImages.length > 0) {
            updateGallery(0); 
        } else {
            mainImage.src = 'assets/coche-default.png'; // Fallback
        }
        // --- Fin Lógica Carrusel ---

        // Rellenar Datos Técnicos
        const specsContainer = document.getElementById('specs-grid-container');
        specsContainer.innerHTML = '';
        const specs = vehicle.datos_tecnicos;
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

        // Rellenar Vendedor
        const sellerContainer = document.getElementById('vehicle-seller-box');
        const seller = vehicle.vendedor;
        if (seller && seller.nombre) { 
            sellerContainer.innerHTML = `
                <h4>${seller.nombre}</h4>
                <div class="seller-rating">
                    <span class="stars">${'★'.repeat(Math.floor(seller.rating))}${'☆'.repeat(5 - Math.floor(seller.rating))}</span>
                    <span>(${seller.reviews} <span data-key="vendedor_opiniones">opiniones</span>)</span>
                </div>
                <p>${seller.direccion || ''}</p>
            `;
        }
        
        // Actualizar textos por idioma
        updateTextContent(currentLang);
    }
    
    // --- 5f. LÓGICA DE MODALES DE DETALLE (¡LIMPIADO!) ---
    function setupDetailModals() {
        const priceInfoModal = document.getElementById('price-info-modal');
        const financingModal = document.getElementById('financing-modal');
        // const successModal = document.getElementById('success-modal'); // <- Quitado, se usa el global

        // Abrir modales
        document.getElementById('open-price-info')?.addEventListener('click', () => {
            if (priceInfoModal) priceInfoModal.style.display = 'flex';
        });
        
        document.getElementById('open-financing-modal')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (financingModal) financingModal.style.display = 'flex';
        });

        // --- ¡ARREGLADO! ---
        // Toda la lógica de cierre (querySelectorAll('.modal-overlay'), querySelectorAll('.modal-close-btn')
        // y getElementById('success-modal-close')) se ha movido a la función global setupModalClosers()
        // para que funcione en todas las páginas.

        // Lógica del botón de Guardar
        const saveButton = document.getElementById('save-button');
        saveButton?.addEventListener('click', () => {
            saveButton.classList.toggle('saved');
            const icon = saveButton.querySelector('.icon');
            const text = saveButton.querySelector('span:last-child');
            if (saveButton.classList.contains('saved')) {
                icon.innerText = '★';
                text.innerText = 'Guardado'; // Simulación
                text.removeAttribute('data-key');
            } else {
                icon.innerText = '☆';
                text.setAttribute('data-key', 'vehiculos_btn_guardar');
                updateTextContent(currentLang); // Restaura el texto original
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
                    text.innerText = originalText; // Restaura el texto visual
                    text.setAttribute('data-key', originalTextKey); // Restaura el key
                    updateTextContent(currentLang); // Re-traduce si es necesario
                }, 2000);
            });
        });

        // Lógica de la calculadora de financiación
        document.getElementById('finan-modal-calculate')?.addEventListener('click', () => {
            const precioText = document.getElementById('finan-precio-total').innerText;
            // Parseador de moneda robusto para "€84.900" o "€84,900"
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
            
            const interesAnual = 0.05; // 5% de interés (simulación)
            const interesMensual = interesAnual / 12;

            // Comprobar si el pago cubre los intereses
            if (pagoMes <= totalAFinanciar * interesMensual) {
                resultadoDiv.innerHTML = `<p data-key="finan_modal_error_interes">El pago mensual es demasiado bajo para cubrir los intereses.</p>`;
                updateTextContent(currentLang);
                return;
            }

            // Fórmula para calcular el número de meses (nper)
            const numMeses = -Math.log(1 - (totalAFinanciar * interesMensual) / pagoMes) / Math.log(1 + interesMensual);
            
            // --- ¡CORRECCIÓN 2! ---
            const totalMeses = Math.ceil(numMeses);
            const numAnios = Math.floor(totalMeses / 12);
            const mesesRestantes = totalMeses % 12;
            // --- Fin Corrección 2 ---

            resultadoDiv.innerHTML = `
                <p data-key="finan_modal_resultado">Tiempo de financiación estimado:</p>
                <h4>${numAnios} <span data-key="finan_modal_anios">años</span> y ${mesesRestantes} <span data-key="finan_modal_meses">meses</span></h4>
            `;
            updateTextContent(currentLang);
        });
    }

    // --- 6. SIMULACIÓN DE COMPRA (MODAL) (¡CORREGIDA!) ---
    // Esta función es para los botones "Reservar" de alquiler.html y detalle (si es alquiler)
    function setupPurchaseModal() {
        const purchaseModal = document.getElementById('purchase-modal');
        const successModal = document.getElementById('success-modal');
        if (!purchaseModal || !successModal) return; // No hacer nada si los modales no existen en la página
        
        document.body.addEventListener('click', function(e) {
            // Se activa si el botón tiene 'btn-buy'
            const target = e.target.closest('.btn-buy');
            
            if (target) {
                // Previene que un link <a> (si se usa) navegue
                e.preventDefault(); 
                
                const vehicleName = target.getAttribute('data-name') || "este vehículo";
                const modalNameEl = purchaseModal.querySelector('#modal-vehicle-name');
                if (modalNameEl) modalNameEl.innerText = vehicleName;
                purchaseModal.style.display = 'flex';
            }
        });

        purchaseModal.querySelector('#purchase-modal-confirm')?.addEventListener('click', () => {
            purchaseModal.style.display = 'none';
            // ¡MODIFICADO! Muestra el modal de éxito
            successModal.style.display = 'flex';
        });
    }


    // --- 7. FORMULARIOS DE SOPORTE ---
    function setupSupportForms() {
        const contactForm = document.getElementById('contact-form');
        contactForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            // Reutilizamos el modal de éxito
            const successModal = document.getElementById('success-modal');
            if (successModal) successModal.style.display = 'flex';
            contactForm.reset();
        });

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
                    botResponse = 'Nuestro horario es de L-V de 9:00 a 20:00. (Simulación)';
                }
                chatBox.innerHTML += `<div class="chat-message bot">${botResponse}</div>`;
                chatBox.scrollTop = chatBox.scrollHeight;
            }, 1000);
        });
    }

    // --- 8. LÓGICA DE LOGIN (Pestañas y Formularios) ---
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

        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Inicio de sesión de cliente correcto. (Simulación)');
            window.location.href = 'index.html';
        });

        document.getElementById('register-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Registro de cliente completado. (Simulación)');
            document.querySelector('.tab-link[data-tab="login-form-box"]').click();
        });
    }
    
    // --- 9. LOGIN PERSONAL ---
    function setupStaffLogin() {
        const staffLoginForm = document.getElementById('staff-login-form');
        staffLoginForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Acceso de personal correcto. Redirigiendo al panel... (Simulación)');
            window.location.href = 'index.html';
        });
    }

    // --- 10. Formulario Vender Coche ---
    function setupVenderForm() {
        const venderForm = document.querySelector('.vender-coche-form');
        venderForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            
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
                }
            };

            localStorage.setItem('valoracionData', JSON.stringify(data));
            window.location.href = 'valoracion.html';
        });
        
        venderForm?.querySelectorAll('select').forEach(s => {
            s.addEventListener('change', () => s.classList.remove('placeholder'));
        });
    }

    // --- 11. Cargar datos en la página de Valoración ---
    function loadValoracion() {
        const data = JSON.parse(localStorage.getItem('valoracionData'));
        if (!data) {
            document.getElementById('valoracion-container').innerHTML = '<h1>Error</h1><p>No se encontraron datos para la valoración. Por favor, <a href="vender.html">vuelva a intentarlo</a>.</p>';
            return;
        }

        let precioBase = 40000;
        if (data.marca === 'Porsche') precioBase += 30000;
        if (data.marca === 'BMW') precioBase += 15000;
        if (data.marca === 'Mercedes-Benz') precioBase += 18000;
        if (data.marca === 'Audi') precioBase += 12000;
        
        if (data.estado === 'excelente') precioBase *= 1.15;
        if (data.estado === 'bueno') precioBase *= 1.0;
        if (data.estado === 'usado') precioBase *= 0.85;
        
        if (data.kilometraje === '10000') precioBase *= 1.1;
        if (data.kilometraje === '50000') precioBase *= 1.0;
        if (data.kilometraje === '100000') precioBase *= 0.9;
        if (data.kilometraje === '150000') precioBase *= 0.75;
        
        if (data.equipamiento.techo) precioBase += 1500;
        if (data.equipamiento.asientos) precioBase += 1000;
        if (data.equipamiento.navegador) precioBase += 500;
        if (data.equipamiento.camara) precioBase += 800;
        
        const precioFinal = Math.floor(precioBase);

        document.getElementById('valoracion-precio').innerText = `€${precioFinal.toLocaleString('es-ES')}`;
        document.getElementById('valoracion-resumen').innerHTML = `
            <li><span>Marca</span> <span>${data.marca}</span></li>
            <li><span>Modelo</span> <span>${data.modelo}</span></li>
            <li><span>Año</span> <span>${data.inscripcion}</span></li>
            <li><span>Kilometraje</span> <span>< ${data.kilometraje} km</span></li>
            <li><span>Estado</span> <span>${data.estado}</span></li>
            <li><span>Equipamiento</span> <span>${[
                (data.equipamiento.techo ? 'Techo Solar' : ''),
                (data.equipamiento.navegador ? 'Navegador' : ''),
                (data.equipamiento.asientos ? 'Asientos Calef.' : ''),
                (data.equipamiento.camara ? 'Cámara 360' : '')
            ].filter(Boolean).join(', ') || 'Base'}</span></li>
        `;
        
        // localStorage.removeItem('valoracionData'); // Opcional: limpiar después de usar
    }


    // --- FUNCIÓN DE AYUDA Creador de Tarjetas de Coche ---
    function createVehicleCardHTML(v, type) {
        let priceSuffix = '';
        let buttonKey = 'vehiculos_btn_buy';
        if (v.tipo === 'alquiler') {
            priceSuffix = `<span data-key="alquiler_por_dia">/día</span>`;
            buttonKey = 'servicios_btn_reservar';
        }
        
        const buttonHTML = v.tipo === 'venta' ?
            `<a href="vehiculo-detalle.html?id=${v.id}" class="btn btn-primario full-width" data-key="vehiculos_btn_ver_detalles">Ver Detalles</a>` :
            // Se añade la clase 'btn-buy' para que el modal de compra lo detecte
            `<button class="btn btn-primario full-width btn-buy" 
                     data-id="${v.id}" 
                     data-name="${v.nombre}"
                     data-key="${buttonKey}">
                Reservar
            </button>`;

        // Nuevo layout de tarjeta
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

    // --- EJECUTAR EL INICIALIZADOR ---
    initialize();
});