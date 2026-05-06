const fs = require('fs');

// 1. DELETE VAPE IMAGE
try {
    if (fs.existsSync('images/productos/vape.png')) {
        fs.unlinkSync('images/productos/vape.png');
    }
} catch (e) {}

// 2. NEW CATALOG DATA
const newCelulares = [
    { id: 'iphone_17_256gb', nombre: 'iPhone 17 256GB', precio: 900, desc: 'Colores: white, blue, lavander, sage, black' },
    { id: 'iphone_17_pro_256gb', nombre: 'iPhone 17 Pro 256GB', precio: 1360, desc: 'Colores: silver, orange, blue' },
    { id: 'iphone_17_pro_max_256gb_blue_silver', nombre: 'iPhone 17 Pro Max 256GB (Blue, Silver)', precio: 1510, desc: 'Colores: blue, silver' },
    { id: 'iphone_17_pro_max_256gb_orange', nombre: 'iPhone 17 Pro Max 256GB (Orange)', precio: 1500, desc: 'Color: orange' },
    { id: 'iphone_13_128gb', nombre: 'iPhone 13 128GB', precio: 550, desc: 'midnight (gtia activada)' },
    { id: 'iphone_13_pro_128gb', nombre: 'iPhone 13 Pro 128GB Grado A', precio: 440, desc: 'Colores: blue, gold, graphite, green' },
    { id: 'cargador_apple_20w', nombre: 'Cargador Apple 20W', precio: 40, desc: 'Original Apple' },
    { id: 'cargador_apple_40w', nombre: 'Cargador Apple 40W', precio: 60, desc: 'Original Apple' },
    { id: 'samsung_s26_ultra_256gb', nombre: 'Samsung S26 Ultra 256GB', precio: 1250, desc: 'Colores: violet, black, blue' },
    { id: 'samsung_s26_ultra_512gb', nombre: 'Samsung S26 Ultra 512GB', precio: 1360, desc: 'Colores: black, blue' },
    { id: 'samsung_a17_256gb', nombre: 'Samsung A17 8/256GB Dual Sim', precio: 285, desc: 'Colores: gray, light blue' },
    { id: 'samsung_a37_256gb', nombre: 'Samsung A37 8/256GB 5G', precio: 455, desc: 'Colores: graygreen, light violet, white' },
    { id: 'samsung_a57_512gb', nombre: 'Samsung A57 12/512GB', precio: 645, desc: 'Colores: gray, violet, dark blue' }
];

const newTecnologia = [
    { id: 'macbook_m4_256gb', nombre: 'Macbook M4 16/256GB', precio: 1250, desc: 'Colores: midnight, sky blue', cat: 'notebooks' },
    { id: 'macbook_m5_512gb', nombre: 'Macbook M5 16/512GB', precio: 1350, desc: 'Colores: midnight, sky blue, silver, starlight', cat: 'notebooks' },
    { id: 'macbook_neo_256gb', nombre: 'Macbook Neo 256GB', precio: 820, desc: 'Colores: citrus, indigo, blush', cat: 'notebooks' },
    { id: 'macbook_neo_512gb', nombre: 'Macbook Neo 512GB', precio: 900, desc: 'Colores: citrus, indigo, silver, blush', cat: 'notebooks' },
    { id: 'ipad_a16_wifi_128gb', nombre: 'iPad A16 WiFi 128GB', precio: 490, desc: 'Colores: yellow, blue, pink', cat: 'notebooks' },
    { id: 'nintendo_switch_2_black', nombre: 'Nintendo Switch 2 Black US', precio: 700, desc: 'Consola', cat: 'perifericos' },
    { id: 'sony_ps5_fisica_1tb', nombre: 'Sony PS5 Fisica 1TB', precio: 780, desc: 'Consola', cat: 'perifericos' },
    { id: 'sony_ps5_digital_825gb', nombre: 'Sony PS5 Digital 825GB', precio: 700, desc: 'Consola', cat: 'perifericos' },
    { id: 'sony_ps5_digital_astro_1tb', nombre: 'Sony PS5 Digital Astro Bot + Gran Turismo 1TB', precio: 750, desc: 'Consola', cat: 'perifericos' },
    { id: 'sony_joystick_ps5_comunes', nombre: 'Sony Joystick PS5 Comunes', precio: 100, desc: 'Colores: White / Black / Red', cat: 'perifericos' },
    { id: 'sony_joystick_ps5_especial', nombre: 'Sony Joystick PS5 Edición Especial', precio: 140, desc: 'Modelos: ghost of yotei / astrobot', cat: 'perifericos' },
    { id: 'sony_vr2_horizon', nombre: 'Sony VR2 Horizon', precio: 580, desc: 'Realidad Virtual', cat: 'perifericos' }
];

