/**
 * UniversalSearchSelect
 * A production-grade, portal-based searchable select component.
 */

class UniversalSearchSelect {
    static portal = null;
    static activeInstance = null;

    constructor(element, options = {}) {
        this.select = typeof element === 'string' ? document.getElementById(element) : element;
        if (!this.select) return;
        if (this.select.hasAttribute('data-native') || this.select.classList.contains('order-product-select') || this.select.classList.contains('order-pack-select') || this.select.closest('#order-items-tbody')) {
            return;
        }
        this.select._ussInstance = this;

        this.options = {
            placeholder: this.select.dataset.placeholder || 'Select...',
            allowCustom: this.select.dataset.allowCustom === 'true' || options.allowCustom || false,
            onSelect: options.onSelect || null,
            ...options
        };

        this.data = this._extractData();
        this.filteredData = [...this.data];
        this.isOpen = false;
        
        this._init();
    }

    _extractData() {
        return Array.from(this.select.options).map((opt, idx) => ({
            value: opt.value,
            text: opt.textContent.trim(),
            isPlaceholder: idx === 0 && !opt.value && (
                opt.textContent.toLowerCase().includes('select') ||
                opt.textContent.toLowerCase().includes('choose') ||
                opt.textContent.toLowerCase().includes('add')
            )
        })).filter(opt => !opt.isPlaceholder);
    }

    _init() {
        // Create container and input
        this.container = document.createElement('div');
        this.container.className = 'uss-container';
        
        this.inputWrapper = document.createElement('div');
        this.inputWrapper.className = 'uss-input-wrapper';
        
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'uss-input';
        this.input.placeholder = this.options.placeholder;
        this.input.setAttribute('autocomplete', 'off');
        
        this.inputWrapper.appendChild(this.input);
        this.container.appendChild(this.inputWrapper);
        
        // Insert in DOM
        this.select.parentNode.insertBefore(this.container, this.select);
        this.select.style.display = 'none';

        // Set initial value
        const currentVal = this.select.value;
        if (currentVal) {
            const match = this.data.find(d => d.value === currentVal || d.text.toLowerCase() === currentVal.toLowerCase());
            if (match) {
                this.input.value = match.text;
            } else if (this.options.allowCustom) {
                this.input.value = currentVal;
            }
        }

        this._bindEvents();
    }

