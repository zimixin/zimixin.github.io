/**
 * Конвертер Excel в JSON для Node.js
 * Использование: node excel-to-json.js <input.xlsx> [output.json]
 */

const fs = require('fs');
const path = require('path');

// Проверка аргументов
const args = process.argv.slice(2);
if (args.length < 1) {
    console.error('Использование: node excel-to-json.js <input.xlsx> [output.json]');
    process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1] || path.basename(inputFile, '.xlsx') + '.json';

// Проверка существования файла
if (!fs.existsSync(inputFile)) {
    console.error(`❌ Файл не найден: ${inputFile}`);
    process.exit(1);
}

// Чтение Excel файла как ZIP архива
const ExcelJS = require('exceljs');

async function convertExcelToJson() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(inputFile);

        const result = [];

        workbook.eachSheet((worksheet, sheetId) => {
            console.log(`📄 Обработка листа: ${worksheet.name}`);

            const rows = [];
            worksheet.eachRow((row, rowNumber) => {
                const rowData = {};
                row.eachCell((cell, colNumber) => {
                    // Получаем заголовок из первой строки
                    const header = worksheet.getRow(1).getCell(colNumber).value;
                    const value = cell.value;
                    rowData[header || `Column${colNumber}`] = value;
                });
                rows.push(rowData);
            });

            result.push({
                sheetName: worksheet.name,
                data: rows
            });
        });

        // Сохранение JSON
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
        console.log(`✓ Конвертация завершена: ${outputFile}`);
        console.log(`✓ Листов: ${result.length}`);

    } catch (error) {
        console.error('❌ Ошибка при конвертации:', error.message);
        process.exit(1);
    }
}

// Альтернативный вариант без зависимостей - чтение как ZIP
async function convertExcelToJsonSimple() {
    const AdmZip = require('adm-zip');
    const xml2js = require('xml2js');

    try {
        const zip = new AdmZip(inputFile);
        const sharedStringsXml = zip.readAsText('xl/sharedStrings.xml');
        const worksheetXml = zip.readAsText('xl/worksheets/sheet1.xml');

        // Парсинг общих строк
        const stringsResult = await xml2js.parseStringPromise(sharedStringsXml);
        const sharedStrings = stringsResult.sst.si.map(s => {
            if (s.t) return s.t[0];
            if (s.r) return s.r.map(r => r.t ? r.t[0] : '').join('');
            return '';
        });

        // Парсинг worksheet
        const wsResult = await xml2js.parseStringPromise(worksheetXml);
        const rows = wsResult.worksheet.sheetData[0].row;

        const data = [];
        const headers = [];

        rows.forEach((row, idx) => {
            const rowData = {};
            if (row.c) {
                row.c.forEach((cell, cellIdx) => {
                    let value = '';
                    if (cell.v) {
                        value = cell.v[0];
                        // Если тип 's', это индекс в sharedStrings
                        if (cell.$.t === 's') {
                            value = sharedStrings[parseInt(value)];
                        }
                    }

                    if (idx === 0) {
                        headers[cellIdx] = value;
                    } else {
                        rowData[headers[cellIdx]] = value;
                    }
                });
                if (idx > 0) {
                    data.push(rowData);
                }
            }
        });

        fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');
        console.log(`✓ Конвертация завершена: ${outputFile}`);
        console.log(`✓ Записей: ${data.length}`);

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        console.log('\nПопробуйте установить зависимости:');
        console.log('npm install exceljs');
        console.log('или');
        console.log('npm install adm-zip xml2js');
        process.exit(1);
    }
}

// Запуск конвертации
convertExcelToJson().catch(() => convertExcelToJsonSimple());
