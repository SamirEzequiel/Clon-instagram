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
          statusText: response.statusText
        });

        if (!response.ok) {
          throw new Error('Error al dar like');
        }

        const data = await response.json();
        
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
        alert('Error al dar like');
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
  
        if (Array.isArray(posts)) {
          feedContainer.innerHTML = posts.map(post => {
            const recentComments = (post.comments || [])
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 2);
  
            return `
              <div class="max-w-md mx-auto bg-white rounded-lg shadow-md mb-8 border border-gray-200" data-post-id="${post.id}">
                <div class="flex items-center px-4 py-3">
                  <img class="h-10 w-10 rounded-full object-cover border" src="https://ui-avatars.com/api/?name=${encodeURIComponent(post.username || 'U')}" alt="avatar">
                  <div class="ml-3">
                    <span class="font-semibold block leading-tight">${post.username}</span>
                    <span class="text-xs text-gray-500">${new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <img class="w-full object-cover max-h-96" src="${post.imageUrl ? `http://localhost:5000${post.imageUrl}` : 'https://via.placeholder.com/400x400?text=Sin+imagen'}" alt="Imagen del post" onerror="this.src='https://via.placeholder.com/400x400?text=Error+al+cargar+imagen'">
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
        } else {
          feedContainer.innerHTML = '<p class="text-center text-gray-500">No hay posts para mostrar.</p>';
        }
      } catch (error) {
        feedContainer.innerHTML = '<p class="text-center text-red-500">Error al cargar los posts.</p>';
        console.error('Error al obtener los posts:', error);
      }
    }
  
    // Hacemos accesibles las funciones para los botones inline
    window.showCommentsModal = showCommentsModal;
    window.likePost = likePost;
  
    await loadPosts();
  });