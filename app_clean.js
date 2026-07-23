/* =========================================
   1. UTILIDADES Y ALMACENAMIENTO
   ========================================= */
const storage = {
    get(key, fallback = null) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
    del(key) { localStorage.removeItem(key); }
};

function getPageSlug() {
    const file = (location.pathname.split('/').pop() || 'index.html');
    return file.replace('.html', '');
}

function on(type, sel, handler, opts) {
    document.addEventListener(type, (e) => {
        const target = e.target.closest(sel);
        if (target) handler(e, target);
    }, opts);
}

function isOnPage(id) {
    return (document.body.dataset.page === id) || (getPageSlug() === id);
}

function textMatch(text, query) { 
    return text.toLowerCase().includes(query.toLowerCase()); 
}

/* =========================================
   2. CARRITO DE COMPRAS (Lógica + WhatsApp)
   ========================================= */
const CART_KEY = 'palermo_cart_v1';
let cart = storage.get(CART_KEY, []);
const PHONE_NUMBER = '5491160065713';

function saveCart() {
    storage.set(CART_KEY, cart);
    updateCartBadge();
}

function addToCart(product) {
    cart.push(product);
    saveCart();
    showToast(`¡${product.nombre} agregado!`);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCartModal(); 
}

function getCartTotals() {
    let total = cart.reduce((sum, item) => sum + item.precio, 0);
    let descuento = 0;
    let promoActiva = false;

    if (cart.length >= 3) {
        descuento = total * 0.10;
        promoActiva = true;
    }

    return {
        subtotal: total,
        descuento: descuento,
        totalFinal: total - descuento,
        promoActiva: promoActiva
    };
}

function updateCartBadge() {
    const badge = document.querySelector('#cart-count');
    if (badge) {
        badge.textContent = cart.length;
        badge.hidden = cart.length === 0;
    }
}

function injectFloatingCart() {
    if (document.getElementById('fab-cart')) return;
    const div = document.createElement('div');
    div.innerHTML = `
        <button id="fab-cart" class="fab-cart" aria-label="Ver carrito">
            🛒
            <span id="cart-count" class="cart-count" hidden>0</span>
        </button>
    `;
    document.body.appendChild(div);
    updateCartBadge();
    document.getElementById('fab-cart').addEventListener('click', openCartModal);
}

function injectAddButtons() {
    const items = document.querySelectorAll('.producto, .card[data-precio]');
    items.forEach(item => {
        if (item.querySelector('.btn-actions-container')) return;

        // Obtener ID del producto
        const dataId = item.dataset.id || '';
        const onclickAttr = item.getAttribute('onclick') || '';
        const idMatch = onclickAttr.match(/id=([^'&"\s)]+)/);
        const prodId = dataId || (idMatch ? idMatch[1] : '');
        const prod = (prodId && typeof productos !== 'undefined') ? productos[prodId] : null;

        // Panel de detalles expandible
        const detailPanel = document.createElement('div');
        detailPanel.className = 'product-detail-panel';
        const descripcion = prod?.descripcion || 'Producto de calidad garantizada por Palermo Tech.';
        const specs = prod?.specs || ['Producto original', 'Garantía de 6 meses', 'Envío a todo el país'];
        const detailLink = prodId
            ? `<a href="detalle.html?id=${prodId}" class="detail-more-link" onclick="event.stopPropagation()">Ver página completa →</a>`
            : '';
        detailPanel.innerHTML = `
            <div class="detail-inner">
                <p class="detail-desc">${descripcion}</p>
                <ul class="detail-specs">${specs.map(s => `<li>✓ ${s}</li>`).join('')}</ul>
                ${detailLink}
            </div>`;

        // Contenedor de botones
        const container = document.createElement('div');
        container.className = 'btn-actions-container';

        const btnDetalles = document.createElement('button');
        btnDetalles.className = 'btn ghost btn-details-toggle';
        btnDetalles.type = 'button';
        btnDetalles.innerHTML = '<span>Ver Detalles</span><span class="toggle-icon">▼</span>';
        btnDetalles.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = detailPanel.classList.toggle('open');
            btnDetalles.querySelector('.toggle-icon').textContent = isOpen ? '▲' : '▼';
        });
        container.appendChild(btnDetalles);

        const btnCart = document.createElement('button');
        btnCart.className = 'btn primary btn-add-cart';
        btnCart.textContent = '🛒 Agregar al Carrito';
        btnCart.type = 'button';
        btnCart.addEventListener('click', (e) => {
            e.stopPropagation();
            const nombre = prod?.nombre || item.dataset.nombre || item.querySelector('h3')?.textContent?.trim();
            const precioDataset = Number(item.dataset.precio) || 0;
            const precioTexto = parsePrecio(item.querySelector('.precio')?.textContent);
            const precio = prod?.precio || precioDataset || precioTexto;
            const currency = prod?.currency || item.dataset.currency || 'ARS';
            if (!nombre || precio <= 0) {
                showToast('No se pudo agregar el producto. Verificá el precio.');
                return;
            }
            addToCart({ nombre, precio, currency });
        });
        container.appendChild(btnCart);

        const mpLink = item.dataset.mp;
        if (mpLink) {
            const btnMP = document.createElement('button');
            btnMP.className = 'btn mp-btn';
            btnMP.textContent = 'Pagar con Mercado Pago';
            btnMP.type = 'button';
            btnMP.addEventListener('click', (e) => { e.stopPropagation(); window.open(mpLink, '_blank'); });
            container.appendChild(btnMP);
        }

        // Inyectar dentro de .body si existe
        const bodyEl = item.querySelector('.body');
        if (bodyEl) {
            bodyEl.appendChild(container);
            bodyEl.appendChild(detailPanel);
        } else {
            item.appendChild(container);
            item.appendChild(detailPanel);
        }
    });
}

function openCartModal() {
    renderCartModal();
    const modal = document.getElementById('cart-modal');
    if(modal) modal.classList.add('open');
}

function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if(modal) modal.classList.remove('open');
}

