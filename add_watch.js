const fs = require('fs');

const file = 'app.js';
let appJs = fs.readFileSync(file, 'utf8');

const match = appJs.match(/const productos\s*=\s*(\{[\s\S]*?\});?\s*$/);
if (match) {
    let productos = new Function("return " + match[1])();

    if (!productos['reloj_seiko_mods']) {
        productos['reloj_seiko_mods'] = {
            "nombre": "Seiko Mods (varios modelos)",
            "precio": 499999,
            "img": "images/productos/prod_38.png",
            "descripcion": "Relojes de alta gama de la serie Seiko Mods, diseñados para destacar. Personalizados con los más altos estándares, ofrecen maquinaria automática de precisión, cristal de zafiro y un estilo que combina la elegancia clásica con el diseño deportivo.",
            "specs": [
                "Cristal de zafiro resistente a rayones",
                "Maquinaria automática de alta precisión",
                "Acero inoxidable de grado quirúrgico",
                "Garantía oficial y estuche premium"
            ],
            "currency": "ARS"
        };
    }
    
    // Y ya que estamos, asegurarnos que auriculares_bluetooth tenga buena foto
    if (productos['auriculares_bluetooth']) {
        productos['auriculares_bluetooth'].img = "images/productos/prod_41.jpg";
    }
    if (productos['iphone_13']) {
        productos['iphone_13'].img = "images/productos/prod_37.jpg";
    }

    const newProductosStr = 'const productos = ' + JSON.stringify(productos, null, 4) + ';';
    appJs = appJs.replace(/const productos\s*=\s*\{[\s\S]*?\};?\s*$/, newProductosStr + '\n');
    fs.writeFileSync(file, appJs, 'utf8');
    console.log("Reloj agregado a app.js");
}