// Generar fragmentos HTML sin template literals anidados
function generateHtml(items, defaultImg) {
    let html = '';
    for(let item of items) {
        let catStr = item.cat ? ' data-categoria="' + item.cat + '"' : '';
        html += '<div class="producto" style="cursor: pointer;" onclick="window.location.href=\\\'detalle.html?id=' + item.id + '\\\'"' + catStr + '>\n';
        html += '<img src="' + defaultImg + '" alt="' + item.nombre + '">\n';
        html += '<h3>' + item.nombre + '</h3>\n';
        html += '<p class="precio">USD $' + item.precio + '</p>\n';
        html += '</div>\n';
    }
    return html;
}

let celularesHtml = fs.readFileSync('celulares.html', 'utf8');
let listCelularesRegex = /(<div id="lista-celulares"[^>]*>)/;
celularesHtml = celularesHtml.replace(listCelularesRegex, '$1\n' + generateHtml(newCelulares, 'images/productos/prod_1.jpg'));
fs.writeFileSync('celulares.html', celularesHtml);

let techHtml = fs.readFileSync('tecnologia.html', 'utf8');
let listTechRegex = /(<div id="lista-locales"[^>]*>)/;
techHtml = techHtml.replace(listTechRegex, '$1\n' + generateHtml(newTecnologia, 'images/productos/macbook.png'));
fs.writeFileSync('tecnologia.html', techHtml);

// 3. UPDATE APP.JS
let appJs = fs.readFileSync('app.js', 'utf8');

appJs = appJs.replace(/'4', 'perfumes', 'vapes', 'electro'/g, "'4', 'perfumes', 'electro'");

let productosObjMatch = appJs.match(/const productos\s*=\s*(\{[\s\S]*?\});\s*function initDetalle/);
if (productosObjMatch) {
    let productos = JSON.parse(productosObjMatch[1]);
    
    if (productos['vape_elfbar']) {
        delete productos['vape_elfbar'];
    }

    for (let key in productos) {
        productos[key].currency = 'ARS';
    }

    const allNew = [...newCelulares, ...newTecnologia];
    allNew.forEach(item => {
        productos[item.id] = {
            nombre: item.nombre,
            precio: item.precio,
            img: newCelulares.includes(item) ? 'images/productos/prod_1.jpg' : 'images/productos/macbook.png',
            descripcion: item.desc,
            specs: ["Producto en stock", "Garantía oficial", "Precios en USD"],
            currency: 'USD'
        };
    });

    const newProductosStr = 'const productos = ' + JSON.stringify(productos, null, 4) + ';';
    appJs = appJs.replace(/const productos\s*=\s*\{[\s\S]*?\};\s*(function initDetalle)/, newProductosStr + '\n\n$1');
}

// Reemplazo del carrito usando splits para evitar problemas de comillas invertidas
const cartStartToken = "let carrito = JSON.parse(localStorage.getItem('carrito')) || [];";
const cartEndToken = "function injectAddButtons() {";

const p1 = appJs.split(cartStartToken)[0];
const p2 = appJs.split(cartEndToken)[1];

