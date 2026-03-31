// Глобальное состояние
const appState = {
    jsonData: null,
    currentSection: null,
    speedSegments: [],
    allPathSegments: [],
    trackProfile: [],
    objects: [],
    currentSpeedType: ['пассажирские', 'грузовые_ускоренные', 'грузовые', 'грузовые_порожние'],
    selectedPaths: [],
    availablePaths: [],
    config: { startKm: 0, endKm: 10, speedMax: 120, speedMin: 0 }
};

// Загрузка данных
async function loadData() {
    const loading = document.getElementById('loading');
    try {
        const response = await fetch('./data/speed-kbsh.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        appState.jsonData = await response.json();
        console.log('Данные загружены:', appState.jsonData.metadata);
        populateSectionSelector();
        loading.style.display = 'none';
    } catch (error) {
        console.error('Ошибка:', error);
        loading.innerHTML = `<div class="error-message">Ошибка: ${error.message}</div>`;
    }
}

// Заполнение селектора участков
function populateSectionSelector() {
    const select = document.getElementById('section-select');
    if (!appState.jsonData?.участки) return;
    
    appState.jsonData.участки.forEach((участок, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = участок.название;
        select.appendChild(option);
    });
    
    select.addEventListener('change', (e) => {
        const idx = parseInt(e.target.value);
        if (!isNaN(idx)) loadSection(idx);
    });
    
    if (appState.jsonData.участки.length > 0) {
        select.value = '0';
        loadSection(0);
    }
}

// Загрузка участка
function loadSection(index) {
    const участок = appState.jsonData.участки[index];
    appState.currentSection = участок;
    document.getElementById('station-display').textContent = участок.название;
    
    collectAvailablePaths(участок);
    populatePathSelector();
    generateProfileData(участок);
    
    if (window.renderer) window.renderer.resetView();
}

// Сбор путей
function collectAvailablePaths(участок) {
    const paths = new Set();
    участок.объекты.forEach(объект => {
        объект.пути?.forEach(путь => {
            paths.add(путь.путь || 1);
        });
    });
    appState.availablePaths = Array.from(paths).sort((a, b) => {
        const aNum = parseInt(a), bNum = parseInt(b);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        return String(a).localeCompare(String(b));
    });
    console.log('Пути:', appState.availablePaths);
}

// Заполнение селектора путей
function populatePathSelector() {
    const container = document.getElementById('path-selector');
    container.innerHTML = '';
    
    // По умолчанию выбираем все пути
    if (appState.selectedPaths.length === 0) {
        appState.selectedPaths = [...appState.availablePaths.map(String)];
    }
    
    appState.availablePaths.forEach(path => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" name="path-type" value="${path}" ${appState.selectedPaths.includes(String(path)) ? 'checked' : ''}> ${path} п.`;
        label.querySelector('input').addEventListener('change', (e) => {
            console.log('Путь', path, ':', e.target.checked);
            
            if (e.target.checked) {
                if (!appState.selectedPaths.includes(String(path))) {
                    appState.selectedPaths.push(String(path));
                }
            } else {
                appState.selectedPaths = appState.selectedPaths.filter(p => p !== String(path));
            }
            
            console.log('Выбрано путей:', appState.selectedPaths);
            generateProfileData(appState.currentSection);
            if (window.renderer) window.renderer.draw();
        });
        container.appendChild(label);
    });
}

// Настройка обработчика типов скоростей
function setupSpeedTypeHandler() {
    document.querySelectorAll('input[name="speed-type"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('input[name="speed-type"]');
            
            // Собираем выбранные типы
            appState.currentSpeedType = Array.from(checkboxes)
                .filter(c => c.checked)
                .map(c => c.value);
            
            // Если ничего не выбрано, выбираем все
            if (appState.currentSpeedType.length === 0) {
                appState.currentSpeedType = Array.from(checkboxes).map(c => c.value);
                checkboxes.forEach(c => c.checked = true);
            }
            
            console.log('Типы:', appState.currentSpeedType);
            
            const savedOffsetX = window.renderer?.offsetX || 0;
            const savedScaleX = window.renderer?.scaleX || 80;
            
            if (appState.currentSection) generateProfileData(appState.currentSection);
            if (window.renderer) {
                window.renderer.offsetX = savedOffsetX;
                window.renderer.scaleX = savedScaleX;
                window.renderer.draw();
            }
        });
    });
}

