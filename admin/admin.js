/*
 * SCRIPT DE ADMINISTRACIÓN DE AUTOELITE (admin.js)
 * Conectado a Supabase
 * Maneja el login de EMPLEADOS y el CRUD de vehículos y mensajes.
 */

// ----------------------------------------------------------------
// ¡¡IMPORTANTE!! - Usa las MISMAS claves que en tu script público
// ----------------------------------------------------------------

const SUPABASE_URL = 'URL_DE_TU_PROYECTO_SUPABASE';
const SUPABASE_KEY = 'TU_CLAVE_PUBLICA_ANON_SUPABASE';

if (SUPABASE_URL === 'URL_DE_TU_PROYECTO_SUPABASE') {
    alert('ERROR: Faltan las claves de Supabase en admin.js');
    throw new Error("Faltan las claves de Supabase. Revisa el archivo admin.js");
}

const supabase_admin = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split('/').pop();

    if (path === 'acceso-personal.html') {
        handleLoginPage();
    } else if (path === 'admin-dashboard.html') {
        handleDashboardPage();
    } else if (path === 'admin-vehiculos.html') {
        handleVehiculosPage();
    } else if (path === 'admin-mensajes.html') {
        handleMensajesPage();
    }
});

// --- 1. LÓGICA DE AUTENTICACIÓN (EMPLEADOS) ---

async function checkAuth() {
    const { data: { user } } = await supabase_admin.auth.getUser();
    if (!user) {
        // No hay usuario, redirigir al login
        window.location.replace('acceso-personal.html');
        return null;
    }
    
    // VERIFICAR SI ES EMPLEADO (¡IMPORTANTE!)
    const { data: empleado, error } = await supabase_admin
        .from('empleados')
        .select('rol')
        .eq('id', user.id)
        .single();
        
    if (error || !empleado) {
        // Está logueado pero NO es un empleado (podría ser un cliente)
        await supabase_admin.auth.signOut();
        window.location.replace('acceso-personal.html');
        return null;
    }

    // Si es empleado, devuelve el usuario y su rol
    return { user, rol: empleado.rol };
}

function handleLoginPage() {
    const loginForm = document.getElementById('staff-login-form');
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('staff-email').value;
        const password = document.getElementById('staff-password').value;
        const errorMsg = document.getElementById('error-message');

        try {
            const { data, error } = await supabase_admin.auth.signInWithPassword({
                email: email,
                password: password,
            });
            if (error) throw error;
            
            // ¡Éxito! Redirigir al dashboard
            window.location.href = 'admin-dashboard.html';

        } catch (error) {
            errorMsg.innerText = `Error: ${error.message}`;
            errorMsg.style.display = 'block';
        }
    });
}

async function handleLogout() {
    await supabase_admin.auth.signOut();
    window.location.replace('acceso-personal.html');
}

// --- 2. PÁGINA: DASHBOARD ---

async function handleDashboardPage() {
    const auth = await checkAuth();
    if (!auth) return;

    // Cargar estadísticas
    const { data: vehiculos, count: vehicleCount } = await supabase_admin.from('vehiculos').select('*', { count: 'exact', head: true });
    const { data: mensajes, count: messageCount } = await supabase_admin.from('mensajes_soporte').select('*', { count: 'exact', head: true }).eq('estado', 'nuevo');
    
    document.getElementById('stats-vehiculos').innerText = vehicleCount || 0;
    document.getElementById('stats-mensajes').innerText = messageCount || 0;
    
    // Asignar evento al botón de logout
    document.getElementById('logout-button')?.addEventListener('click', handleLogout);
}

// --- 3. PÁGINA: GESTIÓN DE VEHÍCULOS ---

async function handleVehiculosPage() {
    const auth = await checkAuth();
    if (!auth) return;
    
    document.getElementById('logout-button')?.addEventListener('click', handleLogout);
    
    // Cargar la tabla de vehículos
    loadVehiculosAdmin();
}

async function loadVehiculosAdmin() {
    const tbody = document.getElementById('vehiculos-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';

    try {
        let { data: vehiculos, error } = await supabase_admin
            .from('vehiculos')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        tbody.innerHTML = ''; // Limpiar
        
        if (vehiculos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No se encontraron vehículos.</td></tr>';
            return;
        }

        vehiculos.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${v.id}</td>
                <td>${v.nombre}</td>
                <td>${v.marca}</td>
                <td>€ ${v.precio.toLocaleString('es-ES')}</td>
                <td>${v.tipo}</td>
                <td>
                    <button class="btn-admin-edit" data-id="${v.id}">Editar</button>
                    <button class="btn-admin-delete" data-id="${v.id}">Borrar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6">Error al cargar: ${error.message}</td></tr>`;
    }
}

// --- 4. PÁGINA: GESTIÓN DE MENSAJES ---

async function handleMensajesPage() {
    const auth = await checkAuth();
    if (!auth) return;
    
    document.getElementById('logout-button')?.addEventListener('click', handleLogout);
    
    // Cargar la tabla de mensajes
    loadMensajesAdmin();
}

async function loadMensajesAdmin() {
    const tbody = document.getElementById('mensajes-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
    try {
        let { data: mensajes, error } = await supabase_admin
            .from('mensajes_soporte')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        tbody.innerHTML = ''; // Limpiar
        
        if (mensajes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No hay mensajes nuevos.</td></tr>';
            return;
        }

        mensajes.forEach(m => {
            const tr = document.createElement('tr');
            tr.style.fontWeight = m.estado === 'nuevo' ? 'bold' : 'normal';
            tr.innerHTML = `
                <td>${new Date(m.created_at).toLocaleString()}</td>
                <td>${m.nombre}</td>
                <td>${m.email}</td>
                <td>${m.mensaje.substring(0, 50)}...</td>
                <td>${m.estado}</td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5">Error al cargar: ${error.message}</td></tr>`;
    }
}