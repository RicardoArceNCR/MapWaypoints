// ========= MÓDULO PARA POPUPS DETALLADOS MEJORADO =========
// Este módulo maneja la visualización de hotspots con estructura detallada
// Versión mejorada con mejor soporte responsive y UX

export class DetailedPopupManager {
  constructor() {
    // Referencias DOM - Popup simple
    this.popupSimple = document.getElementById('popup');
    this.popupSimpleTitle = document.getElementById('popup-title');
    this.popupSimpleBody = document.getElementById('popup-body');
    this.popupSimpleClose = document.getElementById('popup-close');
    
    // Referencias DOM - Popup detallado
    this.popupDetailed = document.getElementById('popup-detailed');
    this.popupDetailedClose = document.getElementById('popup-detailed-close');
    this.popupDetailedImage = document.getElementById('popup-detailed-image');
    this.popupDetailedTitle = document.getElementById('popup-detailed-title');
    this.popupDetailedDate = document.getElementById('popup-detailed-date');
    this.popupDetailedTime = document.getElementById('popup-detailed-time');
    this.popupDetailedLocation = document.getElementById('popup-detailed-location');
    this.popupDetailedDescription = document.getElementById('popup-detailed-description');
    this.popupDetailedInvolved = document.getElementById('popup-detailed-involved');
    this.popupDetailedInvolvedSection = document.getElementById('popup-detailed-involved-section');
    this.popupDetailedEchos = document.getElementById('popup-detailed-echos');
    this.popupDetailedEchosSection = document.getElementById('popup-detailed-echos-section');
    this.popupDetailedEchosTitle = document.getElementById('popup-detailed-echos-title');
    
    // Backdrop compartido
    this.backdrop = document.getElementById('popup-backdrop');
    
    // Estado
    this.currentHotspot = null;
    this.selectedPersonId = null;
    this.touchStartY = 0;
    this.touchCurrentY = 0;
    this.isDragging = false;
    this.closeTimeout = null;          // 🆕 timeout para animación de cierre
    
    // Detectar si es dispositivo móvil (antes de listeners)
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Event listeners
    this.initEventListeners();
  }
  
