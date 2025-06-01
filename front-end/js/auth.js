// Funciones para manejar la autenticación del usuario
function setCurrentUser(user) {
    console.log('Guardando usuario:', user);
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser');
    }
}

function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    const parsedUser = user ? JSON.parse(user) : null;
    console.log('Usuario actual:', parsedUser);
    return parsedUser;
}

function isLoggedIn() {
    const user = getCurrentUser();
    const isLogged = user !== null;
    console.log('¿Usuario logueado?:', isLogged);
    return isLogged;
}

function logout() {
    console.log('Cerrando sesión');
    setCurrentUser(null);
    window.location.href = 'index.html';
}

// Exportar las funciones para uso global
window.setCurrentUser = setCurrentUser;
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
window.logout = logout;
