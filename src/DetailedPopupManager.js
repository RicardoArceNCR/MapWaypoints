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
    
    this.popupSimpleTitle.textContent = hotspot.title || '';
    this.popupSimpleBody.textContent = hotspot.body || '';
    
    this.popupSimple.hidden = false;
    this.backdrop.hidden = false;
  }
  
  /**
   * Abre el popup detallado (nueva estructura)
   */
  openDetailedPopup(hotspot) {
    this.closeAll();
    this.currentHotspot = hotspot;
    
    // Título
    this.popupDetailedTitle.textContent = hotspot.title || '';
    
    // Imagen
    if (hotspot.image) {
      this.popupDetailedImage.src = hotspot.image;
      this.popupDetailedImage.alt = hotspot.title || '';
      this.popupDetailedImage.parentElement.style.display = 'block';
    } else {
      this.popupDetailedImage.parentElement.style.display = 'none';
    }
    
    // Fecha y hora
    if (hotspot.datetime) {
      this.popupDetailedDate.textContent = hotspot.datetime.date || '';
      this.popupDetailedTime.textContent = hotspot.datetime.time || '';
      
      // Aplicar color personalizado a la hora
      if (hotspot.datetime.timeColor) {
        this.popupDetailedTime.style.color = hotspot.datetime.timeColor;
      }
    }
    
    // Ubicación
    if (hotspot.location) {
      this.popupDetailedLocation.textContent = hotspot.location;
      this.popupDetailedLocation.style.display = 'block';
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
          />
        </div>
        <div class="popup-detailed__person-name">${person.name}</div>
        ${person.role ? `<div class="popup-detailed__person-role">${person.role}</div>` : ''}
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
    
    // Renderizar echos
    this.popupDetailedEchos.innerHTML = '';
    
    echos.forEach(echo => {
      const echoEl = document.createElement('div');
      echoEl.className = 'popup-detailed__echo';
      
      echoEl.innerHTML = `
        <div class="popup-detailed__echo-datetime">
          <span class="popup-detailed__echo-date">${echo.datetime?.date || ''}</span>
          <span class="popup-detailed__echo-time">${echo.datetime?.time || ''}</span>
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
    this.popupSimple.hidden = true;
    this.popupDetailed.hidden = true;
    this.backdrop.hidden = true;
    
    this.currentHotspot = null;
    this.selectedPersonId = null;
    
    // Reset estilos
    this.popupDetailedTime.style.color = '';
  }
  
  /**
   * Verifica si algún popup está abierto
   */
  isOpen() {
    return !this.popupSimple.hidden || !this.popupDetailed.hidden;
  }
}