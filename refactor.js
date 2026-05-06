const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const dir = __dirname;
const imgDir = path.join(dir, 'images', 'productos');

if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
}

const renames = {
    'locales.html': 'tecnologia.html',
    'gastronomia.html': 'celulares.html',
    'entretenimientos.html': 'relojes.html',
    'servicios.html': 'electrodomesticos.html'
};

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') || f === 'app.js');

function downloadImage(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const protocol = url.startsWith('https') ? https : http;
        
        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadImage(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function processFiles() {
    let imageMap = {};
    let imageCounter = 1;

    for (const file of files) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Replace filenames
        for (const [oldName, newName] of Object.entries(renames)) {
            // regex to replace oldName
            content = content.replace(new RegExp(oldName, 'g'), newName);
        }

        // Specifically for app.js references that don't have .html
        if (file === 'app.js') {
            content = content.replace(/'locales'/g, "'tecnologia'");
            content = content.replace(/'gastronomia'/g, "'celulares'");
            content = content.replace(/'entretenimientos'/g, "'relojes'");
            content = content.replace(/'servicios'/g, "'electrodomesticos'");
        }

        // Find external images
        if (file.endsWith('.html')) {
            const imgRegex = /<img[^>]+src="([^"]+)"/g;
            let match;
            while ((match = imgRegex.exec(content)) !== null) {
                const url = match[1];
                if (url.startsWith('http')) {
                    if (!imageMap[url]) {
                        const ext = url.split('.').pop().split('?')[0].split('#')[0] || 'jpg';
                        // avoid weird extensions
                        const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext.toLowerCase()) ? ext.toLowerCase() : 'jpg';
                        const newFilename = `prod_${imageCounter++}.${safeExt}`;
                        imageMap[url] = newFilename;
                        
                        console.log(`Downloading ${url} to ${newFilename}`);
                        try {
                            await downloadImage(url, path.join(imgDir, newFilename));
                        } catch (err) {
                            console.error(`Error downloading ${url}:`, err.message);
                        }
                    }
                    content = content.replace(url, `images/productos/${imageMap[url]}`);
                }
            }
        }

        fs.writeFileSync(filePath, content, 'utf8');
    }
    console.log('Finished refactoring.');
}

processFiles();
