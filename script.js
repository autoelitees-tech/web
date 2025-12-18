// --- MODO NOCHE PERSISTENTE ---
const themeBtn = document.getElementById('theme-toggle');

// 1. Al cargar, aplicar tema guardado
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

// 2. Al hacer clic, cambiar y guardar
if(themeBtn){
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });
}

// --- CARRUSEL PRINCIPAL (HOME) ---
const slides = document.querySelectorAll('.slide');
if(slides.length > 0) {
    let currentSlide = 0;
    const intervalTime = 10000; 
    let slideInterval;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) slide.classList.add('active');
        });
    }
    function moveSlide(step) {
        currentSlide += step;
        if (currentSlide >= slides.length) currentSlide = 0;
        if (currentSlide < 0) currentSlide = slides.length - 1;
        showSlide(currentSlide);
        resetTimer();
    }
    function startTimer() { slideInterval = setInterval(() => moveSlide(1), intervalTime); }
    function resetTimer() { clearInterval(slideInterval); startTimer(); }
    window.moveSlide = moveSlide;
    startTimer();
}

// --- LIGHTBOX ---
const lightbox = document.getElementById('lightboxModal');
const lightboxImg = document.getElementById('lightboxImage');
window.openLightbox = function(src) {
    if(lightbox && lightboxImg) { lightbox.style.display = 'flex'; lightboxImg.src = src; }
}
window.closeLightbox = function() { if(lightbox) lightbox.style.display = 'none'; }


// ==========================================
// --- GESTIÓN DE CARRUSELES EN MODALES ---
// ==========================================

function setupModalCarousel(containerId, imagesArray) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = ''; // Limpiar
    
    if(!imagesArray || imagesArray.length === 0) {
        imagesArray = ['https://via.placeholder.com/600x800?text=SIN+FOTO'];
    }

    imagesArray.forEach((src, index) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = 'modal-slide'; // Clase generica para slides de modal
        if(index === 0) slideDiv.classList.add('active');
        
        const img = document.createElement('img');
        img.src = src;
        slideDiv.appendChild(img);
        container.appendChild(slideDiv);
    });
    
    return imagesArray.length;
}

function changeModalSlide(containerId, step, currentIndex, totalSlides) {
    if(totalSlides <= 1) return currentIndex;

    const container = document.getElementById(containerId);
    const slides = container.getElementsByClassName('modal-slide');
    
    slides[currentIndex].classList.remove('active');
    
    let nextIndex = currentIndex + step;
    if (nextIndex >= totalSlides) nextIndex = 0;
    if (nextIndex < 0) nextIndex = totalSlides - 1;
    
    slides[nextIndex].classList.add('active');
    return nextIndex;
}


// --- MODAL PARTIDO (CON CARRUSEL) ---
const matchModal = document.getElementById('matchModal');
let currentMatchSlideIndex = 0;
let totalMatchSlides = 0;

window.openMatchModal = function(title, score, details, imagesArray) {
    if(matchModal) {
        document.getElementById('modalMatchTitle').innerText = title;
        document.getElementById('modalScore').innerText = score;
        document.getElementById('modalDetails').innerHTML = details;
        
        // Configurar carrusel partido
        totalMatchSlides = setupModalCarousel('matchSlidesContainer', imagesArray);
        currentMatchSlideIndex = 0;

        matchModal.style.display = 'flex';
    }
}

window.changeMatchSlide = function(step) {
    currentMatchSlideIndex = changeModalSlide('matchSlidesContainer', step, currentMatchSlideIndex, totalMatchSlides);
}

window.closeMatchModal = function() { if(matchModal) matchModal.style.display = 'none'; }


// --- MODAL JUGADOR (CON CARRUSEL) ---
const playerModal = document.getElementById('playerModal');
let currentPlayerSlideIndex = 0;
let totalPlayerSlides = 0;

window.openPlayerModal = function(name, nickname, pos, num, age, goals, yellow, red, imagesArray) {
    if(!playerModal) return;

    // Rellenar datos
    document.getElementById('pmName').innerText = name;
    document.getElementById('pmNick').innerText = nickname;
    document.getElementById('pmPos').innerText = pos;
    document.getElementById('pmNum').innerText = "#" + num;
    document.getElementById('pmAge').innerText = age + " Años";
    document.getElementById('pmGoals').innerText = goals;
    document.getElementById('pmYellow').innerText = yellow;
    document.getElementById('pmRed').innerText = red;

    // Configurar carrusel jugador
    totalPlayerSlides = setupModalCarousel('playerSlidesContainer', imagesArray);
    currentPlayerSlideIndex = 0;

    playerModal.style.display = 'flex';
}

window.changePlayerSlide = function(step) {
    currentPlayerSlideIndex = changeModalSlide('playerSlidesContainer', step, currentPlayerSlideIndex, totalPlayerSlides);
}

window.closePlayerModal = function() { if(playerModal) playerModal.style.display = 'none'; }


// --- CONTROL GLOBAL ---
window.onclick = function(event) {
    if (event.target == matchModal) closeMatchModal();
    if (event.target == lightbox) closeLightbox();
    if (event.target == playerModal) closePlayerModal();
}

window.cookieAlert = function(msg) { alert(msg || 'Esta web usa cookies.'); }