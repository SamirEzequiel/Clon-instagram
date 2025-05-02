# 📸 Clon Instagram
¡Bienvenido a nuestro Clon de Instagram! Esta aplicación te permite compartir momentos especiales, interactuar con otros usuarios y disfrutar de una experiencia similar a Instagram, desarrollada con tecnologías modernas para brindarte la mejor experiencia.

## 🚀 ¿Qué necesitas para empezar?
- Node.js (versión 14 o superior)
- npm o yarn
- MongoDB instalado y en ejecución
- Git para clonar el repositorio

## 📥 Guía de Instalación Rápida

### 1️⃣ Obtén el código
```bash
git clone [URL del repositorio]
cd clon-instagram
```

### 2️⃣ Instala las dependencias
```bash
npm install
```

### 3️⃣ Configura el entorno
Crea un archivo `.env` en la raíz del proyecto:
```env
MONGODB_URI=tu_uri_de_mongodb
PORT=3000
```

### 4️⃣ ¡Pon todo en marcha!
```bash
npm start
```

¡Listo! 🎉 Ahora puedes acceder a:
- Aplicación principal: http://localhost:3000
- API REST: http://localhost:3000/api

## 🛠️ Tecnologías que usamos
- **Node.js** - El motor de nuestro backend
- **Express.js** - Framework web rápido y minimalista
- **MongoDB** - Base de datos NoSQL para almacenar todo el contenido
- **Mongoose** - ODM para MongoDB
- **CORS** - Para la comunicación entre frontend y backend
- **dotenv** - Gestión de variables de entorno

## 📁 ¿Cómo está organizado?
El proyecto está estructurado de manera clara y modular:

```
clon-instagram/
├── frontend/     # Interfaz de usuario
├── backend/      # Servidor y API REST
├── package.json  # Dependencias y scripts
└── .env         # Configuración de variables de entorno
```

## 💡 Consejos importantes
- Asegúrate de tener MongoDB en ejecución antes de iniciar el servidor
- Usa un entorno virtual para mantener tu proyecto aislado
- Mantén actualizadas tus dependencias
- Sigue las guías de estilo del código

## 🤝 ¿Quieres contribuir?
¡Las contribuciones son bienvenidas! Por favor:
1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia
Este proyecto está bajo la Licencia MIT.

¿Tienes dudas? ¡No dudes en abrir un issue en el repositorio! 🤝
