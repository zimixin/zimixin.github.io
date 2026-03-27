#!/usr/bin/env python3
"""
Excel в JSON конвертер - версия для КБШ с улучшенной обработкой заголовков
"""

import zipfile
import xml.etree.ElementTree as ET
import json
import sys
from pathlib import Path

def strip_ns(tag):
    """Удаление пространства имен из тега"""
    if '}' in tag:
        return tag.split('}')[1]
    return tag

def get_text(element):
    """Получение текста из элемента с учетом вложенных элементов"""
    if element is None:
        return None
    
    if element.text:
        return element.text.strip()
    
    for child in element:
        if strip_ns(child.tag) == 't' and child.text:
            return child.text.strip()
        text = get_text(child)
        if text:
            return text
    
    return None

def parse_shared_strings(zip_file):
    """Парсинг файла общих строк"""
    try:
        shared_strings_xml = zip_file.read('xl/sharedStrings.xml')
        root = ET.fromstring(shared_strings_xml)
        
        shared_strings = []
        
        for si in root.iter():
            if strip_ns(si.tag) == 'si':
                text = get_text(si)
                shared_strings.append(text if text else '')
        
        return shared_strings
    except Exception as e:
        print(f"⚠ Предупреждение при чтении sharedStrings: {e}")
        return []

def get_cell_value(cell, shared_strings):
    """Получение значения ячейки"""
    if cell is None:
        return None
    
    cell_type = cell.get('t')
    
    value_elem = None
    for child in cell.iter():
        if strip_ns(child.tag) == 'v':
            value_elem = child
            break
    
    if value_elem is None or not value_elem.text:
        return None
    
    value = value_elem.text.strip()
    
    if cell_type == 's':
        try:
            idx = int(value)
            return shared_strings[idx] if idx < len(shared_strings) else value
        except (ValueError, IndexError):
            return value
    elif cell_type == 'b':
        return value == '1'
    elif cell_type == 'n':
        try:
            return float(value) if '.' in value else int(value)
        except ValueError:
            return value
    elif cell_type == 'str':
        return value
    else:
        try:
            return float(value) if '.' in value else int(value)
        except ValueError:
            return value

def parse_worksheet_detailed(zip_file, sheet_file, shared_strings):
    """Детальный парсинг листа с информацией о ячейках"""
    try:
        worksheet_xml = zip_file.read(sheet_file)
        root = ET.fromstring(worksheet_xml)
        
        rows_data = []
        
        for row in root.iter():
            if strip_ns(row.tag) == 'row':
                row_num = row.get('r')
                row_values = []
                cell_refs = []
                
                for cell in row.iter():
                    if strip_ns(cell.tag) == 'c':
                        cell_ref = cell.get('r')  # A1, B1, etc.
                        value = get_cell_value(cell, shared_strings)
                        row_values.append(value)
                        cell_refs.append(cell_ref)
                
                if row_values:
                    rows_data.append({
                        'rowNum': row_num,
                        'cells': row_values,
                        'cellRefs': cell_refs
                    })
        
        return rows_data
        
    except Exception as e:
        print(f"⚠ Предупреждение при чтении листа: {e}")
        return None

def is_header_row(row_data):
    """Проверка, является ли строка заголовком таблицы"""
    cells = row_data['cells']
    
    # Заголовок обычно содержит короткие текстовые значения
    text_count = sum(1 for c in cells if isinstance(c, str) and c.strip())
    non_empty = sum(1 for c in cells if c is not None and c != '')
    
    # Если много текстовых полей и мало чисел - это заголовок
    return text_count > non_empty * 0.5 and non_empty > 3

def find_data_start_row(rows_data):
    """Поиск строки, где начинаются данные таблицы"""
    for i, row in enumerate(rows_data):
        cells = row['cells']
        
        # Ищем строку с номерами (1, 2, 3...) или типичными заголовками
        has_numbers = any(isinstance(c, (int, float)) for c in cells)
        has_short_text = any(isinstance(c, str) and len(str(c).strip()) < 20 and str(c).strip() for c in cells)
        
        if has_numbers and has_short_text:
            return i
    
    return 0

def convert_excel_to_json(excel_file, json_file=None):
    """Конвертация Excel файла в JSON"""
    
    excel_path = Path(excel_file)
    if not excel_path.exists():
        raise FileNotFoundError(f"❌ Файл не найден: {excel_file}")
    
    if json_file is None:
        json_file = excel_path.stem + '.json'
    
    print(f"📄 Обработка файла: {excel_path.name}")
    
    with zipfile.ZipFile(excel_file, 'r') as zip_file:
        shared_strings = parse_shared_strings(zip_file)
        print(f"✓ Загружено строк в словаре: {len(shared_strings)}")
        
        workbook_xml = zip_file.read('xl/workbook.xml')
        root = ET.fromstring(workbook_xml)
        
        sheets = []
        for elem in root.iter():
            if strip_ns(elem.tag) == 'sheet':
                sheet_name = elem.get('name')
                sheet_id = elem.get('sheetId')
                sheets.append({'name': sheet_name, 'id': sheet_id})
        
        print(f"✓ Найдено листов: {len(sheets)}")
        
        worksheet_files = sorted([
            n for n in zip_file.namelist() 
            if 'worksheets/sheet' in n and n.endswith('.xml')
        ])
        
        print(f"✓ Найдено файлов листов: {len(worksheet_files)}")
        
        result = []
        
        for idx, sheet_file in enumerate(worksheet_files):
            sheet_name = sheets[idx]['name'] if idx < len(sheets) else f"Лист{idx+1}"
            print(f"  📊 Обработка листа: {sheet_name}")
            
            rows_data = parse_worksheet_detailed(zip_file, sheet_file, shared_strings)
            
            if rows_data and len(rows_data) > 0:
                # Поиск начала данных
                data_start = find_data_start_row(rows_data)
                
                if data_start > 0:
                    print(f"    ℹ Заголовки найдены в строке {data_start + 1}")
                
                # Используем найденную строку как заголовки
                headers_row = rows_data[data_start]
                headers = headers_row['cells']
                
                # Создаем маппинг колонок
                data_rows = []
                for row_data in rows_data[data_start + 1:]:
                    row_dict = {}
                    cells = row_data['cells']
                    
                    for col_idx, value in enumerate(cells):
                        if col_idx < len(headers) and headers[col_idx] is not None:
                            header = str(headers[col_idx]).strip() if headers[col_idx] else f'Column{col_idx}'
                            if value is not None and value != '':
                                # Очищаем заголовок от лишних пробелов
                                header = ' '.join(header.split())
                                row_dict[header] = value
                    
                    if row_dict:
                        data_rows.append(row_dict)
                
                result.append({
                    'sheetName': sheet_name,
                    'headers': [' '.join(str(h).split()) if h else f'Column{i}' for i, h in enumerate(headers)],
                    'data': data_rows,
                    'rowCount': len(data_rows),
                    'metadata': {
                        'headerRow': data_start + 1,
                        'totalRows': len(rows_data)
                    }
                })
                
                print(f"    ✓ Строк данных: {len(data_rows)}")
                print(f"    ✓ Колонок: {len(headers)}")
        
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        total_records = sum(sheet['rowCount'] for sheet in result)
        print(f"\n✓ Конвертация завершена: {json_file}")
        print(f"✓ Листов: {len(result)}")
        print(f"✓ Всего записей: {total_records}")
        
        return json_file

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Использование: python excel-to-json-kbsh-v2.py <файл.xlsx> [выход.json]")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    json_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        convert_excel_to_json(excel_file, json_file)
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