// Генерация данных
function generateProfileData(участок) {
    const objects = [];
    let minKm = Infinity, maxKm = 0;
    const allPathSegments = [];
    const rawSpeedSegments = [];
    
    // Находим диапазон км
    участок.объекты.forEach(объект => {
        объект.пути?.forEach(путь => {
            if (путь.наименование) {
                const match = путь.наименование.match(/(\d+)\s*км\s*(\d+)\s*пк\s*(\d+)\s*м\s*-\s*(\d+)\s*км\s*(\d+)\s*пк\s*(\d+)\s*м/);
                if (match) {
                    const startKm = parseInt(match[1]) + parseInt(match[2])/10 + parseInt(match[3])/1000;
                    const endKm = parseInt(match[4]) + parseInt(match[5])/10 + parseInt(match[6])/1000;
                    minKm = Math.min(minKm, startKm);
                    maxKm = Math.max(maxKm, endKm);
                }
            }
        });
    });
    
    if (minKm === Infinity) { minKm = 0; maxKm = 10; }
    appState.config.startKm = Math.floor(minKm);
    const totalDistance = maxKm - minKm;
    
    // Собираем сегменты
    участок.объекты.forEach(объект => {
        objects.push({ name: объект.название, type: объект.тип || 'станция' });
        
        объект.пути?.forEach(путь => {
            const pathNum = путь.путь || 1;
            const pathStr = String(pathNum);
            const isPathSelected = appState.selectedPaths.includes(pathStr);
            
            if (путь.наименование) {
                const match = путь.наименование.match(/(\d+)\s*км\s*(\d+)\s*пк\s*(\d+)\s*м\s*-\s*(\d+)\s*км\s*(\d+)\s*пк\s*(\d+)\s*м/);
                if (match) {
                    const startKm = parseInt(match[1]) + parseInt(match[2])/10 + parseInt(match[3])/1000;
                    const endKm = parseInt(match[4]) + parseInt(match[5])/10 + parseInt(match[6])/1000;
                    const startDist = startKm - appState.config.startKm;
                    const endDist = endKm - appState.config.startKm;
                    
                    if (путь.скорости) {
                        // Все пути (для верхней панели)
                        allPathSegments.push({
                            start: startDist, end: endDist,
                            speed: Object.values(путь.скорости)[0] || 0,
                            object: объект.название, path: pathNum,
                            note: путь.примечание, speeds: путь.скорости
                        });
                        
                        // Выбранные пути и типы (для скоростей)
                        if (isPathSelected && appState.currentSpeedType.length > 0) {
                            let maxSpeed = 0, maxSpeedType = appState.currentSpeedType[0];
                            for (const type of appState.currentSpeedType) {
                                let speed = путь.скорости[type] || 0;
                                if (путь.наименование.includes('Соед. путь') || путь.наименование.includes('П/о')) {
                                    speed = путь.скорости['пассажирские_приемоотправочные'] || путь.скорости['грузовые_приемоотправочные'] || speed;
                                }
                                if (speed > maxSpeed) { maxSpeed = speed; maxSpeedType = type; }
                            }
                            if (maxSpeed > 0 && endDist > startDist) {
                                rawSpeedSegments.push({
                                    start: startDist, end: endDist,
                                    speed: maxSpeed, speedType: maxSpeedType,
                                    object: объект.название, path: pathNum,
                                    note: путь.примечание, speeds: путь.скорости
                                });
                            }
                        }
                    }
                }
                
                // Дополнительные ограничения
                if (путь.дополнительно) {
                    путь.дополнительно.forEach(доп => {
                        const допMatch = доп.наименование.match(/(\d+)\s*км\s*(\d+)\s*пк\s*(\d+)\s*м\s*-\s*(\d+)\s*км\s*(\d+)\s*пк\s*(\d+)\s*м/);
                        if (допMatch) {
                            const допStart = parseInt(допMatch[1]) + parseInt(допMatch[2])/10 + parseInt(допMatch[3])/1000;
                            const допEnd = parseInt(допMatch[4]) + parseInt(допMatch[5])/10 + parseInt(допMatch[6])/1000;
                            
                            if (доп.скорости && appState.currentSpeedType.length > 0) {
                                let допSpeed = 0;
                                for (const type of appState.currentSpeedType) {
                                    const speed = доп.скорости[type] || 0;
                                    if (speed > допSpeed) допSpeed = speed;
                                }

                                allPathSegments.push({
                                    start: допStart - appState.config.startKm,
                                    end: допEnd - appState.config.startKm,
                                    speed: допSpeed, object: объект.название, path: pathNum,
                                    note: доп.примечание, isAdditional: true, speeds: доп.скорости
                                });

                                if (isPathSelected && допSpeed > 0) {
                                    rawSpeedSegments.push({
                                        start: допStart - appState.config.startKm,
                                        end: допEnd - appState.config.startKm,
                                        speed: допSpeed,
                                        speedType: appState.currentSpeedType[0] || 'пассажирские',
                                        object: объект.название, path: pathNum,
                                        note: доп.примечание, isAdditional: true, speeds: доп.скорости
                                    });
                                }
                            }
                        }
                    });
                }
            }
        });
    });
    
    // Сортировка и объединение
    rawSpeedSegments.sort((a, b) => a.start - b.start);
    const mergedSegments = [];
    for (let i = 0; i < rawSpeedSegments.length; i++) {
        const curr = rawSpeedSegments[i];
        const prev = mergedSegments[mergedSegments.length - 1];
        if (prev && Math.abs(prev.end - curr.start) < 0.001 && prev.speed === curr.speed && prev.object === curr.object && prev.path === curr.path) {
            prev.end = curr.end;
        } else {
            mergedSegments.push({...curr});
        }
    }
    
    if (mergedSegments.length === 0) {
        mergedSegments.push({ start: 0, end: 10, speed: 60, speeds: {}, speedType: 'пассажирские', path: 1 });
    }
    
    appState.speedSegments = mergedSegments;
    appState.allPathSegments = allPathSegments;
    appState.objects = objects;
    appState.config.endKm = appState.config.startKm + Math.ceil(totalDistance) + 1;
    
    // Профиль пути
    const profilePoints = [];
    let currentElev = 100;
    const numPoints = Math.ceil(totalDistance * 10) + 10;
    for (let i = 0; i <= numPoints; i++) {
        const dist = i / 10;
        const gradient = Math.sin(dist * 0.8) * 8 + Math.cos(dist * 2.5) * 4 + Math.sin(dist * 0.3) * 3;
        currentElev += (gradient / 1000) * 100;
        profilePoints.push({ dist, elev: currentElev, gradient });
    }
    appState.trackProfile = profilePoints;
    
    console.log('Сегменты:', mergedSegments.length, 'Все пути:', allPathSegments.length);
}

