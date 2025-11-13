// FloatingWaypointButton.js
// ========= 🎯 BOTÓN FLOTANTE POR WAYPOINT =========
// Gestiona botones flotantes independientes del canvas, uno por waypoint
// Características: Posición fija, responsive, animado, personalizable

export class FloatingWaypointButton {
  constructor() {
    this.currentButton = null;
    this.currentWaypointIndex = -1;
    this.transitionDuration = 300; // ms
  }

  /**
   * Actualiza o crea el botón para el waypoint actual
   * @param {number} waypointIndex - Índice del waypoint actual
   * @param {Object} config - Configuración del botón
   * @param {string} config.text - Texto del botón
   * @param {string} config.icon - HTML del icono (opcional)
   * @param {Function} config.onClick - Callback al hacer click
   * @param {Object} config.badge - Badge opcional {text, color}
   * @param {string} config.className - Clase CSS adicional (opcional)
   * @param {Object} config.style - Estilos inline adicionales (opcional)
   */
  update(waypointIndex, config) {
    // Validar config
    if (!config || typeof config !== 'object') {
      console.warn('[FloatingButton] Config inválida:', config);
      return;
    }

    // Si es el mismo waypoint y mismo contenido, no hacer nada
    if (this.currentWaypointIndex === waypointIndex && 
        this.currentButton && 
        this._isSameConfig(config)) {
      return;
    }

    // Limpiar botón anterior
    this.remove();

    // Crear nuevo botón
    const button = document.createElement('button');
    button.className = 'waypoint-floating-button';
    
    // Agregar clase adicional si existe
    if (config.className) {
      button.className += ' ' + config.className;
    }

    button.setAttribute('aria-label', config.text || 'Acción del waypoint');
    button.setAttribute('type', 'button');
    
    // Construir contenido del botón
    let content = '';
    if (config.icon) {
      content += `<span class="button-icon">${config.icon}</span> `;
    }
    content += `<span class="button-text">${config.text || 'Info'}</span>`;
    
    if (config.badge) {
      const badgeColor = config.badge.color || '#ff4757';
      content += `<span class="badge" style="background: ${badgeColor}">${config.badge.text}</span>`;
    }
    
    button.innerHTML = content;

    // Aplicar estilos personalizados si existen
    if (config.style && typeof config.style === 'object') {
      Object.assign(button.style, config.style);
    }

    // Agregar evento click
    if (typeof config.onClick === 'function') {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Feedback visual
        button.classList.add('clicked');
        setTimeout(() => button.classList.remove('clicked'), 200);
        
        config.onClick(waypointIndex);
      });
    }

    // Prevenir comportamientos táctiles no deseados
    button.addEventListener('touchstart', (e) => {
      e.stopPropagation();
    }, { passive: true });

    // Agregar al DOM
    document.body.appendChild(button);
    
    // Animar entrada
    this._animateIn(button);

    // Guardar referencia
    this.currentButton = button;
    this.currentWaypointIndex = waypointIndex;
    this._currentConfig = config;
  }

  /**
   * Remueve el botón actual con animación
   */
  remove() {
    if (!this.currentButton) return;

    const button = this.currentButton;
    
    // Animar salida
    button.style.opacity = '0';
    button.style.transform = 'translateY(-10px) scale(0.95)';
    
    setTimeout(() => {
      if (button && button.parentNode) {
        button.remove();
      }
    }, this.transitionDuration);

    this.currentButton = null;
    this.currentWaypointIndex = -1;
    this._currentConfig = null;
  }

  /**
   * Oculta temporalmente el botón (sin removerlo)
   */
  hide() {
    if (this.currentButton) {
      this.currentButton.style.display = 'none';
    }
  }

  /**
   * Muestra el botón si estaba oculto
   */
  show() {
    if (this.currentButton) {
      this.currentButton.style.display = 'block';
    }
  }

  /**
   * Actualiza solo el texto del botón sin recrearlo
   * @param {string} newText - Nuevo texto
   */
  updateText(newText) {
    if (!this.currentButton) return;
    
    const textSpan = this.currentButton.querySelector('.button-text');
    if (textSpan) {
      textSpan.textContent = newText;
    }
  }

  /**
   * Actualiza el badge sin recrear el botón
   * @param {Object} badge - {text, color}
   */
  updateBadge(badge) {
    if (!this.currentButton) return;

    let badgeEl = this.currentButton.querySelector('.badge');
    
    if (badge && badge.text) {
      if (!badgeEl) {
        badgeEl = document.createElement('span');
        badgeEl.className = 'badge';
        this.currentButton.appendChild(badgeEl);
      }
      badgeEl.textContent = badge.text;
      badgeEl.style.background = badge.color || '#ff4757';
    } else if (badgeEl) {
      badgeEl.remove();
    }
  }

  /**
   * Destruye completamente el botón y limpia referencias
   */
  destroy() {
    this.remove();
    this.currentButton = null;
    this.currentWaypointIndex = -1;
    this._currentConfig = null;
  }

  /**
   * Anima la entrada del botón
   * @private
   */
  _animateIn(button) {
    button.style.opacity = '0';
    button.style.transform = 'translateY(-10px) scale(0.95)';
    button.style.transition = 'none';
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        button.style.transition = `opacity ${this.transitionDuration}ms ease, transform ${this.transitionDuration}ms ease`;
        button.style.opacity = '1';
        button.style.transform = 'translateY(0) scale(1)';
      });
    });
  }

  /**
   * Compara si dos configs son iguales (shallow comparison)
   * @private
   */
  _isSameConfig(newConfig) {
    if (!this._currentConfig) return false;
    
    return this._currentConfig.text === newConfig.text &&
           this._currentConfig.icon === newConfig.icon &&
           this._currentConfig.className === newConfig.className &&
           JSON.stringify(this._currentConfig.badge) === JSON.stringify(newConfig.badge);
  }
}

// Exportar también una versión singleton para uso global
export const globalFloatingButton = new FloatingWaypointButton();