const newCart = `
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

function saveCart() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    updateCartCount();
}

function addToCart({ nombre, precio, currency }) {
    carrito.push({ nombre, precio, currency: currency || 'ARS' });
    saveCart();
    showToast('¡Producto agregado al carrito!');
}

function updateCartCount() {
    const counts = document.querySelectorAll('#cart-count');
    counts.forEach(c => c.textContent = carrito.length);
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.background = 'var(--accent-color)';
    toast.style.color = 'var(--accent-text)';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = 'var(--shadow-md)';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function openCartModal() {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';
    backdrop.id = 'cart-modal-backdrop';
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100vw';
    backdrop.style.height = '100vh';
    backdrop.style.background = 'rgba(0,0,0,0.5)';
    backdrop.style.zIndex = '1000';
    backdrop.style.display = 'flex';
    backdrop.style.alignItems = 'center';
    backdrop.style.justifyContent = 'center';
    
    const totalArs = carrito.filter(i => i.currency !== 'USD').reduce((acc, item) => acc + item.precio, 0);
    const totalUsd = carrito.filter(i => i.currency === 'USD').reduce((acc, item) => acc + item.precio, 0);
    
    let itemsHtml = '';
    for(let i=0; i<carrito.length; i++){
        let item = carrito[i];
        let pTxt = item.currency === 'USD' ? 'USD $' + item.precio : '$' + item.precio.toLocaleString('es-AR');
        itemsHtml += '<div style="display:flex; justify-content:space-between; margin-bottom: 10px; border-bottom: 1px solid var(--color-border); padding-bottom: 5px;"><span>' + item.nombre + '</span><span>' + pTxt + '</span><button onclick="removeFromCart(' + i + ')" style="background:none; border:none; color:red; cursor:pointer;">X</button></div>';
    }

    let modalHtml = '<div class="modal" style="background: var(--color-surface); color: var(--color-text); width: 90%; max-width: 500px; padding: 20px; border-radius: 12px; box-shadow: var(--shadow-lg);">';
    modalHtml += '<header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">';
    modalHtml += '<h2 style="margin:0;">Tu Carrito</h2>';
    modalHtml += '<button onclick="document.getElementById(\\'cart-modal-backdrop\\').remove()" style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--color-text);">✕</button>';
    modalHtml += '</header>';
    modalHtml += '<div style="max-height: 50vh; overflow-y:auto; margin-bottom: 20px;">';
    modalHtml += carrito.length === 0 ? '<p>Tu carrito está vacío.</p>' : itemsHtml;
    modalHtml += '</div>';

    if(carrito.length > 0) {
        modalHtml += '<div style="font-weight:bold; font-size:18px; margin-bottom:20px;">';
        if(totalArs > 0) modalHtml += '<div style="display:flex; justify-content:space-between;"><span>Total ARS:</span><span>$' + totalArs.toLocaleString('es-AR') + '</span></div>';
        if(totalUsd > 0) modalHtml += '<div style="display:flex; justify-content:space-between;"><span>Total USD:</span><span>USD $' + totalUsd.toLocaleString('es-AR') + '</span></div>';
        modalHtml += '</div>';
        modalHtml += '<button onclick="finalizeCheckout()" class="btn primary" style="width:100%; padding:15px; font-size:16px;">Finalizar Compra</button>';
        modalHtml += '<button onclick="clearCart()" class="btn" style="width:100%; margin-top:10px; background:var(--color-elev); color:var(--color-text);">Vaciar Carrito</button>';
    }
    modalHtml += '</div>';
    backdrop.innerHTML = modalHtml;
    document.body.appendChild(backdrop);
}

window.removeFromCart = function(index) {
    carrito.splice(index, 1);
    saveCart();
    document.getElementById('cart-modal-backdrop').remove();
    openCartModal();
};

window.clearCart = function() {
    carrito = [];
    saveCart();
    document.getElementById('cart-modal-backdrop').remove();
    openCartModal();
};

window.finalizeCheckout = function() {
    if (carrito.length === 0) return;
    const totalArs = carrito.filter(i => i.currency !== 'USD').reduce((acc, item) => acc + item.precio, 0);
    const totalUsd = carrito.filter(i => i.currency === 'USD').reduce((acc, item) => acc + item.precio, 0);
    
    let msg = '*¡Hola! Quiero realizar un pedido en Palermo Tech:*\\n\\n';
    carrito.forEach(item => {
        msg += '- ' + item.nombre + ': ' + (item.currency === 'USD' ? 'USD $' : '$') + item.precio.toLocaleString('es-AR') + '\\n';
    });
    
    msg += '\\n*Totales:*\\n';
    if (totalArs > 0) msg += '- ARS: $' + totalArs.toLocaleString('es-AR') + '\\n';
    if (totalUsd > 0) msg += '- USD: $' + totalUsd.toLocaleString('es-AR') + '\\n';
    
    msg += '\\n¿Cómo procedemos con el pago y envío?';
    
    const url = 'https://wa.me/5491112345678?text=' + encodeURIComponent(msg);
    window.open(url, '_blank');
    
    carrito = [];
    saveCart();
    document.getElementById('cart-modal-backdrop').remove();
};

function injectAddButtons() {
`;

appJs = p1 + newCart + p2;

// injectAddButtons updates
appJs = appJs.replace('addToCart({ nombre, precio });', 'addToCart({ nombre, precio, currency });');
const curRx = /precio = productos\[match\[1\]\]\.precio;/;
appJs = appJs.replace(curRx, "precio = productos[match[1]].precio;\n                currency = productos[match[1]].currency || 'ARS';");
appJs = appJs.replace('let precio = precioDataset || precioTexto;', "let precio = precioDataset || precioTexto;\n            let currency = 'ARS';");

const detRx = /document\.getElementById\('det-precio'\)\.textContent = \`\\\$\\\$\\{producto\.precio\.toLocaleString\('es-AR'\)\}\`;/;
appJs = appJs.replace(detRx, "document.getElementById('det-precio').textContent = producto.currency === 'USD' ? 'USD $' + producto.precio.toLocaleString('es-AR') : '$' + producto.precio.toLocaleString('es-AR');");

const detAddRx = /addToCart\(\{ nombre: producto\.nombre, precio: producto\.precio \}\);/;
appJs = appJs.replace(detAddRx, "addToCart({ nombre: producto.nombre, precio: producto.precio, currency: producto.currency || 'ARS' });");

fs.writeFileSync('app.js', appJs, 'utf8');

console.log('Catálogo actualizado');
