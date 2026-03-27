#!/usr/bin/env python3
"""
Группировка данных КБШ по иерархической структуре v2:
Участок → [Станция, Перегон, Станция, ...] → Пути/Съезды

Сохраняет порядок следования объектов внутри участка
"""

import json
from pathlib import Path
from datetime import datetime


def load_data(json_file):
    """Загрузка JSON файла"""
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data[0]['data']


def is_station(col1):
    """Проверка, является ли запись станцией"""
    return isinstance(col1, str) and col1.startswith('Станция ')


def is_peregon(col1):
    """Проверка, является ли запись перегоном"""
    return isinstance(col1, str) and col1.startswith('Перегон ')


def is_uchastok(col1):
    """Проверка, является ли запись участком"""
    return isinstance(col1, str) and col1.startswith('Участок ')


def extract_speeds(row):
    """Извлечение скоростей из строки"""
    speeds = {}
    
    # Скорости на перегоне (колонки 5-8)
    if row.get('Column5'):
        speeds['пассажирские'] = row.get('Column5')
    if row.get('Column6'):
        speeds['грузовые_ускоренные'] = row.get('Column6')
    if row.get('Column7'):
        speeds['грузовые'] = row.get('Column7')
    if row.get('Column8'):
        speeds['грузовые_порожние'] = row.get('Column8')
    
    # Скорости на станции (колонки 9-12)
    if row.get('Column9'):
        speeds['пассажирские'] = row.get('Column9')
    if row.get('Column10'):
        speeds['грузовые_ускоренные'] = row.get('Column10')
    if row.get('Column11'):
        speeds['грузовые'] = row.get('Column11')
    if row.get('Column12'):
        speeds['грузовые_порожние'] = row.get('Column12')
    
    # Скорости на приемо-отправочных путях (колонки 13-14)
    if row.get('Column13'):
        speeds['пассажирские_приемоотправочные'] = row.get('Column13')
    if row.get('Column14'):
        speeds['грузовые_приемоотправочные'] = row.get('Column14')
    
    return speeds if speeds else None


def create_path_data(row, номер_записи):
    """Создание данных о пути"""
    path = {
        'номер_записи': номер_записи,
    }
    
    if row.get('Column2'):
        path['путь'] = int(row['Column2']) if isinstance(row['Column2'], (int, float)) else row['Column2']
    
    if row.get('Column3'):
        path['наименование'] = str(row['Column3']).strip()
    
    if row.get('Column4'):
        path['протяженность_км'] = row['Column4']
    
    # Извлечение скоростей
    speeds = extract_speeds(row)
    if speeds:
        path['скорости'] = speeds
    
    if row.get('Column15'):
        path['примечание'] = str(row['Column15']).strip()
    
    return path


def add_path_data(path, row):
    """Добавление дополнительных данных к существующему пути"""
    # Если есть новые данные, добавляем их как дополнительные поля
    if row.get('Column4') or row.get('Column3'):
        if 'дополнительно' not in path:
            path['дополнительно'] = []
        segment = {}
        if row.get('Column3'):
            segment['наименование'] = str(row['Column3']).strip()
        if row.get('Column4'):
            segment['протяженность_км'] = row.get('Column4')
        speeds = extract_speeds(row)
        if speeds:
            segment['скорости'] = speeds
        if row.get('Column15'):
            segment['примечание'] = str(row['Column15']).strip()
        path['дополнительно'].append(segment)

    return path


def create_sezd_data(row, номер_записи):
    """Создание данных о съезде"""
    sezd = {
        'номер_записи': номер_записи,
    }
    
    if row.get('Column2'):
        sezd['путь'] = int(row['Column2']) if isinstance(row['Column2'], (int, float)) else row['Column2']
    
    if row.get('Column3'):
        sezd['наименование'] = str(row['Column3']).strip()
    
    if row.get('Column4'):
        sezd['протяженность_км'] = row['Column4']
    
    # Скорости для съездов - все возможные колонки
    speeds = extract_speeds(row)
    if speeds:
        sezd['скорости'] = speeds
    
    if row.get('Column15'):
        sezd['примечание'] = str(row['Column15']).strip()
    
    return sezd


