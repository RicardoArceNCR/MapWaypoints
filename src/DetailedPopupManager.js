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
    this.popupDetailedScrollClose = document.getElementById('popup-detailed-scroll-close');

    this.popupDetailedContent = this.popupDetailed?.querySelector('.popup-detailed__content');

    // Backdrop compartido
    this.backdrop = document.getElementById('popup-backdrop');

    // Estado
    this.currentHotspot = null;
    this.selectedPersonId = null;
    this.echoGroupEls = new Map();
    this.touchStartY = 0;
    this.touchCurrentY = 0;
    this.isDragging = false;
    this.closeTimeout = null;

    // Detectar si es dispositivo móvil (antes de listeners)
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Event listeners
    this.initEventListeners();
  }

  initEventListeners() {
    // Cerrar popups
    this.popupSimpleClose?.addEventListener('click', () => this.closeAll());
    this.popupDetailedClose?.addEventListener('click', () => this.closeAll());
    this.popupDetailedScrollClose?.querySelector('.popup-detailed__scroll-close-btn')?.addEventListener('click', () => this.closeAll());

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
        this.popupDetailed.style.transform = `translate(-50%, ${deltaY}px)`;
      }
    });

    handle.addEventListener('touchend', () => {
      if (!this.isDragging) return;

      const deltaY = this.touchCurrentY - this.touchStartY;
      this.popupDetailed.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

      if (deltaY > 100) {
        this.closeAll();
      } else {
        this.popupDetailed.style.transform = 'translate(-50%, 0)';
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
    const data = {
      id:       hs.id || hs.key,
      title:    hs.title || hs.meta?.title || hs.text || '',
      body:     hs.body  || hs.meta?.description || hs.description || '',
      image:    hs.image || hs.meta?.media || null,
      datetime: hs.datetime,
      location: hs.location,
      involved: hs.involved,
      echos:    hs.echos
    };
    this.openPopup(data);
  }

  /**
   * Abre el popup apropiado según el tipo de hotspot
   */
  openPopup(hotspot) {
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
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }

    if (this.popupDetailed) {
      this.popupDetailed.classList.remove('popup--visible');
      this.popupDetailed.hidden = true;
    }

    this.popupSimpleTitle.textContent = hotspot.title || '';
    this.popupSimpleBody.textContent = hotspot.body || '';

    this.backdrop.hidden = false;
    this.popupSimple.hidden = false;

    requestAnimationFrame(() => {
      this.popupSimple.classList.add('popup--visible');
      this.backdrop.classList.add('popup-backdrop--visible');
      document.body.classList.add('popup-open');
    });
  }

  /**
   * Abre el popup detallado (nueva estructura)
   */
  openDetailedPopup(hotspot) {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }

    if (this.popupSimple) {
      this.popupSimple.classList.remove('popup--visible');
      this.popupSimple.hidden = true;
    }

    this.currentHotspot = hotspot;

    this.popupDetailedTitle.textContent = hotspot.title || '';

    // Compartir: URL fija del especial
    const SHARE_URL = 'https://www.divergentes.com/asi-asesinaron-roberto-samcam-costa-rica-nicaragua/';
    const SHARE_TITLE = 'Así asesinaron a Roberto Samcam';
    const url = encodeURIComponent(SHARE_URL);
    const title = encodeURIComponent(SHARE_TITLE);
    const fb = document.getElementById('popup-share-facebook');
    const wa = document.getElementById('popup-share-whatsapp');
    const x = document.getElementById('popup-share-x');
    if (fb) fb.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    if (wa) wa.href = `https://api.whatsapp.com/send?text=${title}%20${url}`;
    if (x)  x.href  = `https://twitter.com/intent/tweet?via=DivergentesCA&text=${title}&url=${url}`;

    if (hotspot.image) {
      this.popupDetailedImage.src = hotspot.image;
      this.popupDetailedImage.alt = hotspot.title || '';
      const imageWrapper = this.popupDetailedImage.parentElement;
      imageWrapper.style.display = 'block';

      if (!imageWrapper.querySelector('.popup-detailed__image-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'popup-detailed__image-overlay';
        imageWrapper.appendChild(overlay);
      }
    } else {
      this.popupDetailedImage.parentElement.style.display = 'none';
    }

    if (hotspot.datetime) {
      this.popupDetailedDate.textContent = hotspot.datetime.date || '';
      this.popupDetailedTime.textContent = hotspot.datetime.time || '';

      if (hotspot.datetime.timeColor) {
        this.popupDetailedTime.style.color = hotspot.datetime.timeColor;
      }

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

      const highlighted = hotspot.involved.find(p => p.highlighted);
      const firstPerson = hotspot.involved[0];
      this.selectedPersonId = highlighted ? highlighted.id : firstPerson.id;

      this.buildEchosGroups(hotspot);
    } else {
      this.popupDetailedInvolvedSection.hidden = true;
      this.popupDetailedEchosSection.hidden = true;
    }

    this.popupDetailed.hidden = false;
    this.backdrop.hidden = false;

    requestAnimationFrame(() => {
      this.popupDetailed.classList.add('popup--visible');
      this.backdrop.classList.add('popup-backdrop--visible');
      document.body.classList.add('popup-open');
      this._updateScrollCloseButton();
    });

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

      if (person.id === this.selectedPersonId || person.highlighted) {
        personEl.classList.add('active');
      }

      personEl.innerHTML = `
        <div class="popup-detailed__person-avatar-wrapper">
          <img
            src="${person.avatar || './assets/default.gif'}"
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

      personEl.addEventListener('click', () => {
        this.selectPerson(person.id);
      });

      this.popupDetailedInvolved.appendChild(personEl);
    });
    this._updateScrollCloseButton();
  }

  /**
   * Selecciona una persona y promueve su grupo de echos
   */
  selectPerson(personId) {
    this.selectedPersonId = personId;

    this.popupDetailedInvolved.querySelectorAll('.popup-detailed__person').forEach(el => {
      if (el.dataset.personId === personId) {
        el.classList.add('active');
        el.classList.add('popup-detailed__person--pulse');
        setTimeout(() => {
          el.classList.remove('popup-detailed__person--pulse');
        }, 300);
      } else {
        el.classList.remove('active');
      }
    });

    this.promotePerson(personId);
  }

  /**
   * Construye grupos de echos combinados para todas las personas con echos.
   * Ordena con la persona seleccionada primero.
   */
  buildEchosGroups(hotspot) {
    this.echoGroupEls.clear();

    const involved = hotspot.involved || [];
    const echosData = hotspot.echos || {};

    const peopleWithEchos = involved.filter(p => echosData[p.id] && echosData[p.id].length > 0);

    if (peopleWithEchos.length === 0) {
      this.popupDetailedEchos.innerHTML = '';
      this.popupDetailedEchosSection.hidden = true;
      this._updateScrollCloseButton();
      return;
    }

    peopleWithEchos.sort((a, b) => {
      if (a.id === this.selectedPersonId) return -1;
      if (b.id === this.selectedPersonId) return 1;
      return 0;
    });

    this.popupDetailedEchos.innerHTML = '';
    peopleWithEchos.forEach(person => {
      const isActive = person.id === this.selectedPersonId;
      const group = this._createEchoGroup(person.id, person, echosData[person.id], isActive);
      this.popupDetailedEchos.appendChild(group);
      this.echoGroupEls.set(person.id, group);
    });

    this.popupDetailedEchosSection.hidden = false;
    this._updateScrollCloseButton();
  }

  /**
   * Crea un <section> tipo tarjeta (franja de acento + header avatar/nombre/rol
   * + lista de echos) para una persona. Limita animaciones a 15 items.
   * Todos los grupos se muestran abiertos; el seleccionado se posiciona primero.
   */
  _createEchoGroup(personId, person, echos, isActive) {
    const section = document.createElement('section');
    section.className = 'echo-group' + (isActive ? ' echo-group--active' : '');
    section.dataset.personId = personId;

    const accent = document.createElement('div');
    accent.className = 'echo-group__accent';
    section.appendChild(accent);

    const body = document.createElement('div');
    body.className = 'echo-group__body';

    const header = document.createElement('div');
    header.className = 'echo-group-header';
    header.innerHTML = `
      <img class="echo-group-avatar" src="${person.avatar || './assets/default.gif'}" alt="${person.name}" loading="lazy" />
      <div class="echo-group-info">
        <span class="echo-group-name">${person.name}</span>
        ${person.role ? `<span class="echo-group-role">${person.role}</span>` : ''}
      </div>
    `;
    body.appendChild(header);

    const list = document.createElement('div');
    list.className = 'echo-group-list';

    echos.forEach((echo, index) => {
      const echoEl = document.createElement('div');
      echoEl.className = 'popup-detailed__echo';
      if (index < 15) {
        echoEl.style.animationDelay = `${index * 0.05}s`;
      }

      echoEl.innerHTML = `
        <div class="popup-detailed__echo-header">
          <div class="popup-detailed__echo-datetime">
            <span class="popup-detailed__echo-date">${echo.datetime?.date || ''}</span>
            <span class="popup-detailed__echo-time">${echo.datetime?.time || ''}</span>
          </div>
        </div>
        <div class="popup-detailed__echo-description">${echo.description || ''}</div>
      `;

      list.appendChild(echoEl);
    });

    body.appendChild(list);
    section.appendChild(body);
    return section;
  }

  /**
   * Promueve el grupo de echos de una persona al inicio del contenedor,
   * sincroniza la franja de acento activa y hace scroll suave hacia él.
   * Si la persona no tiene echos en este hotspot, solo actualiza el acento.
   */
  promotePerson(personId) {
    this.echoGroupEls.forEach((el, id) => {
      el.classList.toggle('echo-group--active', id === personId);
    });

    const groupEl = this.echoGroupEls.get(personId);
    if (!groupEl) return;

    const parent = this.popupDetailedEchos;
    if (parent.firstChild !== groupEl) {
      parent.prepend(groupEl);
    }

    if (this.popupDetailedContent) {
      const bar = this.popupDetailedInvolved;
      const target = groupEl.offsetTop - this.popupDetailedContent.offsetTop - bar.offsetHeight;
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.popupDetailedContent.scrollTo({
        top: Math.max(0, target),
        behavior: prefersReduced ? 'auto' : 'smooth'
      });
    }
  }

  /**
   * Muestra/oculta el botón de cerrar al final del scroll
   */
  _updateScrollCloseButton() {
    const content = this.popupDetailed?.querySelector('.popup-detailed__content');
    if (!content || !this.popupDetailedScrollClose) return;
    const needsScroll = content.scrollHeight > content.clientHeight + 1;
    this.popupDetailedScrollClose.hidden = !needsScroll;
  }

  /**
   * Cierra todos los popups
   */
  closeAll() {
    document.querySelectorAll('.hs-caption.is-open')
      .forEach(el => el.classList.remove('is-open'));

    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }

    this.popupSimple.classList.remove('popup--visible');
    this.popupDetailed.classList.remove('popup--visible');
    this.backdrop.classList.remove('popup-backdrop--visible');

    this.closeTimeout = setTimeout(() => {
      this.popupSimple.hidden = true;
      this.popupDetailed.hidden = true;
      this.backdrop.hidden = true;

      if (this.popupDetailed) {
        this.popupDetailed.style.transform = '';
      }

      document.body.style.overflow = '';
      document.body.classList.remove('popup-open');

      this.currentHotspot = null;
      this.selectedPersonId = null;
      this.echoGroupEls.clear();
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