    _syncCustomValue(val) {
        const trimmed = (val || '').trim();
        const match = this.data.find(d => d.value.toLowerCase() === trimmed.toLowerCase() || d.text.toLowerCase() === trimmed.toLowerCase());
        if (match) {
            if (this.select.value !== match.value) {
                this.select.value = match.value;
                this.select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else {
            let customOpt = Array.from(this.select.options).find(o => o.dataset.custom === 'true');
            if (!customOpt) {
                customOpt = document.createElement('option');
                customOpt.dataset.custom = 'true';
                this.select.appendChild(customOpt);
            }
            customOpt.value = trimmed;
            customOpt.textContent = trimmed;
            this.select.value = trimmed;
            this.select.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    _bindEvents() {
        this.input.addEventListener('focus', () => this.open());
        this.input.addEventListener('click', () => {
            if (!this.isOpen) this.open();
        });
        this.input.addEventListener('input', (e) => {
            const val = e.target.value;
            this.filter(val);
            if (this.options.allowCustom) {
                this._syncCustomValue(val);
            }
        });
        
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowDown' && this.isOpen) {
                e.preventDefault();
                this._focusNext();
            }
            if (e.key === 'ArrowUp' && this.isOpen) {
                e.preventDefault();
                this._focusPrev();
            }
            if (e.key === 'Enter' && this.isOpen) {
                e.preventDefault();
                const activeItem = UniversalSearchSelect.portal.querySelector('.uss-item.hover');
                if (activeItem) this.selectItem(activeItem.dataset.value);
            }
        });

        // Global listeners for positioning and closing
        if (!UniversalSearchSelect._globalListenersAttached) {
            document.addEventListener('click', (e) => {
                if (UniversalSearchSelect.activeInstance && 
                    !UniversalSearchSelect.activeInstance.container.contains(e.target) &&
                    !UniversalSearchSelect.portal.contains(e.target)) {
                    UniversalSearchSelect.activeInstance.close();
                }
            });

            window.addEventListener('scroll', () => {
                if (UniversalSearchSelect.activeInstance) {
                    UniversalSearchSelect.activeInstance._positionPortal();
                }
            }, true);

            let lastWidth = window.innerWidth;
            window.addEventListener('resize', () => {
                if (UniversalSearchSelect.activeInstance) {
                    // Only close on width change (mobile keyboard resizes height)
                    if (window.innerWidth !== lastWidth) {
                        UniversalSearchSelect.activeInstance.close();
                        lastWidth = window.innerWidth;
                    } else {
                        // Just reposition if height changed
                        UniversalSearchSelect.activeInstance._positionPortal();
                    }
                }
            });

            UniversalSearchSelect._globalListenersAttached = true;
        }

        // Programmatic change synchronization
        this.select.addEventListener('change', () => {
            const match = this.data.find(d => d.value === this.select.value);
            this.input.value = match ? match.text : '';
        });

        // Form reset synchronization
        this.form = this.select.closest('form');
        if (this.form) {
            this.form.addEventListener('reset', () => {
                setTimeout(() => {
                    const match = this.data.find(d => d.value === this.select.value);
                    this.input.value = match ? match.text : '';
                }, 10);
            });
        }
    }

    static _getPortal() {
        if (!UniversalSearchSelect.portal) {
            UniversalSearchSelect.portal = document.createElement('div');
            UniversalSearchSelect.portal.id = 'uss-portal';
            UniversalSearchSelect.portal.style.position = 'absolute';
            document.body.appendChild(UniversalSearchSelect.portal);
        }
        return UniversalSearchSelect.portal;
    }

    open() {
        if (UniversalSearchSelect.activeInstance && UniversalSearchSelect.activeInstance !== this) {
            UniversalSearchSelect.activeInstance.close();
        }

        UniversalSearchSelect.activeInstance = this;
        this.isOpen = true;
        
        // Reset to display all options initially on click/focus
        this.filteredData = [...this.data];
        this._renderDropdown();
        this._positionPortal();
        
        const portal = UniversalSearchSelect._getPortal();
        portal.classList.add('active');

        // Automatically highlight the input text so typing immediately replaces it
        this.input.select();

        // Mobile UX: Scroll input into visible area if keyboard might hide it
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                this.input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Reposition after scroll
                setTimeout(() => this._positionPortal(), 300);
            }, 100);
        }
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        UniversalSearchSelect._getPortal().classList.remove('active');
        UniversalSearchSelect.activeInstance = null;
        
        if (this.options.allowCustom) {
            const val = this.input.value.trim();
            const match = this.data.find(d => d.value.toLowerCase() === val.toLowerCase() || d.text.toLowerCase() === val.toLowerCase());
            if (match) {
                this.input.value = match.text;
                this.select.value = match.value;
            } else if (val) {
                this.input.value = val;
                this._syncCustomValue(val);
            } else {
                this.input.value = '';
                this.select.value = '';
                this.select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else {
            // Sync input with select if empty or no match
            const match = this.data.find(d => d.value === this.select.value);
            this.input.value = match ? match.text : '';
        }
    }

    static closeAll() {
        if (UniversalSearchSelect.activeInstance) {
            UniversalSearchSelect.activeInstance.close();
        }
    }

    filter(query) {
        this.filteredData = this.data.filter(item => 
            item.text.toLowerCase().includes(query.toLowerCase())
        );
        this._renderDropdown();
    }

    _renderDropdown() {
        const portal = UniversalSearchSelect._getPortal();
        const currentVal = this.select.value;

        if (this.filteredData.length === 0) {
            portal.innerHTML = '<div class="uss-no-results">No matches found</div>';
            return;
        }

        const list = document.createElement('div');
        list.className = 'uss-list';

        this.filteredData.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = `uss-item ${item.value === currentVal ? 'selected' : ''}`;
            div.dataset.value = item.value;
            div.innerHTML = `<span>${item.text}</span>`;
            
            div.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectItem(item.value);
            });

            div.addEventListener('mouseenter', () => {
                portal.querySelectorAll('.uss-item').forEach(i => i.classList.remove('hover'));
                div.classList.add('hover');
            });

            list.appendChild(div);
        });

        portal.innerHTML = '';
        portal.appendChild(list);
    }

    _positionPortal() {
        const portal = UniversalSearchSelect._getPortal();
        const rect = this.input.getBoundingClientRect();
        const portalHeight = portal.offsetHeight || 250;
        const viewportHeight = window.innerHeight;
        
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Priority: Below (standard UX)
        // Only flip if space below is tiny (< 100px) AND space above is significantly larger
        const shouldFlip = spaceBelow < 150 && spaceAbove > spaceBelow;
        
        let top = 0;
        let left = rect.left + window.scrollX;
        
        if (shouldFlip) {
            top = rect.top + window.scrollY - portalHeight - 4;
            portal.style.maxHeight = `${Math.min(300, spaceAbove - 20)}px`;
        } else {
            top = rect.bottom + window.scrollY + 4;
            portal.style.maxHeight = `${Math.min(300, spaceBelow - 20)}px`;
        }
        
        portal.style.width = `${rect.width}px`;
        portal.style.top = `${top}px`;
        portal.style.left = `${left}px`;
    }

    selectItem(value) {
        const item = this.data.find(d => d.value === value);
        if (item) {
            this.input.value = item.text;
            this.select.value = value;
            if (typeof this.select.onchange === 'function') {
                this.select.onchange({ target: this.select });
            }
            this.select.dispatchEvent(new Event('change', { bubbles: true }));
            if (this.options.onSelect) this.options.onSelect(value, item.text);
        } else if (this.options.allowCustom) {
            this.input.value = value;
            this._syncCustomValue(value);
        }
        this.close();
    }

    _focusNext() {
        const portal = UniversalSearchSelect._getPortal();
        const items = portal.querySelectorAll('.uss-item');
        const current = portal.querySelector('.uss-item.hover');
        let nextIndex = 0;

        if (current) {
            nextIndex = Array.from(items).indexOf(current) + 1;
            if (nextIndex >= items.length) nextIndex = 0;
            current.classList.remove('hover');
        }
        items[nextIndex].classList.add('hover');
        items[nextIndex].scrollIntoView({ block: 'nearest' });
    }

    _focusPrev() {
        const portal = UniversalSearchSelect._getPortal();
        const items = portal.querySelectorAll('.uss-item');
        const current = portal.querySelector('.uss-item.hover');
        let nextIndex = items.length - 1;

        if (current) {
            nextIndex = Array.from(items).indexOf(current) - 1;
            if (nextIndex < 0) nextIndex = items.length - 1;
            current.classList.remove('hover');
        }
        items[nextIndex].classList.add('hover');
        items[nextIndex].scrollIntoView({ block: 'nearest' });
    }

    updateOptions() {
        this.data = this._extractData();
        this.filteredData = [...this.data];
        
        // Sync input text with select value in case it changed
        const match = this.data.find(d => d.value === this.select.value || d.text === this.select.value);
        if (match) {
            this.input.value = match.text;
        } else if (this.options.allowCustom && this.select.value) {
            this.input.value = this.select.value;
        } else {
            this.input.value = '';
        }
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        if (this.select) {
            this.select.style.display = '';
            delete this.select._ussInstance;
            delete this.select.dataset.ussInitialized;
        }
    }

    // Static helper to initialize all regular select elements unless explicitly excluded
    static initAll() {
        document.querySelectorAll('select').forEach(select => {
            if (select.hasAttribute('data-native') || select.classList.contains('order-product-select') || select.classList.contains('order-pack-select') || select.closest('#order-items-tbody')) {
                if (select._ussInstance) {
                    select._ussInstance.destroy();
                }
                const siblingContainer = select.parentNode ? select.parentNode.querySelector('.uss-container') : null;
                if (siblingContainer) {
                    siblingContainer.parentNode.removeChild(siblingContainer);
                }
                select.style.display = '';
                return;
            }
            if (!select.dataset.ussInitialized) {
                new UniversalSearchSelect(select);
                select.dataset.ussInitialized = 'true';
            } else {
                const instance = select._ussInstance;
                if (instance) {
                    instance.updateOptions();
                }
            }
        });
    }
}

// Global hook for easy access
window.UniversalSearchSelect = UniversalSearchSelect;
