const fs = require('fs');
const bcrypt = require('bcryptjs');
const usersFile = './models/users.json';

function register(req, res) {
    const { username, email, password } = req.body;

    // Validaciones básicas
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    // Cargar usuarios existentes
    let users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));

    // Verificar si ya existe el email
    if (users.find(user => user.email === email)) {
        return res.status(400).json({ message: 'El email ya está registrado.' });
    }

    // Encriptar contraseña
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Crear nuevo usuario
    const newUser = { id: Date.now(), username, email, password: hashedPassword };
    users.push(newUser);

    // Guardar usuarios actualizados
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    res.status(201).json({ message: 'Usuario registrado exitosamente.' });
}

function login(req, res) {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
        return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    // Cargar usuarios
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));

    // Buscar usuario
    const user = users.find(user => user.email === email);
    if (!user) {
        return res.status(400).json({ message: 'Usuario no encontrado.' });
    }

    // Verificar contraseña
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Contraseña incorrecta.' });
    }

    res.json({ message: 'Inicio de sesión exitoso.', username: user.username });
}

module.exports = { register, login };
