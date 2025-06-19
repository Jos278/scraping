import puppeteer from "puppeteer";
import fs from 'fs';
import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';

async function obtenerDatos() {
    console.log("Iniciando navegador...");

    const navegador = await puppeteer.launch({
        headless: true,
        slowMo: 100
    });

    const pagina = await navegador.newPage();
    const numeroPaginas = 4;
    const datosTotales = [];

    for (let i = 0; i < numeroPaginas; i++) {
        let url = i === 0
            ? "https://www.transfermarkt.es/premier-league/marktwerte/wettbewerb/GB1/pos//detailpos/0/altersklasse/alle/land_id/0/plus/"
            : `https://www.transfermarkt.es/premier-league/marktwerte/wettbewerb/GB1/pos//detailpos/0/altersklasse/alle/land_id/0/plus/${i + 1}/`;

        console.log(`Visitando: ${url}`);
        await pagina.goto(url, { waitUntil: 'domcontentloaded' });

        const datos = await pagina.evaluate(() => {
            const filas = document.querySelectorAll('.items tbody tr');
            const jugadores = [];

            filas.forEach(fila => {
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
                    jugadores.push({
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
                    });
                }
            });

            return jugadores;
        });

        datosTotales.push(...datos);
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

obtenerDatos();