function renderCartModal() {
    let modal = document.getElementById('cart-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cart-modal';
        modal.className = 'modal-backdrop cart-backdrop';
        document.body.appendChild(modal);
    }

    const totals = getCartTotals();
    let itemsHtml = cart.length === 0 ? '<p class="empty-msg">Tu carrito está vacío.</p>' : '<ul class="cart-list">';
    
    if (cart.length > 0) {
        cart.forEach((item, index) => {
            itemsHtml += `
                <li class="cart-item">
                    <span>${item.nombre}</span>
                    <div class="cart-actions">
                        <span>$${item.precio}</span>
                        <button onclick="removeFromCart(${index})" class="btn-remove">✕</button>
                    </div>
                </li>`;
        });
        itemsHtml += '</ul>';
    }

    const promoHtml = totals.promoActiva 
        ? `<div class="promo-alert">¡Descuento del 10% aplicado por llevar +3 productos!</div>` 
        : `<div class="promo-hint">Tip: Llevá 3 productos para 10% OFF</div>`;

    modal.innerHTML = `
        <div class="modal cart-window">
            <header>
                <h2>Tu Pedido</h2>
                <button class="btn-icon" onclick="closeCartModal()">✕</button>
            </header>
            <div class="content">
                ${itemsHtml}
                <hr>
                ${promoHtml}
                <div class="cart-summary">
                    <div class="row"><span>Subtotal:</span> <span>$${totals.subtotal}</span></div>
                    <div class="row discount"><span>Descuento:</span> <span>-$${totals.descuento}</span></div>
                    <div class="row total"><span>Total:</span> <span>$${totals.totalFinal}</span></div>
                </div>
                
                ${cart.length > 0 ? `
                <form id="checkout-form" class="checkout-form">
                    <h3>Datos de Envío</h3>
                    <input type="text" id="cx-nombre" placeholder="Nombre y Apellido" required>
                    <input type="text" id="cx-direccion" placeholder="Dirección (Calle y Altura)" required>
                    <div class="row-inputs">
                        <input type="text" id="cx-cp" placeholder="C.P." required>
                        <input type="text" id="cx-localidad" placeholder="Localidad" required>
                    </div>
                    <button type="submit" class="btn primary full-width">Realizar Pedido por WhatsApp</button>
                </form>
                ` : ''}
            </div>
        </div>
    `;

    const form = modal.querySelector('#checkout-form');
    if(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            finalizeCheckout(totals);
        });
    }
}

function finalizeCheckout(totals) {
    const nombre = document.getElementById('cx-nombre').value;
    const direccion = document.getElementById('cx-direccion').value;
    const cp = document.getElementById('cx-cp').value;
    const localidad = document.getElementById('cx-localidad').value;

    let mensaje = `*¡Hola Palermo Tech! Quiero realizar un pedido.*\n\n`;
    mensaje += `*Cliente:* ${nombre}\n`;
    mensaje += `*Dirección:* ${direccion}, ${localidad} (CP: ${cp})\n\n`;
    mensaje += `*PEDIDO:*\n`;
    
    cart.forEach(item => {
        mensaje += `- ${item.nombre} ($${item.precio})\n`;
    });

    mensaje += `\nSubtotal: $${totals.subtotal}`;
    if(totals.promoActiva) mensaje += `\nDescuento: -$${totals.descuento}`;
    mensaje += `\n*TOTAL A PAGAR: $${totals.totalFinal}*`;

    const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add('show'); }, 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 2500);
}

/* =========================================
   3. CARRUSEL (Esta es la función que faltaba)
   ========================================= */
function initCarousel() {
    if (!isOnPage('relojes')) return;
    
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(document.querySelectorAll('.carousel-slide'));
    const nextButton = document.querySelector('.carousel .next');
    const prevButton = document.querySelector('.carousel .prev');
    const dotsNav = document.querySelector('.carousel-indicators');
    const dots = Array.from(dotsNav.children);

    if (!track || slides.length === 0) return;

    const slideWidth = slides[0].getBoundingClientRect().width;

    // Acomodar slides uno al lado del otro
    const setSlidePosition = (slide, index) => {
        slide.style.left = slideWidth * index + 'px';
    };
    slides.forEach(setSlidePosition);

    const moveToSlide = (track, currentSlide, targetSlide) => {
        track.style.transform = 'translateX(-' + targetSlide.style.left + ')';
        currentSlide.classList.remove('current-slide');
        targetSlide.classList.add('current-slide');
    }

    const updateDots = (currentDot, targetDot) => {
        currentDot.setAttribute('aria-current', 'false');
        targetDot.setAttribute('aria-current', 'true');
    }

    // Next Button
    nextButton.addEventListener('click', e => {
        const currentSlide = track.querySelector('.current-slide') || slides[0];
        let nextSlide = currentSlide.nextElementSibling;
        const currentDot = dotsNav.querySelector('[aria-current="true"]') || dots[0];
        let nextDot = currentDot.nextElementSibling;

        // Loop vuelta al principio
        if (!nextSlide) {
            nextSlide = slides[0];
            nextDot = dots[0];
        }

        moveToSlide(track, currentSlide, nextSlide);
        updateDots(currentDot, nextDot);
    });

    // Prev Button
    prevButton.addEventListener('click', e => {
        const currentSlide = track.querySelector('.current-slide') || slides[0];
        let prevSlide = currentSlide.previousElementSibling;
        const currentDot = dotsNav.querySelector('[aria-current="true"]') || dots[0];
        let prevDot = currentDot.previousElementSibling;

        // Loop vuelta al final
        if (!prevSlide) {
            prevSlide = slides[slides.length - 1];
            prevDot = dots[dots.length - 1];
        }

        moveToSlide(track, currentSlide, prevSlide);
        updateDots(currentDot, prevDot);
    });

    // Dots
    dotsNav.addEventListener('click', e => {
        const targetDot = e.target.closest('button');
        if (!targetDot) return;

        const currentSlide = track.querySelector('.current-slide') || slides[0];
        const currentDot = dotsNav.querySelector('[aria-current="true"]') || dots[0];
        const targetIndex = dots.findIndex(dot => dot === targetDot);
        const targetSlide = slides[targetIndex];

        moveToSlide(track, currentSlide, targetSlide);
        updateDots(currentDot, targetDot);
    });

    // Inicializar clase
    slides[0].classList.add('current-slide');
}

/* =========================================
   4. FUNCIONES UI (Nav, Reveal, etc)
   ========================================= */
