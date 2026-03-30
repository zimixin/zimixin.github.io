#!/usr/bin/env python3
"""
Генерация Mermaid карты станций из JSON файла КБШ
"""

import json
from pathlib import Path

def make_id(name, section_idx):
    """Создание безопасного ASCII ID для Mermaid"""
    # Транслитерация кириллицы в латиницу
    translit = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
        'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '',
        'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    }
    
    # Транслитерируем
    safe_id = ''
    for char in name:
        safe_id += translit.get(char, char)
    
    # Удаляем все спецсимволы
    safe_id = safe_id.replace(' ', '_')
    safe_id = safe_id.replace('-', '_')
    safe_id = safe_id.replace('(', '')
    safe_id = safe_id.replace(')', '')
    safe_id = safe_id.replace('/', '_')
    safe_id = safe_id.replace('.', '')
    safe_id = safe_id.replace(',', '')
    safe_id = safe_id.replace(':', '')
    safe_id = safe_id.replace(';', '')
    safe_id = safe_id.replace('"', '')
    safe_id = safe_id.replace("'", '')
    safe_id = safe_id.replace('№', 'No')
    safe_id = safe_id.replace('&', '_')
    safe_id = safe_id.replace('?', '')
    safe_id = safe_id.replace('!', '')
    safe_id = safe_id.replace('км', 'km')
    safe_id = safe_id.replace('пк', 'pk')
    safe_id = safe_id.replace('м', 'm')
    
    # Удаляем двойные подчёркивания
    while '__' in safe_id:
        safe_id = safe_id.replace('__', '_')
    
    # Удаляем ведущие/замыкающие подчёркивания
    safe_id = safe_id.strip('_')
    
    # Добавляем индекс секции
    safe_id = f"{safe_id}_{section_idx}"
    
    # Если начинается с цифры, добавляем букву
    if safe_id and safe_id[0].isdigit():
        safe_id = f"N_{safe_id}"
    
    # Если пустой, создаём дефолтный
    if not safe_id:
        safe_id = f"node_{section_idx}"
    
    return safe_id

def generate_mermaid_map(json_file, output_file=None):
    """Генерация Mermaid диаграммы на основе JSON данных"""
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Начинаем Mermaid диаграмму
    mermaid = ["graph LR"]
    mermaid.append("    %% Стилизация")
    mermaid.append("    classDef station fill:#1976D2,color:#fff,stroke:#0D47A1,stroke-width:2px")
    mermaid.append("    classDef peregon fill:#388E3C,color:#fff,stroke:#1B5E20,stroke-width:1px")
    mermaid.append("    classDef section fill:#F57C00,color:#fff,stroke:#E65100,stroke-width:3px")
    mermaid.append("")
    
    prev_obj_id = None
    
    # Проходим по всем участкам (ограничим для читаемости)
    for section_idx, section in enumerate(data['участки'][:10]):
        section_name = section['название'].replace('Участок ', '').strip()
        section_id = f"Section{section_idx}"
        
        # Добавляем заголовок участка
        mermaid.append(f"    %% {section['название']}")
        mermaid.append(f"    subgraph {section_id}[\"📍 {section_name}\"]")
        mermaid.append("        class " + section_id + " section")
        mermaid.append("")
        
        for obj in section['объекты']:
            obj_name = obj['название']
            obj_type = obj['тип']
            
            # Создаём безопасный ID
            obj_id = make_id(obj_name, section_idx)
            
            # Экранируем текст для Mermaid (убираем скобки, кавычки)
            safe_text = obj_name.replace('(', '').replace(')', '').replace('"', "'").replace('[', '').replace(']', '')
            
            # Добавляем узел
            if obj_type == 'станция':
                mermaid.append(f'        {obj_id}["🚉 {safe_text}"]')
                mermaid.append(f"        class {obj_id} station")
            else:  # перегон
                mermaid.append(f'        {obj_id}["⮊ {safe_text}"]')
                mermaid.append(f"        class {obj_id} peregon")
            
            # Соединяем с предыдущим
            if prev_obj_id:
                mermaid.append(f"        {prev_obj_id} --> {obj_id}")
            
            prev_obj_id = obj_id
        
        mermaid.append("    end")
        mermaid.append("")
    
    # Соединяем участки между собой
    mermaid.append("    %% Соединения между участками")
    
    # Собираем все объекты для межучастковых соединений
    all_objects = []
    for section_idx, section in enumerate(data['участки'][:10]):
        for obj in section['объекты']:
            all_objects.append({
                'id': make_id(obj['название'], section_idx),
                'section_idx': section_idx
            })
    
    # Соединяем последний объект одного участка с первым следующего
    for i in range(len(all_objects) - 1):
        curr = all_objects[i]
        next_obj = all_objects[i + 1]
        
        if curr['section_idx'] != next_obj['section_idx']:
            mermaid.append(f"    {curr['id']} -.-> {next_obj['id']}")
    
    mermaid_code = "\n".join(mermaid)
    
    # Сохраняем в файл
    if output_file is None:
        output_file = 'stations-map.md'
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# 🗺️ Карта станций КБШ Н-122\n\n")
        f.write("## Основные участки\n\n")
        f.write("```mermaid\n")
        f.write(mermaid_code)
        f.write("\n```\n\n")
        f.write(f"\n**Всего участков:** {len(data['участки'])}\n")
        f.write(f"**Всего объектов:** {data['metadata']['всего_объектов']}\n")
        f.write(f"**Станций:** {data['metadata']['всего_станций']}\n")
        f.write(f"**Перегонов:** {data['metadata']['всего_перегонов']}\n")
    
    print(f"✅ Mermaid карта сохранена в {output_file}")
    print(f"📊 Участков показано: {min(10, len(data['участки']))} из {len(data['участки'])}")
    
    return mermaid_code


if __name__ == "__main__":
    generate_mermaid_map('data/участки-иерархия-v2.json', 'stations-map.md')
