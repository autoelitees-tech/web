/*
 * SCRIPT DE ADMINISTRACIÓN DE AUTOELITE (admin.js)
 * VERSIÓN CORREGIDA
 *
 * Maneja el login de EMPLEADOS y el CRUD de vehículos y mensajes.
 */

// ----------------------------------------------------------------
// ¡¡IMPORTANTE!! - Usa las MISMAS claves que en tu script-supabase.js
// ----------------------------------------------------------------

const SUPABASE_URL = 'URL_DE_TU_PROYECTO_SUPABASE'; // <-- PEGA TU URL AQUÍ
const SUPABASE_KEY = 'TU_CLAVE_PUBLICA_ANON_SUPABASE'; // <-- PEGA TU CLAVE 'anon' AQUÍ

if (SUPABASE_URL.includes('URL_DE_TU_PROYECTO_SUPABASE')) {
    alert('ERROR: Faltan las claves de Supabase en admin.js');
    throw new Error("Faltan las claves de Supabase. Revisa el archivo admin.js");
}

// Inicializa el cliente de Supabase
const supabase_admin = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split('/').pop();

    // Redirige al dashboard si ya está logueado, excepto si está en la página de login
    if (path !== 'acceso-personal.html') {
        checkAuthAndRedirect();
    }

    // Ejecuta la función específica de la página actual
    if (path === 'acceso-personal.html') {
        handleLoginPage();
    } else if (path === 'admin-dashboard.html') {
        handleDashboardPage();
    } else if (path === 'admin-vehiculos.html') {
        handleVehiculosPage();
    } else if (path === 'admin-mensajes.html') {
        handleMensajesPage();
    }
    
    // Asignar evento de logout en cualquier página de admin
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// --- 1. LÓGICA DE AUTENTICACIÓN (EMPLEADOS) ---

async function checkAuthAndRedirect() {
    const { data: { user } } = await supabase_admin.auth.getUser();
    if (!user) {
        // No hay usuario, redirigir al login
        window.location.replace('acceso-personal.html');
        return null;
    }
    
    // VERIFICAR SI ES EMPLEADO
    try {
        // ¡¡CORRECCIÓN!! Faltaba el "= await"
        const { data: empleado, error } = await supabase_admin
            .from('empleados')
            .select('rol')
            .eq('id', user.id)
            .single();
            
        if (error || !empleado) {
            console.warn("Usuario logueado pero NO es empleado. Cerrando sesión.");
            await supabase_admin.auth.signOut();
            window.location.replace('acceso-personal.html');
            return null;
        }
        // Si es empleado, devuelve el usuario y su rol
        return { user, rol: empleado.rol };
        
    } catch(e) {
        console.error("Error verificando empleado:", e);
        // Si la tabla 'empleados' no existe o falla, cierra sesión
        await supabase_admin.auth.signOut();
        window.location.replace('acceso-personal.html');
        return null;
    }
}

function handleLoginPage() {
    const loginForm = document.getElementById('staff-login-form');
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('staff-email').value;
        const password = document.getElementById('staff-password').value;
        const errorMsg = document.getElementById('error-message');
        const button = loginForm.querySelector('button');
        button.disabled = true;
        button.innerText = "Entrando...";

        try {
            const { data, error } = await supabase_admin.auth.signInWithPassword({
                email: email,
                password: password,
            });
            if (error) throw error;
            if (!data.user) throw new Error("Usuario no encontrado.");
            
            // Verificar que es empleado ANTES de redirigir
            const { data: empleado, error: empError } = await supabase_admin
                .from('empleados')
                .select('id')
                .eq('id', data.user.id)
                .single();

            if (empError || !empleado) {
                await supabase_admin.auth.signOut(); // Es un cliente, no dejarlo entrar
                throw new Error("Tus credenciales son correctas, pero no eres un empleado.");
            }

            // ¡Éxito! Redirigir al dashboard
            window.location.href = 'admin-dashboard.html';

        } catch (error) {
            errorMsg.innerText = `Error: ${error.message}`;
            errorMsg.style.display = 'block';
            button.disabled = false;
            button.innerText = "Entrar";
        }
    });
}

async function handleLogout(e) {
    e.preventDefault();
    e.target.innerText = "Cerrando...";
    await supabase_admin.auth.signOut();
    window.location.replace('acceso-personal.html');
}

// --- 2. PÁGINA: DASHBOARD ---

async function handleDashboardPage() {
    const auth = await checkAuthAndRedirect();
    if (!auth) return;

    try {
        // Cargar estadísticas
        // ¡¡CORRECCIÓN!! Faltaba el "= await" en todas estas
        const { count: vehicleCount, error: vError } = await supabase_admin.from('vehiculos').select('*', { count: 'exact', head: true });
        const { count: messageCount, error: mError } = await supabase_admin.from('mensajes_soporte').select('*', { count: 'exact', head: true }).eq('estado', 'nuevo');
        const { count: valoracionCount, error: valError } = await supabase_admin.from('solicitudes_valoracion').select('*', { count: 'exact', head: true }).is('precio_estimado', null); // Pendientes
        
        if(vError) throw vError;
        if(mError) throw mError;
        if(valError) throw valError;

        document.getElementById('stats-vehiculos').innerText = vehicleCount || 0;
        document.getElementById('stats-mensajes').innerText = messageCount || 0;
        document.getElementById('stats-valoraciones').innerText = valoracionCount || 0;
    } catch (error) {
        console.error("Error cargando stats:", error);
        document.getElementById('stats-vehiculos').innerText = "Error";
    }
}

// --- 3. PÁGINA: GESTIÓN DE VEHÍCULOS ---

async function handleVehiculosPage() {
    const auth = await checkAuthAndRedirect();
    if (!auth) return;
    
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
            .order('id', { ascending: false });
            
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
                <td><img src="${v.imagenUrl || 'assets/coche-default.png'}" width="100" alt="thumb" style="border-radius: 4px;"></td>
                <td>${v.nombre}</td>
                <td>€ ${v.precio.toLocaleString('es-ES')}</td>
                <td>${v.tipo}</td>
                <td>
                    <button class="btn-admin-edit" data-id="${v.id}">Editar</button>
                    <button class="btn-admin-delete" data-id="${v.id}" data-name="${v.nombre}">Borrar</button>
                </td>
            `;
            tbody.appendChild(tr);

            // Añadir event listeners a los botones
            tr.querySelector('.btn-admin-edit').addEventListener('click', () => {
                alert(`WIP: Editar vehículo con ID: ${v.id}. (Función de edición aún no implementada)`);
                // Aquí llamarías a un modal o formulario de edición
            });

            tr.querySelector('.btn-admin-delete').addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const name = e.target.getAttribute('data-name');
                if (confirm(`¿Seguro que quieres borrar "${name}" (ID: ${id})?`)) {
                    deleteVehiculo(id);
                }
            });
        });

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6">Error al cargar: ${error.message}</td></tr>`;
    }
}

// Función helper para borrar vehículo (¡NUEVA!)
async function deleteVehiculo(id) {
    if (!id) return;
    try {
        const { error } = await supabase_admin
            .from('vehiculos')
            .delete()
            .match({ id: id });
        if (error) throw error;
        alert('Vehículo borrado con éxito.');
        loadVehiculosAdmin(); // Recargar la tabla
    } catch (error) {
        alert(`Error al borrar: ${error.message}`);
    }
}

// --- 4. PÁGINA: GESTIÓN DE MENSAJES ---

async function handleMensajesPage() {
    const auth = await checkAuthAndRedirect();
    if (!auth) return;
    
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