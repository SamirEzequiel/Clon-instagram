document.addEventListener('DOMContentLoaded', async () => {
    const feedContainer = document.getElementById('feed');
    const modal = document.createElement('div');
    modal.id = 'comments-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
    document.body.appendChild(modal);

    // Obtener el usuario actual
    const currentUser = window.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      feedContainer.innerHTML = '<p class="text-center text-red-500">Debes iniciar sesión para ver el feed.</p>';
      return;
    }
    const userId = currentUser.id;

    // Cierra el modal de comentarios
    function closeModal() {
      modal.classList.add('hidden');
      modal.innerHTML = '';
    }

  
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  
    // Dar like a un post
    async function likePost(postId) {
      try {
        const currentUser = getCurrentUser();

        if (!currentUser || !currentUser.id) {
          alert('Debes iniciar sesión para dar like');
          return;
        }

        const likeButton = document.querySelector(`[data-post-id="${postId}"] .like-button`);
        const likeCount = document.querySelector(`[data-post-id="${postId}"] .like-count`);
        const likesList = document.querySelector(`[data-post-id="${postId}"] .likes-list`);

        console.log('Intentando dar like al post:', postId);
        console.log('Usuario actual:', currentUser);

        const url = `http://localhost:5000/api/posts/${postId}/like`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            userId: currentUser.id,
            username: currentUser.username
          })
        });

        console.log('Respuesta del servidor:', {
          status: response.status,
          statusText: response.statusText,
          url: url
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al dar like');
        }

        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        // Actualizar el botón de like según si el usuario actual ya dio like
        if (data.likeDetails && data.likeDetails.some(like => like.userId === currentUser.id)) {
          likeButton.classList.add('text-red-500');
        } else {
          likeButton.classList.remove('text-red-500');
        }

        // Actualizar el contador de likes
        likeCount.textContent = data.likes === 1 ? '1 Me gusta' : `${data.likes} Me gusta`;

        // Mostrar la lista de usuarios que dieron like
        if (likesList) {
          const likeDetails = data.likeDetails || [];
          likesList.innerHTML = likeDetails.length > 0
            ? '<span class="text-xs text-gray-500">Le gusta a: </span>' +
              likeDetails.map(like => `<span class="font-semibold">${like.username}</span>`).join(', ')
            : '<span class="text-xs text-gray-400">Nadie ha dado like aún</span>';
        } else {
          // Si no existe el contenedor, lo creamos debajo del contador
          const newLikesList = document.createElement('div');
          newLikesList.className = 'likes-list text-xs text-gray-500 mt-1';
          const likeDetails = data.likeDetails || [];
          newLikesList.innerHTML = likeDetails.length > 0
            ? '<span class="text-xs text-gray-500">Le gusta a: </span>' +
              likeDetails.map(like => `<span class="font-semibold">${like.username}</span>`).join(', ')
            : '<span class="text-xs text-gray-400">Nadie ha dado like aún</span>';
          likeCount.parentNode.appendChild(newLikesList);
        }

      } catch (error) {
        console.error('Error al dar like:', error);
        alert('Error al dar like: ' + error.message);
      }
    }
  
    // Agregar comentario a un post
    async function addComment(postId, commentText, userId) {
      try {
        await fetch(`http://localhost:5000/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, text: commentText })
        });
        await loadPosts();
      } catch (error) {
        alert('Error al agregar comentario');
        console.error(error);
      }
    }
  
    // Mostrar modal con todos los comentarios y formulario para agregar uno nuevo
    function showCommentsModal(post) {
      modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
          <button class="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-2xl" id="close-modal">&times;</button>
          <h2 class="text-xl font-bold mb-4">Comentarios de <span class="text-blue-600">${post.title}</span></h2>
          <div class="max-h-64 overflow-y-auto mb-4">
            ${post.comments && post.comments.length > 0 ? post.comments.map(c => `
              <div class="mb-2 border-b pb-1">
                <span class="font-semibold">${c.user?.username || 'Anónimo'}:</span>
                <span>${c.text}</span>
                <span class="text-xs text-gray-400 ml-2">${new Date(c.createdAt).toLocaleString()}</span>
              </div>
            `).join('') : '<span class="text-gray-400">Sin comentarios</span>'}
          </div>
          <form id="comment-form" class="flex">
            <input type="text" id="comment-input" class="flex-1 border rounded-l px-2 py-1" placeholder="Agrega un comentario..." required>
            <button type="submit" class="bg-blue-500 text-white px-4 py-1 rounded-r">Comentar</button>
          </form>
        </div>
      `;
      modal.classList.remove('hidden');
      document.getElementById('close-modal').onclick = closeModal;
      document.getElementById('comment-form').onsubmit = async (e) => {
        e.preventDefault();
        const commentText = document.getElementById('comment-input').value;
        await addComment(post._id, commentText, userId);
        closeModal();
      };
    }
  
    // Cargar y renderizar los posts
    async function loadPosts() {
      try {
        const response = await fetch('http://localhost:5000/api/posts');
        const posts = await response.json();
        const currentUser = getCurrentUser();
  
        console.log('Posts cargados:', posts);
        console.log('Usuario actual:', currentUser);
  
        if (Array.isArray(posts)) {
          feedContainer.innerHTML = posts.map(post => {
            const recentComments = (post.comments || [])
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 2);
  
            console.log('Renderizando post:', post);
            console.log('¿Es el propietario del post?:', post.userId === currentUser?.id);
  
            return `
              <div class="max-w-md mx-auto bg-white rounded-lg shadow-md mb-8 border border-gray-200" data-post-id="${post.id}">
                <div class="flex items-center justify-between px-4 py-3">
                  <div class="flex items-center">
                    <img class="h-10 w-10 rounded-full object-cover border" src="https://ui-avatars.com/api/?name=${encodeURIComponent(post.username || 'U')}" alt="avatar">
                    <div class="ml-3">
                      <span class="font-semibold block leading-tight">${post.username}</span>
                      <span class="text-xs text-gray-500">${new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div style="position: relative;">
                  ${post.imageUrl ? `
                    <img class="w-full object-cover max-h-96" 
                         src="http://localhost:5000${post.imageUrl}" 
                         alt="Imagen del post" 
                         onerror="this.parentElement.innerHTML = '<div class=\'w-full h-96 bg-gray-200 flex items-center justify-center\'><span class=\'text-gray-500\'>Error al cargar la imagen</span></div>'">
                  ` : `
                    <div class="w-full h-96 bg-gray-200 flex items-center justify-center">
                      <span class="text-gray-500">Sin imagen</span>
                    </div>
                  `}
                  ${post.userId === currentUser?.id ? `
                    <button style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 1000;" onclick="togglePostMenu('${post.id}')">
                      <i class="fas fa-ellipsis-h"></i>
                    </button>
                    <div id="post-menu-${post.id}" style="position: absolute; top: 45px; right: 10px; background: white; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 8px 0; min-width: 120px; display: none; z-index: 1000;">
                      <button style="width: 100%; padding: 8px 16px; text-align: left; display: flex; align-items: center; gap: 8px;" onclick="editPost('${post.id}')">
                        <i class="fas fa-edit"></i>
                        <span>Editar</span>
                      </button>
                      <button style="width: 100%; padding: 8px 16px; text-align: left; display: flex; align-items: center; gap: 8px; color: red;" onclick="deletePost('${post.id}')">
                        <i class="fas fa-trash-alt"></i>
                        <span>Eliminar</span>
                      </button>
                    </div>
                  ` : ''}
                </div>
                <div class="flex items-center px-4 py-2">
                  <button class="text-2xl mr-2 focus:outline-none like-button ${post.likes && Array.isArray(post.likes) && post.likes.includes(getCurrentUser()?.id) ? 'text-red-500' : ''}" onclick="likePost('${post.id}')">❤️</button>
                  <span class="font-semibold like-count">${Array.isArray(post.likes) ? post.likes.length : 0} Me gusta</span>
                </div>
                <div class="px-4 py-2">
                  <span class="font-semibold">${post.username}:</span>
                  <span>${post.description}</span>
                </div>
                <div class="px-4 py-2">
                  <div class="text-sm text-gray-600 mb-1">Comentarios recientes:</div>
                  ${recentComments.length > 0 ? recentComments.map(c => `
                    <div class="mb-1">
                      <span class="font-semibold">${c.user?.username || 'Anónimo'}:</span>
                      <span>${c.text}</span>
                    </div>
                  `).join('') : '<span class="text-gray-400">Sin comentarios</span>'}
                  <button class="text-blue-500 mt-2 underline" onclick='showCommentsModal(${JSON.stringify(post)})'>Ver todos los comentarios</button>
                </div>
              </div>
            `;
          }).join('');

          // Agregar event listener para cerrar menús al hacer clic fuera
          document.addEventListener('click', (e) => {
            if (!e.target.closest('.post-menu-button')) {
              document.querySelectorAll('[id^="post-menu-"]').forEach(menu => {
                menu.classList.add('hidden');
              });
            }
          });
        } else {
          feedContainer.innerHTML = '<p class="text-center text-gray-500">No hay posts para mostrar.</p>';
        }
      } catch (error) {
        feedContainer.innerHTML = '<p class="text-center text-red-500">Error al cargar los posts.</p>';
        console.error('Error al obtener los posts:', error);
      }
    }
  
    // Función para mostrar/ocultar el menú de opciones del post
    function togglePostMenu(postId) {
      const menu = document.getElementById(`post-menu-${postId}`);
      const allMenus = document.querySelectorAll('[id^="post-menu-"]');
      
      // Cerrar todos los demás menús
      allMenus.forEach(m => {
        if (m.id !== `post-menu-${postId}`) {
          m.style.display = 'none';
        }
      });
      
      // Alternar la visibilidad del menú actual
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }

    // Función para editar un post
    async function editPost(postId) {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          alert('Debes iniciar sesión para editar una publicación');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/posts/${postId}`);
        if (!response.ok) {
          throw new Error('Error al cargar la publicación');
        }
        
        const post = await response.json();
        
        // Verificar que el usuario sea el propietario del post
        if (post.userId !== currentUser.id) {
          alert('No tienes permiso para editar esta publicación');
          return;
        }
        
        // Crear modal de edición
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
          <div class="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 class="text-xl font-bold mb-4">Editar publicación</h2>
            <form id="editPostForm" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea id="editDescription" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" rows="3">${post.description}</textarea>
              </div>
              <div class="flex justify-end space-x-3">
                <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  Cancelar
                </button>
                <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600">
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Manejar el envío del formulario
        document.getElementById('editPostForm').onsubmit = async (e) => {
          e.preventDefault();
          const description = document.getElementById('editDescription').value;
          
          try {
            const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                description,
                userId: currentUser.id
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Error al actualizar la publicación');
            }

            modal.remove();
            await loadPosts(); // Recargar los posts
            alert('Publicación actualizada exitosamente');
          } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al actualizar la publicación');
          }
        };
      } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar la publicación');
      }
    }

    // Función para eliminar un post
    async function deletePost(postId) {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          alert('Debes iniciar sesión para eliminar una publicación');
          return;
        }

        if (!confirm('¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.')) {
          return;
        }
        
        const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: currentUser.id })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al eliminar la publicación');
        }

        await loadPosts(); // Recargar los posts
        alert('Publicación eliminada exitosamente');
      } catch (error) {
        console.error('Error:', error);
        alert(error.message || 'Error al eliminar la publicación');
      }
    }
  
    // Hacemos accesibles las funciones para los botones inline
    window.showCommentsModal = showCommentsModal;
    window.likePost = likePost;
    window.togglePostMenu = togglePostMenu;
    window.editPost = editPost;
    window.deletePost = deletePost;
  
    // Función para crear un nuevo post
    async function createPost(formData) {
      try {
        const currentUser = getCurrentUser();
        console.log('Usuario actual al crear post:', currentUser);

        if (!currentUser || !currentUser.id) {
          throw new Error('No hay usuario logueado');
        }

        const response = await fetch('http://localhost:5000/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            description: formData.get('description'),
            userId: currentUser.id,
            username: currentUser.username,
            imageUrl: formData.get('imageUrl')
          })
        });

        console.log('Respuesta del servidor:', response);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al crear el post');
        }

        await loadPosts();
        return true;
      } catch (error) {
        console.error('Error al crear post:', error);
        alert(error.message);
        return false;
      }
    }

    // Función para manejar el envío del formulario de nuevo post
    document.getElementById('newPostForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const currentUser = getCurrentUser();
      
      console.log('Datos del formulario:', {
        description: formData.get('description'),
        userId: currentUser?.id,
        username: currentUser?.username
      });

      if (!currentUser || !currentUser.id) {
        alert('Debes iniciar sesión para publicar');
        return;
      }

      const success = await createPost(formData);
      if (success) {
        closeNewPostModal();
        e.target.reset();
      }
    });
  
    await loadPosts();
  });