def group_by_sections_v2(records):
    """
    Группировка записей по участкам с сохранением порядка объектов.
    Структура: Участок → [Станция, Перегон, Станция, ...] → Пути/Съезды
    
    номер_записи - сквозная нумерация всех записей внутри секции
    """
    
    участки = []
    current_uchastok = None
    current_section = None  # Станция или Перегон
    current_section_data = None
    
    счетчик_записей = 0  # Счётчик для сквозной нумерации
    
    for i, row in enumerate(records):
        col1 = row.get('Column1')
        
        # Новый участок
        if is_uchastok(col1):
            # Сохраняем предыдущий участок
            if current_uchastok:
                if current_section_data:
                    # Добавляем последнюю секцию в объекты
                    current_section_data['тип'] = 'станция' if current_section.startswith('Станция') else 'перегон'
                    current_uchastok['объекты'].append(current_section_data)
                
                участки.append(current_uchastok)
            
            # Создаём новый участок
            current_uchastok = {
                'название': col1,
                'объекты': []  # Единый список станций и перегонов в порядке следования
            }
            current_section = None
            current_section_data = None
            счетчик_записей = 0
            continue
        
        # Новая станция
        if is_station(col1):
            # Сохраняем предыдущую секцию
            if current_section_data:
                current_section_data['тип'] = 'станция' if current_section.startswith('Станция') else 'перегон'
                current_uchastok['объекты'].append(current_section_data)
            
            # Создаём новую станцию
            current_section = col1
            current_section_data = {
                'название': col1.replace('Станция ', '').strip(),
                'пути': [],
                'съезды': []
            }
            счетчик_записей = 0
            continue
        
        # Новый перегон
        if is_peregon(col1):
            # Сохраняем предыдущую секцию
            if current_section_data:
                current_section_data['тип'] = 'станция' if current_section.startswith('Станция') else 'перегон'
                current_uchastok['объекты'].append(current_section_data)
            
            # Создаём новый перегон
            current_section = col1
            current_section_data = {
                'название': col1.replace('Перегон ', '').strip(),
                'пути': []
            }
            счетчик_записей = 0
            continue
        
        # Данные о пути или съезде
        if current_section_data:
            # Определяем тип записи
            is_path_with_number = isinstance(col1, (int, float))
            col2 = row.get('Column2')
            col3 = row.get('Column3')
            # Съезд: нет Column1 и Column2, но есть Column3 с текстом
            is_sezd = (col1 is None or col1 == '') and col2 is None and col3 is not None
            
            # Если есть Column1 (число) — это новая основная запись
            if is_path_with_number:
                счетчик_записей += 1
                номер_записи = счетчик_записей
                path_data = create_path_data(row, номер_записи)
                current_section_data['пути'].append(path_data)
            # Съезд: нет Column1, но есть Column3 с текстом
            elif (col1 is None or col1 == '') and is_sezd:
                счетчик_записей += 1
                номер_записи = счетчик_записей
                sezd_data = create_sezd_data(row, номер_записи)
                if 'съезды' in current_section_data:
                    current_section_data['съезды'].append(sezd_data)
                else:
                    # Для перегонов добавляем как 'дополнительно'
                    if 'дополнительно' not in current_section_data:
                        current_section_data['дополнительно'] = []
                    current_section_data['дополнительно'].append(sezd_data)
            # Путь без Column1 (дополнительные данные к предыдущему пути с тем же номером)
            elif isinstance(row.get('Column2'), (int, float)) and current_section_data['пути']:
                # Добавляем данные к последнему пути (как дополнительный сегмент)
                last_path = current_section_data['пути'][-1]
                # Проверяем, что Column2 совпадает (это тот же путь)
                last_put = last_path.get('путь')
                curr_put = row.get('Column2')
                if isinstance(last_put, (int, float)) and last_put == curr_put:
                    add_path_data(last_path, row)
                elif not isinstance(last_put, (int, float)):
                    # Последний путь имеет текст вместо номера - создаём новую запись
                    счетчик_записей += 1
                    номер_записи = счетчик_записей
                    path_data = create_path_data(row, номер_записи)
                    current_section_data['пути'].append(path_data)
    
    # Добавляем последний участок
    if current_uchastok and current_section_data:
        current_section_data['тип'] = 'станция' if current_section.startswith('Станция') else 'перегон'
        current_uchastok['объекты'].append(current_section_data)
        участки.append(current_uchastok)
    
    return участки


def main():
    input_file = 'data/КБШ Н-122 от 16.09.2025 (2) обновлен.json'
    output_file = 'data/участки-иерархия-v2.json'
    
    print(f"📄 Загрузка данных из {input_file}...")
    records = load_data(input_file)
    print(f"✓ Загружено записей: {len(records)}")
    
    print("\n🔄 Группировка по участкам (v2 - с сохранением порядка)...")
    участки = group_by_sections_v2(records)
    print(f"✓ Сгруппировано участков: {len(участки)}")
    
    # Подсчёт статистики
    total_objects = sum(len(u['объекты']) for u in участки)
    total_stations = sum(
        1 for u in участки 
        for obj in u['объекты'] 
        if obj.get('тип') == 'станция'
    )
    total_peregons = sum(
        1 for u in участки 
        for obj in u['объекты'] 
        if obj.get('тип') == 'перегон'
    )
    total_paths = sum(
        len(obj['пути']) for u in участки 
        for obj in u['объекты']
    )
    total_sezds = sum(
        len(obj.get('съезды', [])) for u in участки 
        for obj in u['объекты']
    )
    
    print(f"✓ Всего объектов: {total_objects}")
    print(f"✓ Станций: {total_stations}")
    print(f"✓ Перегонов: {total_peregons}")
    print(f"✓ Путей: {total_paths}")
    print(f"✓ Съездов: {total_sezds}")
    
    # Создание итогового объекта
    result = {
        'metadata': {
            'всего_участков': len(участки),
            'всего_объектов': total_objects,
            'всего_станций': total_stations,
            'всего_перегонов': total_peregons,
            'всего_путей': total_paths,
            'всего_съездов': total_sezds,
            'всего_записей_исходно': len(records),
            'дата_конвертации': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'источник': 'КБШ Н-122 от 16.09.2025 (2) обновлен.xlsx',
            'версия': '2.0 (с сохранением порядка объектов)'
        },
        'участки': участки
    }
    
    print(f"\n💾 Сохранение в {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Конвертация завершена!")
    print(f"📁 Выходной файл: {output_file}")


if __name__ == "__main__":
    main()
