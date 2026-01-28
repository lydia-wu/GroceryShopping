/**
 * SlidePanel Component (Feature 9)
 * Reusable right-side slide-out panel
 */

export default class SlidePanel {
    constructor({ id = 'slide-panel', width = '420px', onClose = null } = {}) {
        this.id = id;
        this.width = width;
        this.onClose = onClose;
        this.isOpen = false;

        this._createDOM();
        this._bindEvents();
    }

    _createDOM() {
        // Backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'slide-panel-backdrop';
        this.backdrop.id = `${this.id}-backdrop`;

        // Panel
        this.panel = document.createElement('div');
        this.panel.className = 'slide-panel';
        this.panel.id = this.id;
        this.panel.style.width = this.width;
        this.panel.innerHTML = `
            <div class="slide-panel-header">
                <h3 class="slide-panel-title"></h3>
                <button class="slide-panel-close">&times;</button>
            </div>
            <div class="slide-panel-body"></div>
        `;

        this.backdrop.appendChild(this.panel);
        document.body.appendChild(this.backdrop);

        // Store references
        this.titleEl = this.panel.querySelector('.slide-panel-title');
        this.bodyEl = this.panel.querySelector('.slide-panel-body');
        this.closeBtn = this.panel.querySelector('.slide-panel-close');
    }

    _bindEvents() {
        // Backdrop click closes panel
        this.backdrop.addEventListener('click', (e) => {
            if (e.target === this.backdrop) this.close();
        });

        // Close button
        this.closeBtn.addEventListener('click', () => this.close());

        // Escape key
        this._escHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
        document.addEventListener('keydown', this._escHandler);
    }

    open(contentHTML, title = '') {
        this.titleEl.textContent = title;
        this.bodyEl.innerHTML = contentHTML;
        this.backdrop.classList.add('active');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.backdrop.classList.remove('active');
        this.isOpen = false;
        document.body.style.overflow = '';
        if (this.onClose) this.onClose();
    }

    setContent(html) {
        this.bodyEl.innerHTML = html;
    }

    destroy() {
        document.removeEventListener('keydown', this._escHandler);
        this.backdrop.remove();
    }
}