  initEventListeners() {
    // Cerrar popups
    this.popupSimpleClose?.addEventListener('click', () => this.closeAll());
    this.popupDetailedClose?.addEventListener('click', () => this.closeAll());
    
    // Cerrar solo si el click fue directamente en el fondo,
    // no dentro de la tarjeta
    this.backdrop?.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.closeAll();
      }
    });
    
    // Evitar que los clicks dentro del popup lleguen al backdrop
    this.popupSimple?.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    this.popupDetailed?.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && (!this.popupSimple.hidden || !this.popupDetailed.hidden)) {
        this.closeAll();
      }
    });
    
    // Gesto de deslizar hacia abajo en mobile
    if (this.isMobile && this.popupDetailed) {
      this.initSwipeToClose();
    }
    
    // Prevenir scroll del body cuando el popup está abierto
    this.backdrop?.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }
  
  initSwipeToClose() {
    const handle = this.popupDetailed.querySelector('.popup-detailed__drag-handle');
    if (!handle) return;
    
    handle.addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
      this.isDragging = true;
      this.popupDetailed.style.transition = 'none';
    });
    
    handle.addEventListener('touchmove', (e) => {
      if (!this.isDragging) return;
      
      this.touchCurrentY = e.touches[0].clientY;
      const deltaY = this.touchCurrentY - this.touchStartY;
      
      if (deltaY > 0) {
        this.popupDetailed.style.transform = `translateY(${deltaY}px)`;
      }
    });
    
    handle.addEventListener('touchend', () => {
      if (!this.isDragging) return;
      
      const deltaY = this.touchCurrentY - this.touchStartY;
      this.popupDetailed.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      
      if (deltaY > 100) {
        this.closeAll();
      } else {
        this.popupDetailed.style.transform = 'translateY(0)';
      }
      
      this.isDragging = false;
      this.touchStartY = 0;
      this.touchCurrentY = 0;
    });
  }
  
  /**
   * Detecta si un hotspot tiene estructura detallada
   */
  isDetailedHotspot(hotspot) {
    return !!(
      hotspot.datetime ||
      hotspot.location ||
      hotspot.involved ||
      hotspot.echos ||
      hotspot.image
    );
  }

  /**
   * API explícita desde Canvas: recibe el objeto hotspot (world/coords/meta)
   */
  openFromHotspot(hs) {
    if (!hs) return;
    // Normaliza payload mínimo
    const data = {
      id:    hs.id || hs.key,
      title: hs.title || hs.meta?.title || hs.text || '',
      body:  hs.body  || hs.meta?.description || hs.description || '',
      image: hs.image || hs.meta?.media || null,
      datetime: hs.datetime,
      location: hs.location,
      involved: hs.involved,
      echos:    hs.echos
    };
    // Reusa la ruta actual: decide si es detallado o simple
    this.openPopup(data);
  }

  /**
   * Abre el popup apropiado según el tipo de hotspot
   */
  openPopup(hotspot) {
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    
    if (this.isDetailedHotspot(hotspot)) {
      this.openDetailedPopup(hotspot);
    } else {
      this.openSimplePopup(hotspot);
    }
  }
  
  /**
   * Abre el popup simple (estructura original)
   */
  openSimplePopup(hotspot) {
    // Cancelar cualquier cierre pendiente
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }

    // Asegurar que el detallado está oculto
    if (this.popupDetailed) {
      this.popupDetailed.classList.remove('popup--visible');
      this.popupDetailed.hidden = true;
    }

    this.popupSimpleTitle.textContent = hotspot.title || '';
    this.popupSimpleBody.textContent = hotspot.body || '';

    this.backdrop.hidden = false;
    this.popupSimple.hidden = false;

    // Añadir clase para animación
    requestAnimationFrame(() => {
      this.popupSimple.classList.add('popup--visible');
      this.backdrop.classList.add('popup-backdrop--visible');
    });
  }
  
  /**
   * Abre el popup detallado (nueva estructura)
   */
  openDetailedPopup(hotspot) {
    // Cancelar cualquier cierre pendiente
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }

    // Asegurar que el simple está oculto
    if (this.popupSimple) {
      this.popupSimple.classList.remove('popup--visible');
      this.popupSimple.hidden = true;
    }

    this.currentHotspot = hotspot;
    
    // Título
    this.popupDetailedTitle.textContent = hotspot.title || '';
    
    // Imagen con overlay gradient
    if (hotspot.image) {
      this.popupDetailedImage.src = hotspot.image;
      this.popupDetailedImage.alt = hotspot.title || '';
      const imageWrapper = this.popupDetailedImage.parentElement;
      imageWrapper.style.display = 'block';
      
      // Añadir overlay gradient para mobile
      if (!imageWrapper.querySelector('.popup-detailed__image-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'popup-detailed__image-overlay';
        imageWrapper.appendChild(overlay);
      }
    } else {
      this.popupDetailedImage.parentElement.style.display = 'none';
    }
    
    // Fecha y hora con formato mejorado
    if (hotspot.datetime) {
      this.popupDetailedDate.textContent = hotspot.datetime.date || '';
      this.popupDetailedTime.textContent = hotspot.datetime.time || '';
      
      // Aplicar color personalizado a la hora
      if (hotspot.datetime.timeColor) {
        this.popupDetailedTime.style.color = hotspot.datetime.timeColor;
      }
      
      // Mostrar contenedor de datetime
      const datetimeContainer = this.popupDetailedDate.parentElement;
      if (datetimeContainer) {
        datetimeContainer.style.display = 'flex';
      }
    } else {
      const datetimeContainer = this.popupDetailedDate.parentElement;
      if (datetimeContainer) {
        datetimeContainer.style.display = 'none';
      }
    }
    
    // Ubicación con ícono
    if (hotspot.location) {
      this.popupDetailedLocation.innerHTML = `
        <svg class="popup-detailed__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
        </svg>
        <span>${hotspot.location}</span>
      `;
      this.popupDetailedLocation.style.display = 'flex';
    } else {
      this.popupDetailedLocation.style.display = 'none';
    }
    
    // Descripción
    if (hotspot.description) {
      this.popupDetailedDescription.textContent = hotspot.description;
      this.popupDetailedDescription.style.display = 'block';
    } else {
      this.popupDetailedDescription.style.display = 'none';
    }
    
    // Personas implicadas
    if (hotspot.involved && hotspot.involved.length > 0) {
      this.renderInvolved(hotspot.involved);
      this.popupDetailedInvolvedSection.hidden = false;
      
      // Seleccionar automáticamente la persona resaltada o la primera
      const highlighted = hotspot.involved.find(p => p.highlighted);
      const firstPerson = hotspot.involved[0];
      this.selectedPersonId = highlighted ? highlighted.id : firstPerson.id;
      
      // Actualizar echos para la persona seleccionada
      this.updateEchos();
    } else {
      this.popupDetailedInvolvedSection.hidden = true;
      this.popupDetailedEchosSection.hidden = true;
    }
    
    // Mostrar popup
    this.popupDetailed.hidden = false;
    this.backdrop.hidden = false;
    
    // Añadir clases para animación
    requestAnimationFrame(() => {
      this.popupDetailed.classList.add('popup--visible');
      this.backdrop.classList.add('popup-backdrop--visible');
    });
    
    // Resetear scroll del contenido
    const content = this.popupDetailed.querySelector('.popup-detailed__content');
    if (content) {
      content.scrollTop = 0;
    }
  }
  
  /**
   * Renderiza la lista de personas implicadas
   */
  renderInvolved(involved) {
    this.popupDetailedInvolved.innerHTML = '';
    
    involved.forEach(person => {
      const personEl = document.createElement('div');
      personEl.className = 'popup-detailed__person';
      personEl.dataset.personId = person.id;
      
      // Marcar como activa si está seleccionada
      if (person.id === this.selectedPersonId || person.highlighted) {
        personEl.classList.add('active');
      }
      
      personEl.innerHTML = `
        <div class="popup-detailed__person-avatar-wrapper">
          <img 
            src="${person.avatar || './assets/default.webp'}" 
            alt="${person.name}"
            class="popup-detailed__person-avatar"
            loading="lazy"
          />
          ${person.highlighted ? '<span class="popup-detailed__person-badge">★</span>' : ''}
        </div>
        <div class="popup-detailed__person-info">
          <div class="popup-detailed__person-name">${person.name}</div>
          ${person.role ? `<div class="popup-detailed__person-role">${person.role}</div>` : ''}
        </div>
      `;
      
      // Click para seleccionar persona
      personEl.addEventListener('click', () => {
        this.selectPerson(person.id);
      });
      
      this.popupDetailedInvolved.appendChild(personEl);
    });
  }
  
  /**
   * Selecciona una persona y actualiza los echos
   */
  selectPerson(personId) {
    this.selectedPersonId = personId;
    
    // Actualizar clases activas con animación
    this.popupDetailedInvolved.querySelectorAll('.popup-detailed__person').forEach(el => {
      if (el.dataset.personId === personId) {
        el.classList.add('active');
        // Pequeña animación de pulso
        el.classList.add('popup-detailed__person--pulse');
        setTimeout(() => {
          el.classList.remove('popup-detailed__person--pulse');
        }, 300);
      } else {
        el.classList.remove('active');
      }
    });
    
    // Actualizar echos
    this.updateEchos();
  }
  
  /**
   * Actualiza la sección de echos para la persona seleccionada
   */
  updateEchos() {
    if (!this.currentHotspot || !this.currentHotspot.echos || !this.selectedPersonId) {
      this.popupDetailedEchosSection.hidden = true;
      return;
    }
    
    const echos = this.currentHotspot.echos[this.selectedPersonId];
    
    if (!echos || echos.length === 0) {
      this.popupDetailedEchosSection.hidden = true;
      return;
    }
    
    // Actualizar título de echos
    const selectedPerson = this.currentHotspot.involved?.find(p => p.id === this.selectedPersonId);
    if (selectedPerson) {
      this.popupDetailedEchosTitle.textContent = `Echos de ${selectedPerson.name}:`;
    } else {
      this.popupDetailedEchosTitle.textContent = 'Echos:';
    }
    
    // Renderizar echos con animación de entrada
    this.popupDetailedEchos.innerHTML = '';
    
    echos.forEach((echo, index) => {
      const echoEl = document.createElement('div');
      echoEl.className = 'popup-detailed__echo';
      echoEl.style.animationDelay = `${index * 0.05}s`;
      
      echoEl.innerHTML = `
        <div class="popup-detailed__echo-header">
          <div class="popup-detailed__echo-datetime">
            <span class="popup-detailed__echo-date">${echo.datetime?.date || ''}</span>
            <span class="popup-detailed__echo-time">${echo.datetime?.time || ''}</span>
          </div>
        </div>
        <div class="popup-detailed__echo-description">${echo.description || ''}</div>
      `;
      
      this.popupDetailedEchos.appendChild(echoEl);
    });
    
    this.popupDetailedEchosSection.hidden = false;
  }
  
  /**
   * Cierra todos los popups
   */
  closeAll() {
    // Cancelar timeout anterior si existe
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }

    // Quitar clases visibles para disparar animación
    this.popupSimple.classList.remove('popup--visible');
    this.popupDetailed.classList.remove('popup--visible');
    this.backdrop.classList.remove('popup-backdrop--visible');

    // Esperar a que termine la animación antes de ocultar
    this.closeTimeout = setTimeout(() => {
      this.popupSimple.hidden = true;
      this.popupDetailed.hidden = true;
      this.backdrop.hidden = true;
      
      // Resetear transform del popup detallado
      if (this.popupDetailed) {
        this.popupDetailed.style.transform = '';
      }
      
      // Restaurar scroll del body
      document.body.style.overflow = '';
      
      this.currentHotspot = null;
      this.selectedPersonId = null;
      this.popupDetailedTime.style.color = '';

      this.closeTimeout = null;
    }, 300);
  }
  
  /**
   * Verifica si algún popup está abierto
   */
  isOpen() {
    return !this.popupSimple.hidden || !this.popupDetailed.hidden;
  }
}
