import puppeteer from "puppeteer";
import fs from 'fs';
import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';

async function obtenerDatosSerieA() {
    console.log("Iniciando navegador...");

    const navegador = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const pagina = await navegador.newPage();
    await pagina.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    const datosTotales = [];
    let urlActual = "https://www.transfermarkt.es/premier-league/marktwerte/wettbewerb/GB1/pos//detailpos/0/altersklasse/alle/land_id/0/plus/1";
    const baseUrl = "https://www.transfermarkt.es";

    while (urlActual) {
        try {
            console.log(`Visitando: ${urlActual}`);
            await pagina.goto(urlActual, { waitUntil: 'domcontentloaded' });

            await pagina.waitForSelector('.items>tbody>tr.odd, .items>tbody>tr.even');

            const datos = await pagina.evaluate(() => {
                const filas = Array.from(document.querySelectorAll('.items>tbody>tr.odd, .items>tbody>tr.even'));
                return filas.map(fila => {
const nombre = fila.querySelector('.hauptlink a')?.innerText.trim();
                const edad = fila.querySelector('td.zentriert:nth-child(4)')?.innerText.trim();
                const posicion = fila.querySelector('td:nth-child(2) table.inline-table tr:last-child td')?.innerText.trim();
                const imagen = fila.querySelector('td:nth-child(1) img')?.getAttribute('data-src');
                const nacionalidadAlt = fila.querySelector('.flaggenrahmen')?.getAttribute('alt');
                const nacionalidad2Alt = fila.querySelector('.flaggenrahmen:nth-child(3)')?.getAttribute('alt');
                const nacionalidad = fila.querySelector('.flaggenrahmen')?.src;
                const nacionalidad2 = fila.querySelector('.flaggenrahmen:nth-child(3)')?.src;
                const club = fila.querySelector('.zentriert a img')?.src;
                const clubAlt = fila.querySelector('.zentriert a img')?.getAttribute('alt');
                const valorCarrera = fila.querySelector('td.rechts>span.cp')?.innerText.trim();
                const ultimaRevision = fila.querySelector('td.zentriert:nth-child(7)')?.innerText.trim();
                const valorMercado = fila.querySelector('.rechts.hauptlink')?.innerText.trim();

                    if (nombre && posicion && valorMercado) {
                        return {
                            nombre,
                            edad,
                            posicion,
                            imagen,
                            nacionalidadAlt,
                            nacionalidad,
                            nacionalidad2Alt,
                            nacionalidad2,
                            club,
                            clubAlt,
                            valorCarrera,
                            ultimaRevision,
                            valorMercado
                        };
                    }
                }).filter(Boolean);
            });

            datosTotales.push(...datos);

            const nextHref = await pagina.evaluate(() => {
                const nextBtn = document.querySelector('li.tm-pagination__list-item--icon-next-page a');
                return nextBtn ? nextBtn.getAttribute('href') : null;
            });

            urlActual = nextHref ? baseUrl + nextHref : null;

        } catch (err) {
            console.error("Error durante el scraping:", err.message);
            urlActual = null;
        }
    }

    await navegador.close();

    console.log("Datos obtenidos:", datosTotales.length);

    // Guardar JSON
    fs.writeFileSync('jugadores.json', JSON.stringify(datosTotales, null, 2), 'utf-8');
    console.log("::: jugadores.json CREADO :::");

    // Guardar CSV
    const camposCSV = [
        'nombre', 'edad', 'posicion', 'imagen',
        'nacionalidadAlt', 'nacionalidad', 'nacionalidad2Alt', 'nacionalidad2',
        'club', 'clubAlt', 'valorCarrera', 'ultimaRevision', 'valorMercado'
    ];

    const json2csv = new Parser({ fields: camposCSV, defaultValue: 'N/A' });
    const csv = json2csv.parse(datosTotales);
    fs.writeFileSync('jugadores.csv', csv, 'utf-8');
    console.log("::: jugadores.csv CREADO :::");

    // Guardar Excel (.xlsx)
    const worksheet = XLSX.utils.json_to_sheet(datosTotales);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jugadores');
    XLSX.writeFile(workbook, 'jugadores.xlsx');
    console.log("::: jugadores.xlsx CREADO :::");
}

obtenerDatosSerieA();
