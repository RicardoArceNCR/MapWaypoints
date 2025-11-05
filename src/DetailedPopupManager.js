// ========= MÓDULO PARA POPUPS DETALLADOS =========
// Este módulo maneja la visualización de hotspots con estructura detallada

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
    
    // Event listeners
    this.initEventListeners();
  }
  
  initEventListeners() {
    // Cerrar popups
    this.popupSimpleClose?.addEventListener('click', () => this.closeAll());
    this.popupDetailedClose?.addEventListener('click', () => this.closeAll());
    this.backdrop?.addEventListener('click', () => this.closeAll());
    
    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && (!this.popupSimple.hidden || !this.popupDetailed.hidden)) {
        this.closeAll();
      }
    });
  }
  
  /**
   * Detecta si un hotspot tiene estructura detallada
   */
  isDetailedHotspot(hotspot) {
    return !!(
      hotspot.datetime ||
      hotspot.location ||
      hotspot.description ||
      hotspot.involved ||
      hotspot.echos ||
      hotspot.image
    );
  }
  
  /**
   * Abre el popup apropiado según el tipo de hotspot
   */
  openPopup(hotspot) {
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
    this.closeAll();
    
    if (this.popupSimpleTitle) this.popupSimpleTitle.textContent = hotspot.title || '';
    if (this.popupSimpleBody) this.popupSimpleBody.textContent = hotspot.body || '';
    
    if (this.popupSimple) this.popupSimple.hidden = false;
    if (this.backdrop) this.backdrop.hidden = false;
  }
  
  /**
   * Abre el popup detallado (nueva estructura)
   */
  openDetailedPopup(hotspot) {
    this.closeAll();
    this.currentHotspot = hotspot;
    
    // Título
    if (this.popupDetailedTitle) {
      this.popupDetailedTitle.textContent = hotspot.title || '';
    }
    
    // Imagen
    if (this.popupDetailedImage) {
      if (hotspot.image) {
        this.popupDetailedImage.src = hotspot.image;
        this.popupDetailedImage.alt = hotspot.title || '';
        if (this.popupDetailedImage.parentElement) {
          this.popupDetailedImage.parentElement.style.display = 'block';
        }
      } else if (this.popupDetailedImage.parentElement) {
        this.popupDetailedImage.parentElement.style.display = 'none';
      }
    }
    
    // Fecha y hora
    if (hotspot.datetime) {
      if (this.popupDetailedDate) this.popupDetailedDate.textContent = hotspot.datetime.date || '';
      if (this.popupDetailedTime) {
        this.popupDetailedTime.textContent = hotspot.datetime.time || '';
        
        // Aplicar color personalizado a la hora
        if (hotspot.datetime.timeColor) {
          this.popupDetailedTime.style.color = hotspot.datetime.timeColor;
        }
      }
    }
    
    // Ubicación
    if (this.popupDetailedLocation) {
      if (hotspot.location) {
        this.popupDetailedLocation.textContent = hotspot.location;
        this.popupDetailedLocation.style.display = 'block';
      } else {
        this.popupDetailedLocation.style.display = 'none';
      }
    }
    
    // Descripción
    if (this.popupDetailedDescription) {
      if (hotspot.description) {
        this.popupDetailedDescription.textContent = hotspot.description;
        this.popupDetailedDescription.style.display = 'block';
      } else {
        this.popupDetailedDescription.style.display = 'none';
      }
    }
    
    // Personas implicadas
    if (this.popupDetailedInvolvedSection) {
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
        if (this.popupDetailedEchosSection) {
          this.popupDetailedEchosSection.hidden = true;
        }
      }
    }
    
    // Mostrar popup
    if (this.popupDetailed) this.popupDetailed.hidden = false;
    if (this.backdrop) this.backdrop.hidden = false;
  }
  
  /**
   * Renderiza la lista de personas implicadas
   */
  renderInvolved(involved) {
    if (!this.popupDetailedInvolved) return;
    
    this.popupDetailedInvolved.innerHTML = '';
    
    if (!Array.isArray(involved)) return;
    
    involved.forEach(person => {
      if (!person || !person.id) return;
      
      const personEl = document.createElement('div');
      personEl.className = 'popup-detailed__person';
      personEl.dataset.personId = person.id;
      
      // Marcar como activa si está seleccionada
      if (person.id === this.selectedPersonId || person.highlighted) {
        personEl.classList.add('active');
      }
      
      // Sanitize input to prevent XSS
      const safeName = person.name ? String(person.name).replace(/[<>]/g, '') : '';
      const safeRole = person.role ? String(person.role).replace(/[<>]/g, '') : '';
      const safeAvatar = person.avatar ? String(person.avatar).replace(/[<>"]/g, '') : './assets/default.webp';
      
      personEl.innerHTML = `
        <div class="popup-detailed__person-avatar-wrapper">
          <img 
            src="${safeAvatar}" 
            alt="${safeName}"
            class="popup-detailed__person-avatar"
          />
        </div>
        <div class="popup-detailed__person-name">${safeName}</div>
        ${safeRole ? `<div class="popup-detailed__person-role">${safeRole}</div>` : ''}
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
    
    // Actualizar clases activas
    this.popupDetailedInvolved.querySelectorAll('.popup-detailed__person').forEach(el => {
      el.classList.toggle('active', el.dataset.personId === personId);
    });
    
    // Actualizar echos
    this.updateEchos();
  }
  
  /**
   * Actualiza la sección de echos para la persona seleccionada
   */
  updateEchos() {
    if (!this.popupDetailedEchosSection) return;
    
    // Hide echos section by default
    this.popupDetailedEchosSection.hidden = true;
    
    if (!this.currentHotspot || !this.currentHotspot.echos || !this.selectedPersonId) {
      return;
    }
    
    const echos = this.currentHotspot.echos[this.selectedPersonId];
    
    if (!echos || !Array.isArray(echos) || echos.length === 0) {
      return;
    }
    
    // Update echos title if element exists
    if (this.popupDetailedEchosTitle) {
      const selectedPerson = this.currentHotspot.involved?.find(p => p.id === this.selectedPersonId);
      if (selectedPerson) {
        // Sanitize name to prevent XSS
        const safeName = String(selectedPerson.name || '').replace(/[<>]/g, '');
        this.popupDetailedEchosTitle.textContent = `Echos de ${safeName}:`;
      } else {
        this.popupDetailedEchosTitle.textContent = 'Echos:';
      }
    }
    
    // Render echos if container exists
    if (this.popupDetailedEchos) {
      this.popupDetailedEchos.innerHTML = '';
      
      echos.forEach(echo => {
        if (!echo) return;
        
        const echoEl = document.createElement('div');
        echoEl.className = 'popup-detailed__echo';
        
        // Sanitize all user-provided content
        const safeDate = echo.datetime?.date ? String(echo.datetime.date).replace(/[<>]/g, '') : '';
        const safeTime = echo.datetime?.time ? String(echo.datetime.time).replace(/[<>]/g, '') : '';
        const safeDescription = echo.description ? String(echo.description).replace(/[<>]/g, '') : '';
        
        echoEl.innerHTML = `
          <div class="popup-detailed__echo-datetime">
            <span class="popup-detailed__echo-date">${safeDate}</span>
            <span class="popup-detailed__echo-time">${safeTime}</span>
          </div>
          <div class="popup-detailed__echo-description">${safeDescription}</div>
        `;
        
        this.popupDetailedEchos.appendChild(echoEl);
      });
      
      this.popupDetailedEchosSection.hidden = false;
    }
  }
  
  /**
   * Cierra todos los popups
   */
  closeAll() {
    if (this.popupSimple) this.popupSimple.hidden = true;
    if (this.popupDetailed) this.popupDetailed.hidden = true;
    if (this.backdrop) this.backdrop.hidden = true;
    
    this.currentHotspot = null;
    this.selectedPersonId = null;
    
    // Reset styles if element exists
    if (this.popupDetailedTime) {
      this.popupDetailedTime.style.color = '';
    }
  }
  
  /**
   * Verifica si algún popup está abierto
   */
  isOpen() {
    return !this.popupSimple.hidden || !this.popupDetailed.hidden;
  }
}