function initNav() {
    const menu = document.querySelector('.nav-links');
    const burger = document.querySelector('#burger');
    if (!menu || !burger) return;
    burger.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        burger.setAttribute('aria-expanded', open);
    });
    on('click', '.nav-links a', () => {
        if (menu.classList.contains('open')) {
            menu.classList.remove('open');
            burger.setAttribute('aria-expanded', false);
        }
    });
    const path = location.pathname.split('/').pop() || 'index.html';
    Array.from(document.querySelectorAll('.nav-links a')).forEach(a => {
        const href = a.getAttribute('href');
        if (href.endsWith(path)) a.setAttribute('aria-current', 'page');
    });
}

function initReveal() {
    const els = Array.from(document.querySelectorAll('.reveal'));
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
            if (en.isIntersecting) {
                en.target.classList.add('visible');
                io.unobserve(en.target);
            }
        });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    els.forEach(el => io.observe(el));
}

function initAccordion() {
    if (!isOnPage('electrodomesticos')) return;
    on('click', '.accordion-header', (e, btn) => {
        const item = btn.closest('.accordion-item');
        if (!item) return;
        const open = item.hasAttribute('open');
        if (open) item.removeAttribute('open'); else item.setAttribute('open', '');
        const panel = item.querySelector('.accordion-panel');
        btn.setAttribute('aria-expanded', String(!open));
        if (panel) panel.hidden = open;
    });
}

function initGallery() {
    if (!isOnPage('celulares')) return;
    on('click', '.gallery .item', (e, item) => {
        if(e.target.classList.contains('btn-add-cart')) return;
        const img = item.querySelector('img');
        const caption = item.querySelector('figcaption')?.textContent || '';
        const node = document.createElement('div');
        node.innerHTML = `<img src="${img?.src || ''}" style="width:100%"><h3 style="text-align:center;margin-top:1rem;">${caption}</h3>`;
        
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop open';
        backdrop.innerHTML = `<div class="modal"><header><button class="btn-icon" onclick="this.closest('.modal-backdrop').remove()">✕</button></header><div class="content"></div></div>`;
        backdrop.querySelector('.content').appendChild(node);
        document.body.appendChild(backdrop);
    });
}

