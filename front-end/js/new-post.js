// Funciones para el manejo del modal
function openNewPostModal() {
    document.getElementById('newPostModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Previene el scroll del body
}

function closeNewPostModal() {
    document.getElementById('newPostModal').classList.add('hidden');
    document.body.style.overflow = 'auto'; // Restaura el scroll del body
    // Resetear el formulario
    document.getElementById('newPostForm').reset();
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('uploadPrompt').classList.remove('hidden');
}

// Previsualización de la imagen
function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            const prompt = document.getElementById('uploadPrompt');
            
            preview.src = e.target.result;
            preview.classList.remove('hidden');
            prompt.classList.add('hidden');
        }
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Manejo del formulario
document.getElementById('newPostForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const imageInput = document.getElementById('imageInput');
    const description = document.getElementById('description').value;
    
    // Validación mejorada de la imagen
    if (!imageInput || !imageInput.files || imageInput.files.length === 0) {
        alert('Por favor selecciona una imagen para tu publicación');
        return;
    }

    const imageFile = imageInput.files[0];

    // Validar el tipo de archivo
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validImageTypes.includes(imageFile.type)) {
        alert('Por favor selecciona un archivo de imagen válido (JPEG, PNG o GIF)');
        return;
    }

    // Validar tamaño del archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (imageFile.size > maxSize) {
        alert('La imagen es demasiado grande. El tamaño máximo permitido es 5MB');
        return;
    }
    
    // Obtener el usuario actual desde auth.js
    const currentUser = getCurrentUser();
    
    if (!currentUser || !currentUser.id) {
        alert('Debes iniciar sesión para crear una publicación');
        return;
    }

    // Mostrar indicador de carga
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
    submitButton.disabled = true;
    
    try {
        console.log('Enviando formulario...');
        console.log('Usuario actual:', currentUser);
        
        // Primero subir la imagen
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);
        
        const imageResponse = await fetch('http://localhost:5000/api/upload', {
            method: 'POST',
            body: imageFormData
        });
        
        if (!imageResponse.ok) {
            throw new Error('Error al subir la imagen');
        }
        
        const imageData = await imageResponse.json();
        
        // Luego crear el post con la URL de la imagen
        const postData = {
            description: description,
            userId: currentUser.id,
            username: currentUser.username,
            imageUrl: imageData.imageUrl
        };
        
        console.log('Datos del post:', postData);
        
        const response = await fetch('http://localhost:5000/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(postData)
        });
        
        console.log('Respuesta recibida:', response);
        
        // Verificar la respuesta
        if (!response.ok) {
            let errorMessage = 'Error al crear la publicación. Por favor intenta de nuevo.';
            try {
                const errorData = await response.json();
                console.log('Error data:', errorData);
                errorMessage = errorData.message;
                if (errorData.details) {
                    errorMessage += '\n' + errorData.details;
                }
            } catch (e) {
                console.error('Error al procesar la respuesta del servidor:', e);
            }
            throw new Error(errorMessage);
        }

        // Procesar respuesta exitosa
        const result = await response.json();
        closeNewPostModal();
        // Mostrar mensaje de éxito
        alert('¡Publicación creada con éxito!');
        // Recargar el feed para mostrar la nueva publicación
        location.reload();
    } catch (error) {
        console.error('Error completo:', error);
        alert(error.message || 'Error de conexión. Por favor intenta de nuevo.');
    } finally {
        // Restaurar el botón
        submitButton.innerHTML = originalButtonText;
        submitButton.disabled = false;
    }
});