// Рендерер
class ProfileRenderer {
    constructor() {
        this.canvas = document.getElementById('profileCanvas');
        this.container = document.getElementById('canvas-container');
        this.ctx = this.canvas.getContext('2d');
        this.paddingTop = 120;
        this.paddingLeft = 70;
        this.paddingRight = 30;
        this.paddingBottom = 120;
        this.zeroLineY = 0;
        this.scaleX = 80;
        this.scaleElev = 25;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.hoveredSegment = null;
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.container.addEventListener('mouseleave', () => this.onMouseLeave());
        window.addEventListener('mouseup', () => this.onMouseUp());
        this.container.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        this.container.addEventListener('touchstart', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.touches[0].clientX;
        }, { passive: false });
        this.container.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            e.preventDefault();
            this.offsetX += e.touches[0].clientX - this.lastMouseX;
            this.lastMouseX = e.touches[0].clientX;
            this.draw();
        }, { passive: false });
        this.container.addEventListener('touchend', () => { this.isDragging = false; });
        this.draw();
    }
    
    resize() {
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
        this.draw();
    }
    
    distToScreenX(dist) { return this.paddingLeft + (dist * this.scaleX) + this.offsetX; }
    
    speedToScreenY(speed) {
        const normalized = speed / appState.config.speedMax;
        const speedChartHeight = this.zeroLineY - this.paddingTop;
        return this.zeroLineY - (normalized * speedChartHeight);
    }
    
    elevToScreenY(elev, baseElev) {
        const normalized = (elev - baseElev) / 15;
        return this.zeroLineY + (normalized * this.scaleElev);
    }
    
    screenXToDist(screenX) { return (screenX - this.paddingLeft - this.offsetX) / this.scaleX; }
    
    getSpeedAtDist(dist) {
        for (const seg of appState.speedSegments) {
            if (dist >= seg.start && dist < seg.end) return seg.speed;
        }
        return 0;
    }
    
    getGradientAtDist(dist) {
        const point = appState.trackProfile.find(p => Math.abs(p.dist - dist) < 0.1);
        return point ? point.gradient : 0;
    }
    
    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.zeroLineY = this.paddingTop + (height - this.paddingTop - this.paddingBottom) * 0.55;
        
        ctx.clearRect(0, 0, width, height);
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0a0a0f');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        const chartLeft = this.paddingLeft;
        const chartRight = width - this.paddingRight;
        
        this.drawGrid(ctx, chartLeft, chartRight);
        this.drawZeroLine(ctx, chartLeft, chartRight);
        this.drawSpeedProfile(ctx, chartLeft, chartRight);
        this.drawTrackProfile(ctx, chartLeft, chartRight);
        this.drawAxes(ctx, chartLeft, chartRight);
        this.updateInfoPanel();
    }
    
    drawGrid(ctx, left, right) {
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const totalDist = appState.config.endKm - appState.config.startKm;
        for (let i = 0; i <= totalDist; i += 0.2) {
            const x = this.distToScreenX(i);
            if (x >= left - 50 && x <= right + 50) {
                ctx.moveTo(x, this.paddingTop);
                ctx.lineTo(x, this.canvas.height - this.paddingBottom);
            }
        }
        ctx.stroke();
        
        ctx.strokeStyle = '#16213e';
        ctx.beginPath();
        for (let s = 20; s <= 120; s += 20) {
            const y = this.speedToScreenY(s);
            if (y > this.paddingTop && y < this.zeroLineY) {
                ctx.moveTo(left, y);
                ctx.lineTo(right, y);
            }
        }
        ctx.stroke();
    }
    
    drawZeroLine(ctx, left, right) {
        ctx.strokeStyle = '#0f3460';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(left, this.zeroLineY);
        ctx.lineTo(right, this.zeroLineY);
        ctx.stroke();
    }
    
    drawSpeedProfile(ctx, left, right) {
        const sortedSegments = [...appState.speedSegments].sort((a, b) => a.start - b.start);
        const allPathSegments = [...(appState.allPathSegments || [])].sort((a, b) => a.start - b.start);
        
        // ВЕРХНЯЯ ПАНЕЛЬ - ВСЕ пути (всегда отображается ВЫШЕ шкалы скоростей)
        const uniquePaths = [];
        for (const seg of allPathSegments) {
            const pathKey = seg.path || 1;
            if (!uniquePaths.includes(pathKey)) uniquePaths.push(pathKey);
        }
        uniquePaths.sort((a, b) => {
            const aNum = parseInt(a), bNum = parseInt(b);
            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
            return String(a).localeCompare(String(b));
        });
        uniquePaths.reverse(); // 1 путь внизу (ближе к шкале скоростей), выше 2, 3...
        
        const rowHeight = 20, rowSpacing = 3;
        const topStartY = this.paddingTop - (uniquePaths.length * (rowHeight + rowSpacing)) - 10;
        
        console.log('Рисуем пути, topStartY:', topStartY, 'paddingTop:', this.paddingTop, 'uniquePaths:', uniquePaths);
        
        uniquePaths.forEach((path, pathIndex) => {
            const rowY = topStartY + pathIndex * (rowHeight + rowSpacing);
            const pathSegments = allPathSegments.filter(s => (s.path || 1) === path);
            
            pathSegments.forEach(seg => {
                const x1 = this.distToScreenX(seg.start);
                const x2 = this.distToScreenX(seg.end);
                const width = Math.max(x2 - x1, 2);
                const isStation = !(seg.object.toLowerCase().includes('перегон') || seg.object.toLowerCase().includes('пп ') || seg.object.includes('-'));
                
                ctx.fillStyle = isStation ? 'rgba(255, 204, 0, 0.3)' : 'rgba(0, 210, 255, 0.3)';
                ctx.strokeStyle = isStation ? '#ffcc00' : '#00d2ff';
                ctx.fillRect(x1, rowY, width, rowHeight);
                ctx.lineWidth = 1;
                ctx.strokeRect(x1, rowY, width, rowHeight);
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 9px Consolas';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                let label = `${path}п.`;
                const shortName = seg.object.length > 15 ? seg.object.substring(0, 12) + '...' : seg.object;
                if (width > 60) label += ' ' + shortName;
                if (ctx.measureText(label).width > width - 4) {
                    while (label.length > 3 && ctx.measureText(label + '...').width > width - 4) label = label.slice(0, -1);
                    if (width > 40) label += '...';
                }
                ctx.fillText(label, x1 + width/2, rowY + rowHeight/2);
            });
        });
        
        // Скорости (только выбранные)
        const speedColors = {
            'пассажирские': '#ff3333',
            'грузовые_ускоренные': '#ffa500',
            'грузовые': '#ffff00',
            'грузовые_порожние': '#00ff00'
        };
        
        sortedSegments.forEach(seg => {
            const x1 = this.distToScreenX(seg.start);
            const x2 = this.distToScreenX(seg.end);
            const y = this.speedToScreenY(seg.speed);
            const width = Math.max(x2 - x1, 1);
            const color = speedColors[seg.speedType] || '#ff3333';
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineCap = 'square';
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x1 + width, y);
            ctx.stroke();
            
            // Подписи начала/конца только при наведении
            if (this.hoveredSegment === seg) {
                const absStart = (appState.config.startKm + seg.start).toFixed(1);
                const absEnd = (appState.config.startKm + seg.end).toFixed(1);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 9px Consolas';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                ctx.fillText(absStart, x1 + 2, y - 8);
                ctx.textAlign = 'right';
                ctx.fillText(absEnd, x2 - 2, y - 8);
            }
            
            // Подпись скорости
            if (width > 30 && this.hoveredSegment !== seg) {
                ctx.fillStyle = color;
                ctx.font = 'bold 11px Consolas';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(seg.speed.toString(), x1 + width/2, y - 6);
            }
        });
        
        // Подсветка при наведении
        if (this.hoveredSegment) {
            const xStart = this.distToScreenX(this.hoveredSegment.start);
            const xEnd = this.distToScreenX(this.hoveredSegment.end);
            const y = this.speedToScreenY(this.hoveredSegment.speed);
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(xStart, y);
            ctx.lineTo(xEnd, y);
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(255, 51, 51, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(xStart, y);
            ctx.lineTo(xStart, this.zeroLineY);
            ctx.moveTo(xEnd, y);
            ctx.lineTo(xEnd, this.zeroLineY);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    drawTrackProfile(ctx, left, right) {
        if (appState.trackProfile.length === 0) return;
        const elevs = appState.trackProfile.map(p => p.elev);
        const minElev = Math.min(...elevs);
        const baseElev = minElev - 2;
        
        ctx.beginPath();
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 2.5;
        appState.trackProfile.forEach((p, i) => {
            const x = this.distToScreenX(p.dist);
            const y = this.elevToScreenY(p.elev, baseElev);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        ctx.font = '11px Consolas';
        ctx.textAlign = 'center';
        for (let i = 0; i < appState.trackProfile.length; i += 5) {
            const p = appState.trackProfile[i];
            const x = this.distToScreenX(p.dist);
            const y = this.elevToScreenY(p.elev, baseElev);
            if (x > left && x < right) {
                ctx.fillStyle = p.gradient > 0 ? '#ff5555' : p.gradient < 0 ? '#00ff88' : '#ffffff';
                ctx.fillText(p.gradient.toFixed(1), x, y - 10);
            }
        }
    }
    
    drawAxes(ctx, left, right) {
        ctx.strokeStyle = '#0f3460';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(left, this.paddingTop);
        ctx.lineTo(left, this.canvas.height - this.paddingBottom);
        ctx.stroke();
        
        ctx.fillStyle = '#666';
        ctx.font = '11px Consolas';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let s = 0; s <= 120; s += 20) {
            const y = this.speedToScreenY(s);
            ctx.fillText(s.toString(), left - 8, y);
        }
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const totalDist = appState.config.endKm - appState.config.startKm;
        for (let km = 0; km <= totalDist; km++) {
            const x = this.distToScreenX(km);
            if (x > left && x < right) {
                ctx.beginPath();
                ctx.moveTo(x, this.zeroLineY - 5);
                ctx.lineTo(x, this.zeroLineY + 5);
                ctx.strokeStyle = '#66fcf1';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 13px Consolas';
                ctx.fillText((appState.config.startKm + km).toString(), x, this.zeroLineY + 10);
                
                if (this.scaleX > 60) {
                    ctx.font = '10px Consolas';
                    ctx.fillStyle = '#555';
                    for (let p = 1; p < 10; p++) {
                        const px = this.distToScreenX(km + p/10);
                        if (px > left && px < right) {
                            ctx.beginPath();
                            ctx.moveTo(px, this.zeroLineY - 3);
                            ctx.lineTo(px, this.zeroLineY + 3);
                            ctx.strokeStyle = '#333';
                            ctx.lineWidth = 1;
                            ctx.stroke();
                            ctx.fillText(p.toString(), px, this.zeroLineY + 10);
                        }
                    }
                }
            }
        }
    }
    
    updateInfoPanel() {
        const width = this.canvas.width;
        const centerDist = Math.max(0, this.screenXToDist(width / 2));
        const absPos = appState.config.startKm + centerDist;
        const currentSpeed = this.getSpeedAtDist(centerDist);
        const gradient = this.getGradientAtDist(centerDist);
        const zoomPercent = Math.round((this.scaleX / 80) * 100);
        
        document.getElementById('pos-value').textContent = absPos.toFixed(3) + ' км';
        document.getElementById('speed-value').textContent = (currentSpeed || 0) + ' км/ч';
        document.getElementById('limit-value').textContent = (currentSpeed || 0) + ' км/ч';
        document.getElementById('gradient-value').textContent = gradient.toFixed(1) + '‰';
        document.getElementById('gradient-value').style.color = gradient > 0 ? '#ff5555' : gradient < 0 ? '#00ff88' : '#66fcf1';
        document.getElementById('zoom-value').textContent = zoomPercent + '%';
    }
    
    onMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.container.style.cursor = 'grabbing';
    }
    
    onMouseMove(e) {
        if (this.isDragging) {
            this.offsetX += e.clientX - this.lastMouseX;
            this.lastMouseX = e.clientX;
            this.draw();
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const dist = this.screenXToDist(mouseX);
        
        let foundSegment = null;
        for (const seg of appState.speedSegments) {
            if (dist >= seg.start && dist <= seg.end) {
                const segY = this.speedToScreenY(seg.speed);
                if (Math.abs(mouseY - segY) < 20) {
                    foundSegment = seg;
                    break;
                }
            }
        }
        
        if (foundSegment !== this.hoveredSegment) {
            this.hoveredSegment = foundSegment;
            this.draw();
            this.updateTooltip(e.clientX, e.clientY, foundSegment);
        } else if (foundSegment) {
            this.updateTooltip(e.clientX, e.clientY, foundSegment);
        }
    }
    
    onMouseLeave() {
        this.hoveredSegment = null;
        document.getElementById('speed-tooltip').style.display = 'none';
        this.draw();
    }
    
    onMouseUp() {
        this.isDragging = false;
        this.container.style.cursor = 'grab';
    }
    
    updateTooltip(clientX, clientY, segment) {
        const tooltip = document.getElementById('speed-tooltip');
        if (!segment) {
            tooltip.style.display = 'none';
            return;
        }
        
        const speedTypeLabels = {
            'пассажирские': 'Пассажирские',
            'грузовые_ускоренные': 'Груз. ускоренные',
            'грузовые': 'Грузовые',
            'грузовые_порожние': 'Груз. порожние'
        };
        
        const allSpeeds = segment.speeds || {};
        let speedsHtml = '';
        Object.entries(allSpeeds).forEach(([type, speed]) => {
            if (speed && !type.includes('приемоотправочные')) {
                speedsHtml += `<div class="tooltip-row"><span class="tooltip-label">${speedTypeLabels[type] || type}:</span><span class="tooltip-value">${speed} км/ч</span></div>`;
            }
        });
        
        const absStart = (appState.config.startKm + segment.start).toFixed(3);
        const absEnd = (appState.config.startKm + segment.end).toFixed(3);
        
        tooltip.innerHTML = `
            <div class="tooltip-title">${segment.object || 'Участок'}</div>
            <div class="tooltip-row"><span class="tooltip-label">Путь:</span><span class="tooltip-value" style="color:#fff">${segment.path || 1} п.</span></div>
            <div class="tooltip-row"><span class="tooltip-label">Тип:</span><span class="tooltip-value" style="color:#fff">${speedTypeLabels[segment.speedType] || segment.speedType}</span></div>
            <div class="tooltip-row"><span class="tooltip-label">Диапазон:</span><span class="tooltip-value">${absStart} - ${absEnd} км</span></div>
            <div class="tooltip-row"><span class="tooltip-label">Длина:</span><span class="tooltip-value">${(segment.end - segment.start).toFixed(3)} км</span></div>
            <div class="tooltip-row"><span class="tooltip-label">Скорость:</span><span class="tooltip-value" style="color:#fff">${segment.speed} км/ч</span></div>
            ${speedsHtml ? `<div style="margin-top:8px;border-top:1px solid #1a1a2e;padding-top:8px"><div class="tooltip-row" style="border-bottom:none"><span class="tooltip-label">Все скорости:</span></div>${speedsHtml}</div>` : ''}
            ${segment.note ? `<div style="margin-top:8px;border-top:1px solid #1a1a2e;padding-top:8px"><div class="tooltip-row" style="border-bottom:none"><span class="tooltip-label">Примечание:</span></div><div style="color:#aaa;font-size:10px;margin-top:4px">${segment.note}</div></div>` : ''}
        `;
        
        const rect = this.canvas.getBoundingClientRect();
        let left = clientX - rect.left + 15;
        let top = clientY - rect.top + 15;
        if (left + 220 > rect.width) left = clientX - rect.left - 215;
        if (top + 250 > rect.height) top = clientY - rect.top - 265;
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.style.display = 'block';
    }
    
    onWheel(e) {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        const newScaleX = Math.max(20, Math.min(this.scaleX * (1 + delta), 400));
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const worldXBefore = (mouseX - this.paddingLeft - this.offsetX) / this.scaleX;
        this.scaleX = newScaleX;
        this.offsetX = mouseX - this.paddingLeft - worldXBefore * this.scaleX;
        this.draw();
    }
    
    zoomIn() {
        const newScaleX = Math.min(this.scaleX * 1.3, 400);
        const centerX = this.canvas.width / 2;
        const worldXBefore = (centerX - this.paddingLeft - this.offsetX) / this.scaleX;
        this.scaleX = newScaleX;
        this.offsetX = centerX - this.paddingLeft - worldXBefore * this.scaleX;
        this.draw();
    }
    
    zoomOut() {
        const newScaleX = Math.max(this.scaleX / 1.3, 20);
        const centerX = this.canvas.width / 2;
        const worldXBefore = (centerX - this.paddingLeft - this.offsetX) / this.scaleX;
        this.scaleX = newScaleX;
        this.offsetX = centerX - this.paddingLeft - worldXBefore * this.scaleX;
        this.draw();
    }
    
    resetView() {
        this.scaleX = 80;
        this.offsetX = 0;
        this.offsetY = 0;
        this.draw();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    window.renderer = new ProfileRenderer();
    window.appState = appState;
    setupSpeedTypeHandler();
});