function initElectrodomesticosSearch() {
    if (!isOnPage('electrodomesticos')) return;
    const inputSearch = document.querySelector('#search-electrodomesticos');
    const selectCategory = document.querySelector('#filter-category-electrodomesticos');
    const inputPrice = document.querySelector('#max-price-electrodomesticos');
    const emptyMsg = document.querySelector('#electrodomesticos-empty');
    const cards = Array.from(document.querySelectorAll('#lista-electrodomesticos .producto'));

    function filterElectrodomesticos() {
        const texto = inputSearch?.value.toLowerCase().trim() || '';
        const categoriaSeleccionada = selectCategory?.value || 'todos';
        const precioMax = inputPrice?.value ? Number(inputPrice.value) : Number.POSITIVE_INFINITY;
        let visibles = 0;

        cards.forEach(card => {
            const onclick = card.getAttribute('onclick') || '';
            const match = onclick.match(/id=([^']+)'/);
            const id = match ? match[1] : '';
            const prod = typeof productos !== 'undefined' ? productos[id] : null;
            
            let nombre = '', categoria = '', precio = 0;
            if (prod) {
                nombre = prod.nombre.toLowerCase();
                precio = prod.precio;
                if (id.includes('heladera') || id.includes('freezer') || id.includes('lavarropas') || id.includes('lavavajillas')) {
                    categoria = 'refrigeración y lavado';
                } else if (id.includes('aspiradora')) {
                    categoria = 'limpieza';
                } else {
                    categoria = 'climatización y electrodomésticos de cocina';
                }
            } else {
                nombre = (card.dataset.nombre || card.querySelector('h3')?.textContent || '').toLowerCase();
                precio = Number(card.dataset.precio) || 0;
                categoria = (card.dataset.categoria || '').toLowerCase();
            }

            const matchNombre = !texto || nombre.includes(texto);
            const matchCategoria = categoriaSeleccionada === 'todos' || categoria === categoriaSeleccionada.toLowerCase();
            const matchPrecio = precio <= precioMax;

            if (matchNombre && matchCategoria && matchPrecio) {
                card.style.display = '';
                visibles++;
            } else {
                card.style.display = 'none';
            }
        });
        if (emptyMsg) emptyMsg.hidden = visibles > 0;
    }
    if (inputSearch) inputSearch.addEventListener('input', filterElectrodomesticos);
    if (selectCategory) selectCategory.addEventListener('change', filterElectrodomesticos);
    if (inputPrice) inputPrice.addEventListener('input', filterElectrodomesticos);
}

function initLocalesSearch() {
    if (!isOnPage('tecnologia')) return;
    const inputSearch = document.querySelector('#search-locales');
    const selectCategory = document.querySelector('#filter-categoria');
    const emptyMsg = document.querySelector('#locales-empty');
    const cards = Array.from(document.querySelectorAll('#lista-locales .producto'));

    function filterLocales() {
        const texto = inputSearch?.value.toLowerCase().trim() || '';
        const categoriaSeleccionada = selectCategory?.value || '';
        let visibles = 0;

        cards.forEach(card => {
            const onclick = card.getAttribute('onclick') || '';
            const match = onclick.match(/id=([^']+)'/);
            const id = match ? match[1] : '';
            const prod = typeof productos !== 'undefined' ? productos[id] : null;
            
            let nombre = '', categoria = '';
            if (prod) {
                nombre = prod.nombre.toLowerCase();
                if (id.includes('airpods') || id.includes('auriculares')) categoria = 'audio';
                else if (id.includes('notebook') || id.includes('macbook')) categoria = 'notebooks';
                else categoria = 'perifericos';
            } else {
                nombre = (card.dataset.nombre || card.querySelector('h3')?.textContent || '').toLowerCase();
                categoria = (card.dataset.categoria || '').toLowerCase();
            }

            const matchNombre = !texto || nombre.includes(texto);
            const matchCategoria = !categoriaSeleccionada || categoria === categoriaSeleccionada.toLowerCase();

            if (matchNombre && matchCategoria) {
                card.style.display = '';
                visibles++;
            } else {
                card.style.display = 'none';
            }
        });
        if (emptyMsg) emptyMsg.hidden = visibles > 0;
    }
    if (inputSearch) inputSearch.addEventListener('input', filterLocales);
    if (selectCategory) selectCategory.addEventListener('change', filterLocales);
    filterLocales();
}

function initOfertas() {
    if (!isOnPage('ofertas')) return;
    const search = document.querySelector('#search-ofertas');
    const min = document.querySelector('#min-precio');
    const max = document.querySelector('#max-precio');
    const empty = document.querySelector('#ofertas-empty');
    const cards = Array.from(document.querySelectorAll('.card[data-precio]'));

    function apply() {
        const q = search?.value.trim() || '';
        const minV = Number(min?.value || 0);
        const maxV = Number(max?.value || 9999999); 
        let visible = 0;
        cards.forEach(card => {
            const precio = Number(card.dataset.precio) || 0;
            const nombre = card.dataset.nombre || '';
            const ok = (!q || textMatch(nombre, q)) && precio >= minV && precio <= maxV;
            card.style.display = ok ? '' : 'none';
            if (ok) visible++;
        });
        if (empty) empty.hidden = visible !== 0;
    }
    [search, min, max].forEach(el => el?.addEventListener('input', apply));
    apply(); 
}

function initContacto() {
    if (!isOnPage('contacto')) return;
    const form = document.querySelector('#contacto-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const motivo = document.getElementById('motivo').value;
        const mensajeTexto = document.getElementById('mensaje').value;

        let whatsappMsg = `*Consulta desde la Web*\n\n`;
        whatsappMsg += `*Nombre:* ${nombre}\n`;
        whatsappMsg += `*Email:* ${email}\n`;
        whatsappMsg += `*Motivo:* ${motivo}\n`;
        whatsappMsg += `*Mensaje:* ${mensajeTexto}`;

        const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(whatsappMsg)}`;
        window.open(url, '_blank');
        form.reset();
    });
}

function initChatbot() {
    if (!isOnPage('contacto')) return;
    const win = document.querySelector('#chat-window');
    const form = document.querySelector('#chat-form');
    const input = document.querySelector('#chat-input');
    if (!win || !form || !input) return;

    const optionsText = 'Elegí una opción:\n1) Tecnología\n2) Celulares\n3) Relojes\n4) Electrodomésticos\n5) Ofertas\n6) Ubicación';
    const responses = {
        tech: 'Mirá nuestra sección de <a href="tecnologia.html">Tecnología</a>.',
        celulares: 'Encontrá iPhone y Androids en <a href="celulares.html">Celulares</a>.',
        relojes: 'Nuestra colección de lujo está en <a href="relojes.html">Relojes</a>.',
        electrodomesticos: 'Descubrí nuestra sección de <a href="electrodomesticos.html">Electrodomésticos</a>.',
        ofertas: 'Aprovechá los descuentos en <a href="ofertas.html">Ofertas</a>.',
        location: 'Estamos en Palermo Soho, Buenos Aires. ¡Te esperamos!',
    };
    const mapToKey = (txt) => {
        const t = (txt || '').trim().toLowerCase();
        if (['1', 'tecnologia', 'tech'].includes(t)) return 'tech';
        if (['2', 'celulares', 'iphone'].includes(t)) return 'celulares';
        if (['3', 'relojes', 'watch'].includes(t)) return 'relojes';
        if (['4', 'perfumes', 'electro', 'electrodomesticos', 'electrodomésticos'].includes(t)) return 'electrodomesticos';
        if (['5', 'ofertas', 'promo'].includes(t)) return 'ofertas';
        if (['6', 'ubicacion', 'donde'].includes(t)) return 'location';
        return null;
    };

    function addMsg(text, from = 'bot', asHTML = false) {
        const div = document.createElement('div');
        div.className = `chat-msg ${from === 'user' ? 'from-user' : 'from-bot'}`;
        if (asHTML) div.innerHTML = text; else div.textContent = text;
        win.appendChild(div);
        win.scrollTop = win.scrollHeight;
    }

    function showMenu() {
        addMsg('¡Hola! Soy el asistente de Palermo Tech.');
        addMsg(optionsText);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = input.value;
        if (!val.trim()) return;
        addMsg(val, 'user');
        const key = mapToKey(val);
        if (!key) {
            addMsg('Opción no entendida. Probá con el número.');
            addMsg(optionsText);
        } else {
            addMsg(responses[key], 'bot', true);
            addMsg('¿Algo más?');
            addMsg(optionsText);
        }
        input.value = '';
        input.focus();
    });

    showMenu(); 
}


function initTheme() {
    const toggle = document.querySelector('#theme-toggle');
    if (!toggle) return;
    const saved = storage.get('theme', 'light');
    document.documentElement.setAttribute('data-theme', saved);
    toggle.textContent = saved === 'light' ? '☀️' : '🌓';

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        storage.set('theme', next);
        toggle.textContent = next === 'light' ? '☀️' : '🌓';
    });
}
function initDetalle() {
    if (!isOnPage('detalle')) return;

    const params = new URLSearchParams(location.search);
    const id = params.get('id');

    const imgEl    = document.getElementById('det-img');
    const tituloEl = document.getElementById('det-titulo');
    const precioEl = document.getElementById('det-precio');
    const descEl   = document.getElementById('det-desc');
    const specsEl  = document.getElementById('det-specs');
    const btnAdd   = document.getElementById('det-btn-add');

    if (!id || typeof productos === 'undefined' || !productos[id]) {
        if (tituloEl) tituloEl.textContent = 'Producto no encontrado';
        if (descEl)   descEl.textContent   = 'El producto que buscás no existe o fue removido.';
        return;
    }

    const p = productos[id];
    if (tituloEl) tituloEl.textContent = p.nombre;
    if (precioEl) precioEl.textContent = `${p.currency || 'ARS'} $${p.precio.toLocaleString('es-AR')}`;
    if (descEl)   descEl.textContent   = p.descripcion || '';
    if (imgEl)  { imgEl.src = p.img || ''; imgEl.alt = p.nombre; }
    document.title = `${p.nombre} | Palermo Tech`;

    if (specsEl && p.specs) {
        specsEl.innerHTML = p.specs.map(s => `<li>✓ ${s}</li>`).join('');
    }

    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            addToCart({ nombre: p.nombre, precio: p.precio, currency: p.currency || 'ARS' });
        });
    }

    injectFloatingCart();
}

document.addEventListener('DOMContentLoaded', () => {

    document.body.dataset.page = getPageSlug();
    initTheme();
    Array.from(document.querySelectorAll('#year')).forEach(el => el.textContent = new Date().getFullYear());

    initNav();
    initReveal();
    initAccordion();
    initGallery();
    initCarousel(); // <--- AHORA SÍ SE INICIA EL CARRUSEL
    injectFloatingCart();
    injectAddButtons();
    initElectrodomesticosSearch();
    initLocalesSearch();
    initOfertas();
    initContacto();
    initChatbot();
    initDetalle();
});

function parsePrecio(texto) {
    if (!texto) return 0;
    const soloNumeros = texto.replace(/\./g, '').replace(/[^0-9]/g, '');
    return Number(soloNumeros) || 0;
}

const productos = {
    /* ====== CELULARES ====== */
    "iphone_17_256gb": {
        "nombre": "iPhone 17 256GB",
        "precio": 999,
        "img": "images/productos/iphone 17.webp",
        "descripcion": "El iPhone 17 con chip A19 Bionic, cámara de 48MP y diseño ultrafino. Sellado de fábrica con garantía.",
        "specs": ["Chip A19 Bionic", "Cámara 48MP", "256GB almacenamiento", "iOS 19", "Sellado de fábrica", "Garantía oficial"],
        "currency": "USD"
    },
    "iphone_17_pro_256gb": {
        "nombre": "iPhone 17 Pro 256GB",
        "precio": 1200,
        "img": "images/productos/iphone 17 pro.webp",
        "descripcion": "iPhone 17 Pro con chip A19 Pro, sistema de cámaras Pro de 48MP+12MP+12MP y pantalla ProMotion 120Hz.",
        "specs": ["Chip A19 Pro", "Triple cámara Pro 48MP", "ProMotion 120Hz", "256GB", "Titanio", "Sellado de fábrica"],
        "currency": "USD"
    },
    "iphone_17_pro_max_256gb_blue_silver": {
        "nombre": "iPhone 17 Pro Max 256GB (Blue, Silver)",
        "precio": 1340,
        "img": "images/productos/iphone 17 pro max.webp",
        "descripcion": "El iPhone más potente, con pantalla de 6.9\", batería de mayor duración y cámara de 48MP con zoom óptico 5x.",
        "specs": ["Pantalla 6.9\" OLED", "Chip A19 Pro", "Zoom óptico 5x", "256GB", "Color Blue/Silver", "Sellado"],
        "currency": "USD"
    },
    "iphone_17_pro_max_256gb_orange": {
        "nombre": "iPhone 17 Pro Max 256GB (Orange)",
        "precio": 1330,
        "img": "images/productos/iphone 17 pro max orange.webp",
        "descripcion": "iPhone 17 Pro Max en color Desert Orange exclusivo. Máxima potencia y estilo en tu mano.",
        "specs": ["Pantalla 6.9\" OLED", "Chip A19 Pro", "Zoom óptico 5x", "256GB", "Color Desert Orange", "Sellado"],
        "currency": "USD"
    },
    "iphone_13_128gb": {
        "nombre": "iPhone 13 128GB",
        "precio": 550,
        "img": "images/productos/iphone_13.png",
        "descripcion": "iPhone 13 con doble cámara de 12MP, chip A15 Bionic y pantalla Super Retina XDR de 6.1\".",
        "specs": ["Chip A15 Bionic", "Doble cámara 12MP", "Pantalla 6.1\" OLED", "128GB", "Batería 19h video"],
        "currency": "USD"
    },
    "iphone_13_pro_128gb": {
        "nombre": "iPhone 13 Pro 128GB Grado A",
        "precio": 440,
        "img": "images/productos/iphone 13 pro.jpg",
        "descripcion": "iPhone 13 Pro en condición Grado A (sin marcas visibles). Triple cámara con zoom óptico 3x.",
        "specs": ["Triple cámara 12MP", "Zoom óptico 3x", "ProMotion 120Hz", "128GB", "Grado A - sin marcas"],
        "currency": "USD"
    },
    "samsung_s26_ultra_256gb": {
        "nombre": "Samsung S26 Ultra 256GB",
        "precio": 1180,
        "img": "images/productos/galaxy-s26-ultra-.jpg",
        "descripcion": "Samsung Galaxy S26 Ultra con S Pen integrado, cámara de 200MP y pantalla Dynamic AMOLED 2X de 6.9\".",
        "specs": ["Cámara 200MP", "S Pen integrado", "Pantalla 6.9\" 120Hz", "256GB + 12GB RAM", "Batería 5000mAh"],
        "currency": "USD"
    },
    "samsung_s26_ultra_512gb": {
        "nombre": "Samsung S26 Ultra 512GB",
        "precio": 1260,
        "img": "images/productos/galaxy-s26-ultra-.jpg",
        "descripcion": "Samsung Galaxy S26 Ultra en versión 512GB. El máximo almacenamiento para profesionales y creadores.",
        "specs": ["Cámara 200MP", "S Pen integrado", "512GB + 12GB RAM", "Pantalla 6.9\" 120Hz", "Galaxy AI"],
        "currency": "USD"
    },
    "samsung_a17_256gb": {
        "nombre": "Samsung A17 8/256GB Dual Sim",
        "precio": 285,
        "img": "images/productos/A17-Gray.jpg",
        "descripcion": "Samsung Galaxy A17 con 8GB de RAM, 256GB de almacenamiento y doble SIM. Ideal para uso diario.",
        "specs": ["8GB RAM / 256GB", "Dual SIM", "Batería 5000mAh", "Cámara 50MP", "Android 15"],
        "currency": "USD"
    },
    "samsung_a37_256gb": {
        "nombre": "Samsung A37 8/256GB 5G",
        "precio": 455,
        "img": "images/productos/a 37.png",
        "descripcion": "Samsung Galaxy A37 con conectividad 5G, pantalla Super AMOLED y cámara triple de 50MP.",
        "specs": ["Conectividad 5G", "8GB RAM / 256GB", "Pantalla Super AMOLED", "Triple cámara 50MP", "Dual SIM"],
        "currency": "USD"
    },
    "samsung_a57_512gb": {
        "nombre": "Samsung A57 12/512GB",
        "precio": 645,
        "img": "images/productos/a57.webp",
        "descripcion": "Samsung Galaxy A57 con 12GB de RAM y 512GB de almacenamiento interno. Potencia y espacio ilimitado.",
        "specs": ["12GB RAM / 512GB", "Pantalla 6.7\" AMOLED", "Cámara 64MP OIS", "Batería 5000mAh 45W", "5G"],
        "currency": "USD"
    },
    "cargador_apple_20w": {
        "nombre": "Cargador Apple 20W",
        "precio": 40,
        "img": "images/productos/cargador apple 20 w.webp",
        "descripcion": "Cargador original Apple USB-C de 20W con carga rápida para iPhone 12 o posterior.",
        "specs": ["20W USB-C", "Carga rápida", "Compatible iPhone 12+", "Original Apple", "Cable no incluído"],
        "currency": "USD"
    },
    "cargador_apple_40w": {
        "nombre": "Cargador Apple 40W",
        "precio": 60,
        "img": "images/productos/cargador apple 40 w.webp",
        "descripcion": "Cargador Apple USB-C de 40W para carga ultrarrápida. Ideal para iPad Pro y MacBook Air.",
        "specs": ["40W USB-C", "Carga ultrarrápida", "Compatible iPhone/iPad/Mac", "Original Apple", "GaN compacto"],
        "currency": "USD"
    },
    "pococ75": {
        "nombre": "Poco C75",
        "precio": 319999,
        "img": "images/productos/prod_3.jpg",
        "descripcion": "Poco C75 con gran batería de 5160mAh, pantalla de 6.88\" y cámara de 50MP. Relación precio/calidad imbatible.",
        "specs": ["Batería 5160mAh 18W", "Pantalla 6.88\" 120Hz", "Cámara 50MP", "128GB / 8GB RAM", "HyperOS"],
        "currency": "ARS"
    },
    /* ====== ANTERIORES ====== */
    "redmi_15c": {
        "nombre": "Redmi 15C",
        "precio": 349999,
        "img": "images/productos/prod_1.jpg",
        "descripcion": "Excelente Redmi 15C con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },

    "redmi_14c": {
        "nombre": "Redmi 14C",
        "precio": 299999,
        "img": "images/productos/prod_2.jpg",
        "descripcion": "Excelente Redmi 14C con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "freezer_vertical_no_frost_230_lts": {
        "nombre": "Freezer Vertical no frost 230 LTS",
        "precio": 1299999,
        "img": "images/productos/prod_4.jpg",
        "descripcion": "Excelente Freezer Vertical no frost 230 LTS con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "heladera_c_clica_top_mount_240l_silver": {
        "nombre": "Heladera cíclica top mount 240L Silver",
        "precio": 599999,
        "img": "images/productos/prod_5.jpg",
        "descripcion": "Excelente Heladera cíclica top mount 240L Silver con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "heladera_c_clica_top_mount_295l_blanca": {
        "nombre": "Heladera cíclica top mount 295L Blanca",
        "precio": 649999,
        "img": "images/productos/prod_6.jpg",
        "descripcion": "Excelente Heladera cíclica top mount 295L Blanca con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "heladera_no_frost_inverter_top_mount_266l": {
        "nombre": "Heladera no frost inverter top mount 266L",
        "precio": 699999,
        "img": "images/productos/prod_7.jpg",
        "descripcion": "Excelente Heladera no frost inverter top mount 266L con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "heladera_no_frost_inverter_top_mount_470l": {
        "nombre": "Heladera no frost inverter top mount 470L",
        "precio": 1299999,
        "img": "images/productos/prod_8.jpg",
        "descripcion": "Excelente Heladera no frost inverter top mount 470L con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "heladera_no_frost_inverter_side_by_side_510l": {
        "nombre": "Heladera no frost inverter side by side 510L",
        "precio": 1449999,
        "img": "images/productos/prod_9.jpg",
        "descripcion": "Excelente Heladera no frost inverter side by side 510L con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "lavarropas_6_kg_titanium": {
        "nombre": "Lavarropas 6 KG Titanium",
        "precio": 549999,
        "img": "images/productos/prod_10.png",
        "descripcion": "Excelente Lavarropas 6 KG Titanium con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "lavarropas_6_kg_blanco": {
        "nombre": "Lavarropas 6 KG Blanco",
        "precio": 509999,
        "img": "images/productos/prod_11.png",
        "descripcion": "Excelente Lavarropas 6 KG Blanco con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "lavarropas_lunar_inverter_10_5kg_titanium_wifi": {
        "nombre": "Lavarropas Lunar Inverter 10.5KG Titanium WIFI",
        "precio": 790662,
        "img": "images/productos/prod_12.webp",
        "descripcion": "Excelente Lavarropas Lunar Inverter 10.5KG Titanium WIFI con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "lavarropas_lunar_inverter_8kg_titanium_wifi": {
        "nombre": "Lavarropas Lunar Inverter 8KG Titanium WIFI",
        "precio": 729999,
        "img": "images/productos/prod_13.png",
        "descripcion": "Excelente Lavarropas Lunar Inverter 8KG Titanium WIFI con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "lavavajillas_silver_12_cubiertos": {
        "nombre": "Lavavajillas Silver 12 cubiertos",
        "precio": 699999,
        "img": "images/productos/prod_14.jpg",
        "descripcion": "Excelente Lavavajillas Silver 12 cubiertos con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "lavavajillas_inox_14_cubiertos": {
        "nombre": "Lavavajillas Inox 14 cubiertos",
        "precio": 889999,
        "img": "images/productos/prod_15.jpg",
        "descripcion": "Excelente Lavavajillas Inox 14 cubiertos con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "aspiradora_robot_laser_smart_trapeadora": {
        "nombre": "Aspiradora Robot Laser Smart trapeadora",
        "precio": 679999,
        "img": "images/productos/prod_16.jpg",
        "descripcion": "Excelente Aspiradora Robot Laser Smart trapeadora con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "aspiradora_s_bolsa_1400w_blue": {
        "nombre": "Aspiradora S/Bolsa 1400W Blue",
        "precio": 149999,
        "img": "images/productos/prod_17.jpg",
        "descripcion": "Excelente Aspiradora S/Bolsa 1400W Blue con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "aspiradora_s_bolsa_2000w_flat_blue": {
        "nombre": "Aspiradora S/Bolsa 2000W Flat Blue",
        "precio": 189999,
        "img": "images/productos/prod_18.jpg",
        "descripcion": "Excelente Aspiradora S/Bolsa 2000W Flat Blue con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "aspiradora_stick_inal_mbrica_2_en_1": {
        "nombre": "Aspiradora Stick inalámbrica 2 en 1",
        "precio": 239999,
        "img": "images/productos/prod_19.jpg",
        "descripcion": "Excelente Aspiradora Stick inalámbrica 2 en 1 con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "aire_acondicionado_2503_frigor_as": {
        "nombre": "Aire acondicionado 2503 frigorías",
        "precio": 909999,
        "img": "images/productos/prod_20.jpg",
        "descripcion": "Excelente Aire acondicionado 2503 frigorías con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "ventilador_de_pie_blanco": {
        "nombre": "Ventilador de pie blanco",
        "precio": 119999,
        "img": "images/productos/prod_21.webp",
        "descripcion": "Excelente Ventilador de pie blanco con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "ventilador_de_pie_negro_20": {
        "nombre": "Ventilador de pie negro 20",
        "precio": 99999,
        "img": "images/productos/prod_22.jpg",
        "descripcion": "Excelente Ventilador de pie negro 20 con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "tostadora_el_ctrica": {
        "nombre": "Tostadora eléctrica",
        "precio": 49999,
        "img": "images/productos/prod_23.jpg",
        "descripcion": "Excelente Tostadora eléctrica con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "cafetera_1_25l_negra": {
        "nombre": "Cafetera 1.25L negra",
        "precio": 65999,
        "img": "images/productos/prod_24.jpg",
        "descripcion": "Excelente Cafetera 1.25L negra con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "batidora_de_mano_negra": {
        "nombre": "Batidora de mano negra",
        "precio": 65999,
        "img": "images/productos/prod_25.jpg",
        "descripcion": "Excelente Batidora de mano negra con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "licuadora_800w_inox": {
        "nombre": "Licuadora 800W Inox",
        "precio": 89999,
        "img": "images/productos/prod_26.jpg",
        "descripcion": "Excelente Licuadora 800W Inox con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "campana_extractora_de_humo_inox": {
        "nombre": "Campana extractora de humo Inox",
        "precio": 309999,
        "img": "images/productos/prod_27.webp",
        "descripcion": "Excelente Campana extractora de humo Inox con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "anafe_el_ctrico_negro": {
        "nombre": "Anafe eléctrico negro",
        "precio": 349999,
        "img": "images/productos/prod_28.webp",
        "descripcion": "Excelente Anafe eléctrico negro con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "air_fryer_4_5l": {
        "nombre": "Air Fryer 4.5L",
        "precio": 99999,
        "img": "images/productos/prod_29.jpg",
        "descripcion": "Excelente Air Fryer 4.5L con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "air_fryer_11l_negra_smart_digital": {
        "nombre": "Air Fryer 11L negra smart digital",
        "precio": 269999,
        "img": "images/productos/prod_30.webp",
        "descripcion": "Excelente Air Fryer 11L negra smart digital con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "licuadora_de_mano": {
        "nombre": "Licuadora de mano",
        "precio": 99999,
        "img": "images/productos/prod_31.jpg",
        "descripcion": "Excelente Licuadora de mano con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "horno_a_microondas_25_lts_digital_con_grill": {
        "nombre": "Horno a microondas 25 LTS digital con grill",
        "precio": 188591,
        "img": "images/productos/prod_32.jpg",
        "descripcion": "Excelente Horno a microondas 25 LTS digital con grill con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "pava_el_ctrica_1_7l_inox_digital": {
        "nombre": "Pava eléctrica 1.7L Inox digital",
        "precio": 69999,
        "img": "images/productos/prod_33.jpg",
        "descripcion": "Excelente Pava eléctrica 1.7L Inox digital con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "horno_el_ctrico_grill_40l": {
        "nombre": "Horno eléctrico grill 40L",
        "precio": 388749,
        "img": "images/productos/prod_34.webp",
        "descripcion": "Excelente Horno eléctrico grill 40L con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "tostadora_el_ctrica_negra": {
        "nombre": "Tostadora eléctrica negra",
        "precio": 59999,
        "img": "images/productos/prod_35.jpg",
        "descripcion": "Excelente Tostadora eléctrica negra con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "iphone_13": {
        "nombre": "iPhone 13",
        "precio": 850000,
        "img": "images/productos/iphone_13.png",
        "descripcion": "Sellado de fábrica, garantía oficial.",
        "specs": [
            "Oferta especial",
            "Stock limitado",
            "Excelente calidad"
        ],
        "currency": "ARS"
    },
    
    "seiko mods": {
        "nombre": "Seiko mods",
        "precio": 499999,
        "img": "images/productos/prod_38.png",
        "descripcion": "Excelente Seiko mod con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "airpods_pro_2": {
        "nombre": "Airpods Pro 2",
        "precio": 45000,
        "img": "images/productos/prod_41.jpg",
        "descripcion": "Excelente Airpods Pro 2 con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "soporte_magn_tico_extensible_para_celular_ventana_auto_espejo": {
        "nombre": "Soporte Magnético Extensible Para Celular Ventana, Auto, Espejo",
        "precio": 19999,
        "img": "images/productos/prod_42.webp",
        "descripcion": "Excelente Soporte Magnético Extensible Para Celular Ventana, Auto, Espejo con la mejor calidad garantizada por Palermo Tech.",
        "specs": [
            "Producto original",
            "Garantía de 6 meses",
            "Envío a todo el país"
        ],
        "currency": "ARS"
    },
    "iphone_17_256gb": {
        "nombre": "iPhone 17 256GB",
        "precio": 999,
        "img": "images/productos/iphone 17.webp",
        "descripcion": "Colores: white, blue, lavander, sage, black",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "iphone_17_pro_256gb": {
        "nombre": "iPhone 17 Pro 256GB",
        "precio": 1200,
        "img": "images/productos/iphone 17 pro.webp",
        "descripcion": "Colores: silver, orange, blue",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "iphone_17_pro_max_256gb_blue_silver": {
        "nombre": "iPhone 17 Pro Max 256GB (Blue, Silver)",
        "precio": 1340,
        "img": "images/productos/iphone 17 pro max.webp",
        "descripcion": "Colores: blue, silver",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "iphone_17_pro_max_256gb_orange": {
        "nombre": "iPhone 17 Pro Max 256GB (Orange)",
        "precio": 1330,
        "img": "images/productos/iphone 17 pro max orange.webp",
        "descripcion": "Color: orange",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "iphone_13_128gb": {
        "nombre": "iPhone 13 128GB",
        "precio": 550,
        "img": "images/productos/iphone_13.png",
        "descripcion": "midnight (gtia activada)",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "iphone_13_pro_128gb": {
        "nombre": "iPhone 13 Pro 128GB Grado A",
        "precio": 440,
        "img": "images/productos/iphone 13 pro.jpg",
        "descripcion": "Colores: blue, gold, graphite, green",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "cargador_apple_20w": {
        "nombre": "Cargador Apple 20W",
        "precio": 40,
        "img": "images/productos/cargador apple 20 w.webp",
        "descripcion": "Original Apple",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "cargador_apple_40w": {
        "nombre": "Cargador Apple 40W",
        "precio": 60,
        "img": "images/productos/cargador apple 40 w.webp",
        "descripcion": "Original Apple",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "samsung_s26_ultra_256gb": {
        "nombre": "Samsung S26 Ultra 256GB",
        "precio": 1180,
        "img": "images/productos/galaxy-s26-ultra-.jpg",
        "descripcion": "Colores: violet, black, blue",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "samsung_s26_ultra_512gb": {
        "nombre": "Samsung S26 Ultra 512GB",
        "precio": 1260,
        "img": "images/productos/galaxy-s26-ultra-.jpg",
        "descripcion": "Colores: black, blue",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "samsung_a17_256gb": {
        "nombre": "Samsung A17 8/256GB Dual Sim",
        "precio": 285,
        "img": "images/productos/A17-Gray.jpg",
        "descripcion": "Colores: gray, light blue",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "samsung_a37_256gb": {
        "nombre": "Samsung A37 8/256GB 5G",
        "precio": 455,
        "img": "images/productos/a 37.png",
        "descripcion": "Colores: graygreen, light violet, white",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "samsung_a57_512gb": {
        "nombre": "Samsung A57 12/512GB",
        "precio": 645,
        "img": "images/productos/a57.webp",
        "descripcion": "Colores: gray, violet, dark blue",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "macbook_m4_256gb": {
        "nombre": "Macbook M4 16/256GB",
        "precio": 1250,
        "img": "images/productos/macbook_1.jpg",
        "descripcion": "Colores: midnight, sky blue",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "macbook_m5_512gb": {
        "nombre": "Macbook M5 16/512GB",
        "precio": 1350,
        "img": "images/productos/macbook_2.jpg",
        "descripcion": "Colores: midnight, sky blue, silver, starlight",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "macbook_neo_256gb": {
        "nombre": "Macbook Neo 256GB",
        "precio": 850,
        "img": "images/productos/macbook_3.jpg",
        "descripcion": "Colores: citrus, indigo, blush",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "macbook_neo_512gb": {
        "nombre": "Macbook Neo 512GB",
        "precio": 950,
        "img": "images/productos/macbook_1.jpg",
        "descripcion": "Colores: citrus, indigo, silver, blush",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "ipad_a16_wifi_128gb": {
        "nombre": "iPad A16 WiFi 128GB",
        "precio": 540,
        "img": "images/productos/ipad 11.webp",
        "descripcion": "Colores: yellow, blue, pink",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "nintendo_switch_2_black": {
        "nombre": "Nintendo Switch 2 Black US",
        "precio": 700,
        "img": "images/productos/nintendo switch 2.avif",
        "descripcion": "Consola",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "sony_ps5_fisica_1tb": {
        "nombre": "Sony PS5 Fisica 1TB",
        "precio": 830,
        "img": "images/productos/playstation 5 astrobot.png",
        "descripcion": "Consola",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "sony_ps5_digital_825gb": {
        "nombre": "Sony PS5 Digital 825GB",
        "precio": 760,
        "img": "images/productos/playstation 5 digital.webp",
        "descripcion": "Consola",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "sony_ps5_digital_astro_1tb": {
        "nombre": "Sony PS5 Digital Astro Bot + Gran Turismo 1TB",
        "precio": 790,
        "img": "images/productos/playstation 5 astrobot.png",
        "descripcion": "Consola",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "sony_joystick_ps5_comunes": {
        "nombre": "Sony Joystick PS5 Comunes",
        "precio": 100,
        "img": "images/productos/prod_41.jpg",
        "descripcion": "Colores: White / Black / Red",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "sony_joystick_ps5_especial": {
        "nombre": "Sony Joystick PS5 Edición Especial",
        "precio": 140,
        "img": "images/productos/prod_41.jpg",
        "descripcion": "Modelos: ghost of yotei / astrobot",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    },
    "sony_vr2_horizon": {
        "nombre": "Sony VR2 Horizon",
        "precio": 580,
        "img": "images/productos/prod_22.jpg",
        "descripcion": "Realidad Virtual",
        "specs": [
            "Producto en stock",
            "Garantía oficial",
            "Precios en USD"
        ],
        "currency": "USD"
    }
,
    "airpods_pro_3": {
        "nombre": "Airpods Pro 3 Originales",
        "precio": 599999,
        "img": "images/productos/prod_41.jpg",
        "descripcion": "Airpods Pro 3 Originales",
        "specs": ["Originales", "Garantía", "Alta calidad"],
        "currency": "ARS"
    }
,
    "lavavajillas_blanco_14_cubiertos": {
        "nombre": "Lavavajillas Blanco 14 cubiertos",
        "precio": 699999,
        "img": "images/productos/imagen lavavajillas blanco 14.webp",
        "descripcion": "Excelente Lavavajillas Blanco 14 cubiertos con la mejor calidad garantizada por Palermo Tech.",
        "specs": ["Producto original", "Garantía de 6 meses", "Envío a todo el país"],
        "currency": "ARS"
    }
};
