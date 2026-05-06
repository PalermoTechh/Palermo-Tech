const fs = require('fs');
const mapping = {
    'iphone_17_256gb': 'images/productos/iphone 17.webp',
    'iphone_17_pro_256gb': 'images/productos/iphone 17 pro.webp',
    'iphone_17_pro_max_256gb_blue_silver': 'images/productos/iphone 17 pro max.webp',
    'iphone_17_pro_max_256gb_orange': 'images/productos/iphone 17 pro max orange.webp',
    'iphone_13_128gb': 'images/productos/iphone_13.png',
    'iphone_13_pro_128gb': 'images/productos/iphone 13 pro.jpg',
    'cargador_apple_20w': 'images/productos/cargador apple 20 w.webp',
    'cargador_apple_40w': 'images/productos/cargador apple 40 w.webp',
    'samsung_s26_ultra_256gb': 'images/productos/galaxy-s26-ultra-.jpg',
    'samsung_s26_ultra_512gb': 'images/productos/galaxy-s26-ultra-.jpg',
    'samsung_a17_256gb': 'images/productos/A17-Gray.jpg',
    'samsung_a37_256gb': 'images/productos/a 37.png',
    'samsung_a57_512gb': 'images/productos/a57.webp',
    'redmi_15c': 'images/productos/prod_1.jpg',
    'redmi_14c': 'images/productos/prod_2.jpg',
    'pococ75': 'images/productos/prod_3.jpg',
    'macbook_m4_256gb': 'images/productos/macbook_air_13_m4_16gb_256gb_ssd_silver.jpg',
    'macbook_m5_512gb': 'images/productos/macbook m 5 512gb.webp',
    'macbook_neo_256gb': 'images/productos/macbook-neo.webp',
    'macbook_neo_512gb': 'images/productos/macbook-neo.webp',
    'ipad_a16_wifi_128gb': 'images/productos/ipad 11.webp',
    'nintendo_switch_2_black': 'images/productos/nintendo switch 2.avif',
    'sony_ps5_fisica_1tb': 'images/productos/playstation 5 astrobot.png',
    'sony_ps5_digital_825gb': 'images/productos/playstation 5 digital.webp',
    'sony_ps5_digital_astro_1tb': 'images/productos/playstation 5 astrobot.png',
    'sony_joystick_ps5_comunes': 'images/productos/ps5 joystick.jpg',
    'sony_joystick_ps5_especial': 'images/productos/joystick ps5 especial.jpg',
    'sony_vr2_horizon': 'images/productos/sony horizon.jpeg',
    'freezer_vertical_no_frost_230_lts': 'images/productos/prod_4.jpg',
    'heladera_c_clica_top_mount_240l_silver': 'images/productos/prod_5.jpg',
    'heladera_c_clica_top_mount_295l_blanca': 'images/productos/prod_6.jpg',
    'heladera_no_frost_inverter_top_mount_266l': 'images/productos/prod_7.jpg',
    'heladera_no_frost_inverter_top_mount_470l': 'images/productos/prod_8.jpg',
    'lavarropas_automatico_8kg_blanco': 'images/productos/prod_9.jpg',
    'lavarropas_automatico_10kg_blanco': 'images/productos/prod_10.png',
    'lavarropas_automatico_12kg_blanco': 'images/productos/prod_11.png',
    'lavavajillas_14_cubiertos_blanco': 'images/productos/prod_12.webp',
    'aspiradora_escoba_inalambrica_25_2l': 'images/productos/prod_13.png',
    'aspiradora_escoba_inalambrica_30_3l': 'images/productos/prod_14.jpg',
    'aspiradora_trineo_1600w_4l_blanca': 'images/productos/prod_15.jpg',
    'aspiradora_trineo_1800w_5l_blanca': 'images/productos/prod_16.jpg',
    'microondas_digital_20l_blanco': 'images/productos/prod_17.jpg',
    'microondas_digital_25l_blanco': 'images/productos/prod_18.jpg',
    'microondas_digital_30l_blanco': 'images/productos/prod_19.jpg',
    'cafetera_dolce_gusto_piccolo_xs': 'images/productos/prod_20.jpg',
    'cafetera_nespresso_essenza_mini': 'images/productos/prod_21.webp',
    'cafetera_nespresso_pixie': 'images/productos/prod_22.jpg',
    'tostadora_2_rebanadas_blanca': 'images/productos/prod_23.jpg',
    'tostadora_4_rebanadas_negra': 'images/productos/prod_24.jpg',
    'batidora_de_pie_5_velocidades_blanca': 'images/productos/prod_25.jpg',
    'licuadora_2l_blanca': 'images/productos/prod_26.jpg',
    'exprimidor_de_citricos_blanco': 'images/productos/prod_27.webp',
    'plancha_a_vapor_2400w_blanca': 'images/productos/prod_28.webp',
    'secador_de_pelo_2000w_negro': 'images/productos/prod_29.jpg',
    'depiladora_inalambrica_recargable': 'images/productos/prod_30.webp',
    'cepillo_electrico_oscillante': 'images/productos/prod_31.jpg',
    'cortadora_de_pelo_inalambrica': 'images/productos/prod_32.jpg',
    'maquina_de_coser_electronica_12_puntadas': 'images/productos/prod_33.jpg',
    'planchita_para_el_cabello_25mm': 'images/productos/prod_34.webp',
    'secador_de_pelo_viajero_1200w': 'images/productos/prod_35.jpg',
    'airpods_pro_2': 'images/productos/prod_41.jpg',
    'soporte_magnetico_extensible_celular_ventana_auto_espejo': 'images/productos/prod_42.webp',
    'macbook_m4_256gb': 'images/productos/macbook-air-13-m4-16gb-256gb-ssd-silver.jpg'
};

