// Manejo de la sesión del usuario
const currentUser = {
    id: "680eedffe1b02cca8875c17a",
    username: "juan",
    avatarUrl: null
};

// Función para obtener el usuario actual
function getCurrentUser() {
    return currentUser;
}

// Función para verificar si hay un usuario en sesión
function isLoggedIn() {
    return true; // Por ahora siempre retorna true ya que tenemos un usuario fijo
}

// Exportar las funciones para usarlas en otros archivos
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
