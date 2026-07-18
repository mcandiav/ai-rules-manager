/**
 * Identidad Visual At-Once - Web Components Plugin (Enfoque A)
 * Distribución universal mediante Custom Elements nativos
 */

class AtonceLangPicker extends HTMLElement {
  constructor() {
    super();
    this.currentLang = 'es';
    this.assetsPath = '';
  }

  static get observedAttributes() {
    return ['assets-path', 'current-lang'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'assets-path') {
      this.assetsPath = newValue;
      this.render();
    }
    if (name === 'current-lang') {
      this.currentLang = newValue;
      this.updateActiveState();
    }
  }

  connectedCallback() {
    // Default assets path to jsDelivr CDN pointing to the canonical repository
    const defaultCDN = 'https://cdn.jsdelivr.net/gh/mcandiav/identidad-visual@master';
    this.assetsPath = this.getAttribute('assets-path') || defaultCDN;
    
    // Resolve initial language: localStorage -> HTML lang attribute -> default 'es'
    const storedLang = localStorage.getItem('lang');
    const htmlLang = document.documentElement.getAttribute('lang');
    this.currentLang = storedLang || htmlLang || 'es';

    // Normalize code (e.g. 'es-ES' -> 'es')
    this.currentLang = this.currentLang.split('-')[0].toLowerCase();
    if (!['es', 'pt', 'en'].includes(this.currentLang)) {
      this.currentLang = 'es';
    }

    this.render();
    this.setupListeners();
  }

  render() {
    // Clean up trailing slash on assetsPath
    const basePath = this.assetsPath.replace(/\/$/, '');

    this.innerHTML = `
      <div class="lang-picker" role="group" aria-label="Idioma">
        <button type="button" class="lang-flag ${this.currentLang === 'es' ? 'active' : ''}" data-lang="es" title="Español" aria-label="Español" aria-pressed="${this.currentLang === 'es'}">
          <img class="lang-flag__img" src="${basePath}/assets/flags/es.svg" alt="" />
          <span class="lang-flag__code">ES</span>
        </button>
        <button type="button" class="lang-flag ${this.currentLang === 'pt' ? 'active' : ''}" data-lang="pt" title="Português" aria-label="Português" aria-pressed="${this.currentLang === 'pt'}">
          <img class="lang-flag__img" src="${basePath}/assets/flags/br.svg" alt="" />
          <span class="lang-flag__code">PT</span>
        </button>
        <button type="button" class="lang-flag ${this.currentLang === 'en' ? 'active' : ''}" data-lang="en" title="English" aria-label="English" aria-pressed="${this.currentLang === 'en'}">
          <img class="lang-flag__img" src="${basePath}/assets/flags/us.svg" alt="" />
          <span class="lang-flag__code">EN</span>
        </button>
      </div>
    `;
  }

  setupListeners() {
    this.addEventListener('click', (event) => {
      const button = event.target.closest('.lang-flag');
      if (!button) return;

      const newLang = button.getAttribute('data-lang');
      if (newLang === this.currentLang) return;

      this.setLanguage(newLang);
    });
  }

  setLanguage(lang) {
    this.currentLang = lang;
    
    // Save preference
    localStorage.setItem('lang', lang);
    
    // Update HTML root lang attribute
    document.documentElement.setAttribute('lang', lang);

    // Update UI states
    this.updateActiveState();

    // Dispatch Event on the component itself
    this.dispatchEvent(new CustomEvent('change', {
      detail: { lang },
      bubbles: true,
      composed: true
    }));

    // Dispatch global Event for generic subscription
    window.dispatchEvent(new CustomEvent('atonce-lang-changed', {
      detail: { lang }
    }));
  }

  updateActiveState() {
    const buttons = this.querySelectorAll('.lang-flag');
    buttons.forEach((btn) => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === this.currentLang) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }
}

class AtonceVersionBadge extends HTMLElement {
  connectedCallback() {
    const version = this.getAttribute('version') || '1.0.0';
    this.render(version);
  }

  static get observedAttributes() {
    return ['version'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'version') {
      this.render(newValue);
    }
  }

  render(version) {
    this.innerHTML = `
      <div class="atonce-version-badge" title="Versión de la aplicación">
        <span>${version}</span>
      </div>
    `;
  }
}

// Define the custom elements in the browser registry
if (!customElements.get('atonce-lang-picker')) {
  customElements.define('atonce-lang-picker', AtonceLangPicker);
}

if (!customElements.get('atonce-version-badge')) {
  customElements.define('atonce-version-badge', AtonceVersionBadge);
}