function updateHtmlFile(filename) {
    let html = fs.readFileSync(filename, 'utf8');
    for (let id in mapping) {
        let imgUrl = mapping[id];
        // match <img src="images/productos/prod_1.jpg" alt="iPhone 17 256GB">
        // that belongs to this specific ID
        // It's easier to just do simple split/replace logic
        let parts = html.split('detalle.html?id=' + id + "'");
        if (parts.length > 1) {
            let chunk = parts[1];
            let firstImgIndex = chunk.indexOf('<img src="');
            if (firstImgIndex !== -1) {
                let quoteEnd = chunk.indexOf('"', firstImgIndex + 10);
                if (quoteEnd !== -1) {
                    chunk = chunk.substring(0, firstImgIndex + 10) + imgUrl + chunk.substring(quoteEnd);
                    html = parts[0] + 'detalle.html?id=' + id + "'" + chunk;
                }
            }
        }
    }
    fs.writeFileSync(filename, html);
}

updateHtmlFile('celulares.html');
updateHtmlFile('tecnologia.html');

let appJs = fs.readFileSync('app.js', 'utf8');
let match = appJs.match(/const productos\s*=\s*(\{[\s\S]*?\});\s*function initDetalle/);
if (match) {
    let productos = JSON.parse(match[1]);
    for (let id in mapping) {
        if (productos[id]) {
            productos[id].img = mapping[id];
        }
    }
    const newProductosStr = 'const productos = ' + JSON.stringify(productos, null, 4) + ';';
    appJs = appJs.replace(/const productos\s*=\s*\{[\s\S]*?\};\s*(function initDetalle)/, newProductosStr + '\\n\\n$1');
    fs.writeFileSync('app.js', appJs);
}

let appCleanJs = fs.readFileSync('app_clean.js', 'utf8');
let match2 = appCleanJs.match(/const productos\s*=\s*(\{[\s\S]*?\});\s*function initDetalle/);
if (match2) {
    let productos2 = JSON.parse(match2[1]);
    for (let id in mapping) {
        if (productos2[id]) {
            productos2[id].img = mapping[id];
        }
    }
    const newProductosStr2 = 'const productos = ' + JSON.stringify(productos2, null, 4) + ';';
    appCleanJs = appCleanJs.replace(/const productos\s*=\s*\{[\s\S]*?\};\s*(function initDetalle)/, newProductosStr2 + '\\n\\n$1');
    fs.writeFileSync('app_clean.js', appCleanJs);
}

console.log("Images assigned!");
