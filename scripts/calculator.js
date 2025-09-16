// Railway Energy Calculator - Main Logic
// Handles form interactions and energy consumption calculations

class EnergyCalculator {
    constructor() {
        this.form = document.getElementById('calculatorForm');
        this.resultsSection = document.getElementById('resultsSection');
        this.historySection = document.getElementById('historySection');
        this.infoModal = document.getElementById('infoModal');
        this.currentResult = null;
        this.customRoutes = {};
        this.initializeEventListeners();
        this.loadHistory();
        this.loadCustomRoutes();
        this.initializeRoutes();
    }

    initializeEventListeners() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Add real-time validation
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateField(input));
            input.addEventListener('blur', () => this.validateField(input));
        });

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportResult());
        }

        // Save to history button
        const saveBtn = document.getElementById('saveToHistoryBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveToHistory());
        }

        // Show info button
        const infoBtn = document.getElementById('showInfoBtn');
        if (infoBtn) {
            infoBtn.addEventListener('click', () => this.showInfoModal());
        }

        // Clear history button
        const clearBtn = document.getElementById('clearHistoryBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearHistory());
        }

        // Modal close button
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeInfoModal());
        }

        // Close modal on backdrop click
        if (this.infoModal) {
            this.infoModal.addEventListener('click', (e) => {
                if (e.target === this.infoModal) {
                    this.closeInfoModal();
                }
            });
        }

        // Route selection change
        const routeSelect = document.getElementById('route');
        if (routeSelect) {
            routeSelect.addEventListener('change', () => this.handleRouteChange());
        }

        // Custom routes management
        const loadCustomRoutesBtn = document.getElementById('loadCustomRoutesBtn');
        if (loadCustomRoutesBtn) {
            loadCustomRoutesBtn.addEventListener('click', () => this.parseAndLoadCustomRoutes());
        }

        const saveCustomRoutesBtn = document.getElementById('saveCustomRoutesBtn');
        if (saveCustomRoutesBtn) {
            saveCustomRoutesBtn.addEventListener('click', () => this.saveCustomRoutesToStorage());
        }

        const exportCustomRoutesBtn = document.getElementById('exportCustomRoutesBtn');
        if (exportCustomRoutesBtn) {
            exportCustomRoutesBtn.addEventListener('click', () => this.exportCustomRoutes());
        }

        const shareCustomRoutesBtn = document.getElementById('shareCustomRoutesBtn');
        if (shareCustomRoutesBtn) {
            shareCustomRoutesBtn.addEventListener('click', () => this.shareCustomRoutes());
        }
    }

    handleSubmit(event) {
        event.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        const formData = this.getFormData();
        const result = this.calculateEnergyConsumption(formData);
        
        if (result.success) {
            this.displayResults(result.data);
        } else {
            this.showError(result.error);
        }
    }

    getFormData() {
        const formData = new FormData(this.form);
        return {
            locomotive: formData.get('locomotive'),
            locomotiveCount: parseInt(formData.get('locomotiveCount')),
            trainWeight: parseFloat(formData.get('trainWeight')),
            axleCount: parseInt(formData.get('axleCount')),
            route: formData.get('route'),
            customRouteName: formData.get('customRouteName'),
            customRouteDistance: formData.get('customRouteDistance') ? parseInt(formData.get('customRouteDistance')) : null,
            wagonCount: formData.get('wagonCount') ? parseInt(formData.get('wagonCount')) : null
        };
    }

    calculateEnergyConsumption(data) {
        try {
            // Get locomotive data
            const locomotiveData = getLocomotiveData(data.locomotive);
            if (!locomotiveData) {
                return {
                    success: false,
                    error: 'Неверные данные локомотива'
                };
            }

            // Get route data (standard or custom)
            let routeData;
            if (data.route === 'custom') {
                if (!data.customRouteName || !data.customRouteDistance) {
                    return {
                        success: false,
                        error: 'Укажите название и расстояние пользовательского маршрута'
                    };
                }
                routeData = {
                    name: data.customRouteName,
                    distance: data.customRouteDistance,
                    description: 'Пользовательский маршрут'
                };
            } else if (this.customRoutes[data.route]) {
                routeData = this.customRoutes[data.route];
            } else {
                routeData = getRouteData(data.route) || ROUTE_DATA[data.route];
            }

            if (!routeData) {
                return {
                    success: false,
                    error: 'Неверные данные маршрута'
                };
            }

            // Calculate axle load (tons per axle)
            const axleLoad = data.trainWeight / data.axleCount;

            // Get energy coefficient based on axle load
            const coefficient = getEnergyCoefficient(data.locomotive, axleLoad, routeData);

            if (!coefficient) {
                return {
                    success: false,
                    error: 'Не удалось найти коэффициент для данной нагрузки на ось'
                };
            }

            // Calculate energy consumption using the formula:
            // (Weight * Coefficient * Distance) / 10000 / 100
            const energyConsumption = (data.trainWeight * coefficient * routeData.distance) / 10000 / 100;

            // Calculate train length if wagon count provided
            let trainLength = null;
            if (data.wagonCount !== null && data.wagonCount > 0) {
                trainLength = (locomotiveData.length * data.locomotiveCount) + (data.wagonCount * WAGON_LENGTH);
            }

            return {
                success: true,
                data: {
                    energyConsumption: energyConsumption,
                    axleLoad: axleLoad,
                    trainLength: trainLength,
                    coefficient: coefficient,
                    locomotive: locomotiveData,
                    route: routeData,
                    formData: data
                }
            };

        } catch (error) {
            console.error('Calculation error:', error);
            return {
                success: false,
                error: 'Ошибка при выполнении расчетов'
            };
        }
    }

    displayResults(data) {
        // Store current result
        this.currentResult = data;
        
        // Show results section
        this.resultsSection.style.display = 'block';
        this.resultsSection.classList.add('fade-in');

        // Update result values
        document.getElementById('consumptionResult').textContent = 
            `${data.energyConsumption.toFixed(2)} кВт⋅ч`;
        
        document.getElementById('axleLoadResult').textContent = 
            `${data.axleLoad.toFixed(2)} т/ось`;

        // Show train length if calculated
        const trainLengthCard = document.getElementById('trainLengthCard');
        if (data.trainLength !== null) {
            document.getElementById('trainLengthResult').textContent = 
                `${data.trainLength} м`;
            trainLengthCard.style.display = 'block';
        } else {
            trainLengthCard.style.display = 'none';
        }

        // Scroll to results
        this.resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    validateForm() {
        let isValid = true;
        const requiredFields = this.form.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(field) {
        const inputGroup = field.closest('.input-group');
        let isValid = true;
        let errorMessage = '';

        // Remove existing error classes and messages
        inputGroup.classList.remove('error', 'success');
        const existingError = inputGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Check if field is required and empty
        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
            errorMessage = 'Это поле обязательно для заполнения';
        }

        // Type-specific validation
        if (field.value.trim() && field.type === 'number') {
            const value = parseFloat(field.value);
            const min = parseFloat(field.min);
            const max = parseFloat(field.max);

            if (isNaN(value)) {
                isValid = false;
                errorMessage = 'Введите корректное число';
            } else if (min && value < min) {
                isValid = false;
                errorMessage = `Значение должно быть не менее ${min}`;
            } else if (max && value > max) {
                isValid = false;
                errorMessage = `Значение должно быть не более ${max}`;
            }
        }

        // Custom validation for specific fields
        if (field.name === 'axleCount' && field.value.trim()) {
            const trainWeight = parseFloat(document.getElementById('trainWeight').value);
            const axleCount = parseInt(field.value);
            
            if (trainWeight && axleCount) {
                const axleLoad = trainWeight / axleCount;
                if (axleLoad > 25) {
                    isValid = false;
                    errorMessage = 'Нагрузка на ось превышает допустимые значения (>25 т/ось)';
                } else if (axleLoad < 5) {
                    isValid = false;
                    errorMessage = 'Нагрузка на ось слишком мала (<5 т/ось)';
                }
            }
        }

        // Apply validation styles and messages
        if (isValid) {
            inputGroup.classList.add('success');
        } else {
            inputGroup.classList.add('error');
            if (errorMessage) {
                const errorElement = document.createElement('small');
                errorElement.className = 'error-message';
                errorElement.textContent = errorMessage;
                inputGroup.appendChild(errorElement);
            }
        }

        return isValid;
    }

    showError(message) {
        // Simple error display - could be enhanced with modal or toast
        alert(`Ошибка: ${message}`);
    }

    // Export functionality
    exportResult() {
        if (!this.currentResult) {
            this.showError('Нет данных для экспорта');
            return;
        }

        const data = this.currentResult;
        const exportData = [
            '=== Калькулятор норм расхода электроэнергии ===',
            `Дата: ${new Date().toLocaleString('ru-RU')}`,
            '',
            'Параметры расчета:',
            `- Локомотив: ${data.locomotive.name}`,
            `- Количество локомотивов: ${data.formData.locomotiveCount}`,
            `- Вес поезда: ${data.formData.trainWeight} т`,
            `- Количество осей: ${data.formData.axleCount}`,
            `- Маршрут: ${data.route.name} (${data.route.distance} км)`,
            data.formData.wagonCount ? `- Количество вагонов: ${data.formData.wagonCount}` : '',
            '',
            'Результаты:',
            `- Нагрузка на ось: ${data.axleLoad.toFixed(2)} т/ось`,
            `- Коэффициент энергопотребления: ${data.coefficient}`,
            `- Норма расхода за поездку: ${data.energyConsumption.toFixed(2)} кВт⋅ч`,
            data.trainLength ? `- Длина состава: ${data.trainLength} м` : '',
            '',
            'Формула расчета:',
            `(Вес × Коэффициент × Расстояние) / 10000 / 100`,
            `(${data.formData.trainWeight} × ${data.coefficient} × ${data.route.distance}) / 10000 / 100 = ${data.energyConsumption.toFixed(2)} кВт⋅ч`
        ].filter(line => line !== '').join('\n');

        // Create and download file
        const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `расчет_энергопотребления_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // History functionality
    saveToHistory() {
        if (!this.currentResult) {
            this.showError('Нет данных для сохранения');
            return;
        }

        const historyItem = {
            id: Date.now(),
            date: new Date().toLocaleString('ru-RU'),
            ...this.currentResult
        };

        let history = this.getHistory();
        history.unshift(historyItem);
        
        // Keep only last 10 items
        if (history.length > 10) {
            history = history.slice(0, 10);
        }

        this.setHistory(history);
        this.displayHistory();
        this.historySection.style.display = 'block';

        // Show success message
        alert('Расчет сохранен в историю');
    }

    getHistory() {
        try {
            return JSON.parse(localStorage.getItem('rzdCalculatorHistory') || '[]');
        } catch (e) {
            return [];
        }
    }

    setHistory(history) {
        try {
            localStorage.setItem('rzdCalculatorHistory', JSON.stringify(history));
        } catch (e) {
            console.warn('Cannot save to localStorage');
        }
    }

    loadHistory() {
        const history = this.getHistory();
        if (history.length > 0) {
            this.displayHistory();
            this.historySection.style.display = 'block';
        }
    }

    displayHistory() {
        const historyList = document.getElementById('historyList');
        const history = this.getHistory();

        if (history.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; opacity: 0.7;">История пуста</p>';
            return;
        }

        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-header">
                    <strong>${item.locomotive.name} - ${item.route.name}</strong>
                    <span class="history-date">${item.date}</span>
                </div>
                <div class="history-details">
                    Вес: ${item.formData.trainWeight}т, Оси: ${item.formData.axleCount}, 
                    Нагрузка: ${item.axleLoad.toFixed(2)}т/ось
                    ${item.trainLength ? `, Длина: ${item.trainLength}м` : ''}
                </div>
                <div class="history-result">
                    Норма: ${item.energyConsumption.toFixed(2)} кВт⋅ч
                </div>
            </div>
        `).join('');
    }

    clearHistory() {
        if (confirm('Удалить всю историю расчетов?')) {
            this.setHistory([]);
            this.displayHistory();
        }
    }

    // Modal functionality
    showInfoModal() {
        this.infoModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeInfoModal() {
        this.infoModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Custom Routes Management
    handleRouteChange() {
        const routeSelect = document.getElementById('route');
        const customRouteGroup = document.getElementById('customRouteGroup');
        const customRouteDistanceGroup = document.getElementById('customRouteDistanceGroup');

        if (routeSelect.value === 'custom') {
            customRouteGroup.style.display = 'block';
            customRouteDistanceGroup.style.display = 'block';
            customRouteGroup.classList.add('show');
            customRouteDistanceGroup.classList.add('show');
        } else {
            customRouteGroup.style.display = 'none';
            customRouteDistanceGroup.style.display = 'none';
            customRouteGroup.classList.remove('show');
            customRouteDistanceGroup.classList.remove('show');
        }
    }

    parseAndLoadCustomRoutes() {
        const customRoutesText = document.getElementById('customRoutesText').value.trim();
        
        if (!customRoutesText) {
            alert('Введите маршруты в текстовое поле');
            return;
        }

        try {
            const routes = this.parseMarkdownRoutes(customRoutesText);
            
            if (routes.length === 0) {
                alert('Не удалось распознать маршруты. Проверьте формат.');
                return;
            }

            // Add routes to custom routes storage
            routes.forEach(route => {
                const routeId = 'custom_' + route.name.toLowerCase().replace(/[^a-zа-я0-9]/gi, '_');
                this.customRoutes[routeId] = route;
            });

            this.updateRouteSelect();
            alert(`Загружено ${routes.length} маршрутов`);
        } catch (error) {
            console.error('Error parsing custom routes:', error);
            alert('Ошибка при обработке маршрутов: ' + error.message);
        }
    }

    parseMarkdownRoutes(text) {
        const routes = [];
        
        // Check for full markdown format first
        const fullFormatRoutes = this.parseFullMarkdownFormat(text);
        if (fullFormatRoutes.length > 0) {
            routes.push(...fullFormatRoutes);
        }
        
        // Then check for simple format
        const simpleFormatRoutes = this.parseSimpleFormat(text);
        routes.push(...simpleFormatRoutes);
        
        return routes;
    }

    parseFullMarkdownFormat(text) {
        const routes = [];
        const lines = text.split('\n');
        let currentRoute = null;
        let parsingTable = false;
        let headerParsed = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Parse route name (# Title)
            if (line.startsWith('#') && !line.startsWith('##')) {
                if (currentRoute) {
                    routes.push(currentRoute);
                }
                currentRoute = {
                    name: line.substring(1).trim(),
                    distance: 0,
                    description: 'Пользовательский маршрут с коэффициентами',
                    coefficients: {
                        vl10u: {},
                        es6: {}
                    }
                };
                parsingTable = false;
                headerParsed = false;
            }
            
            // Parse distance (## Distance)
            else if (line.startsWith('##') && currentRoute) {
                const distanceMatch = line.match(/##\s*(\d+)\s*км/);
                if (distanceMatch) {
                    currentRoute.distance = parseInt(distanceMatch[1]);
                }
            }
            
            // Parse table
            else if (line.startsWith('|') && currentRoute) {
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
                
                if (!headerParsed) {
                    // This should be the header row with axle loads
                    if (cells[0].includes('нагрузка')) {
                        headerParsed = true;
                        parsingTable = true;
                    }
                } else if (parsingTable && cells.length > 1) {
                    const locomotiveType = cells[0].toUpperCase();
                    
                    if (locomotiveType.includes('ВЛ10У') || locomotiveType.includes('VL10U')) {
                        // Parse ВЛ10У coefficients
                        for (let j = 1; j < cells.length && j <= 9; j++) {
                            const coeff = parseFloat(cells[j]);
                            if (!isNaN(coeff)) {
                                currentRoute.coefficients.vl10u[j + 5] = coeff; // j+5 because axle loads start from 6
                            }
                        }
                    } else if (locomotiveType.includes('2ЭС6') || locomotiveType.includes('ES6')) {
                        // Parse 2ЭС6 coefficients
                        for (let j = 1; j < cells.length && j <= 9; j++) {
                            const coeff = parseFloat(cells[j]);
                            if (!isNaN(coeff)) {
                                currentRoute.coefficients.es6[j + 5] = coeff; // j+5 because axle loads start from 6
                            }
                        }
                    }
                }
            }
        }
        
        // Add the last route if it exists
        if (currentRoute && currentRoute.distance > 0) {
            routes.push(currentRoute);
        }
        
        return routes.filter(route => 
            route.distance > 0 && 
            (Object.keys(route.coefficients.vl10u).length > 0 || Object.keys(route.coefficients.es6).length > 0)
        );
    }

    parseSimpleFormat(text) {
        const routes = [];
        const lines = text.split('\n').filter(line => line.trim());
        
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('|')) {
                return; // Skip markdown headers and table lines
            }

            const parts = trimmedLine.split('|').map(part => part.trim());
            if (parts.length === 2) {
                const name = parts[0];
                const distance = parseInt(parts[1]);

                if (!isNaN(distance) && distance > 0) {
                    routes.push({
                        name: name,
                        distance: distance,
                        description: 'Пользовательский маршрут'
                    });
                }
            }
        });
        
        return routes;
    }

    updateRouteSelect() {
        const routeSelect = document.getElementById('route');
        const currentValue = routeSelect.value;

        // Remove custom routes
        const customOptions = routeSelect.querySelectorAll('option[data-custom="true"]');
        customOptions.forEach(option => option.remove());

        // Add custom routes
        Object.keys(this.customRoutes).forEach(routeId => {
            const route = this.customRoutes[routeId];
            const option = document.createElement('option');
            option.value = routeId;
            option.textContent = `${route.name} (${route.distance} км)`;
            option.setAttribute('data-custom', 'true');
            routeSelect.appendChild(option);
        });

        // Restore selection if still valid
        if (currentValue && [...routeSelect.options].some(opt => opt.value === currentValue)) {
            routeSelect.value = currentValue;
        }
    }

    saveCustomRoutesToStorage() {
        try {
            localStorage.setItem('rzdCustomRoutes', JSON.stringify(this.customRoutes));
            alert('Маршруты сохранены');
        } catch (e) {
            alert('Ошибка сохранения');
        }
    }

    loadCustomRoutes() {
        try {
            const stored = localStorage.getItem('rzdCustomRoutes');
            if (stored) {
                this.customRoutes = JSON.parse(stored);
                this.updateRouteSelect();
                this.displayCustomRoutesInTextArea();
            }
        } catch (e) {
            console.warn('Could not load custom routes from localStorage');
        }
    }

    displayCustomRoutesInTextArea() {
        const customRoutesText = document.getElementById('customRoutesText');
        if (!customRoutesText) return;

        const routeLines = [];
        
        Object.values(this.customRoutes).forEach(route => {
            // Check if route has custom coefficients
            if (route.coefficients && (Object.keys(route.coefficients.vl10u || {}).length > 0 || Object.keys(route.coefficients.es6 || {}).length > 0)) {
                // Full format with coefficients
                routeLines.push(`# ${route.name}`);
                routeLines.push(`## ${route.distance} км`);
                routeLines.push('');
                routeLines.push('| нагрузка на ось | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |');
                
                if (route.coefficients.vl10u && Object.keys(route.coefficients.vl10u).length > 0) {
                    const vl10uRow = ['| ВЛ10У'];
                    for (let axle = 6; axle <= 14; axle++) {
                        vl10uRow.push(route.coefficients.vl10u[axle] || '-');
                    }
                    vl10uRow.push('|');
                    routeLines.push(vl10uRow.join(' | '));
                }
                
                if (route.coefficients.es6 && Object.keys(route.coefficients.es6).length > 0) {
                    const es6Row = ['| 2ЭС6'];
                    for (let axle = 6; axle <= 14; axle++) {
                        es6Row.push(route.coefficients.es6[axle] || '-');
                    }
                    es6Row.push('|');
                    routeLines.push(es6Row.join(' | '));
                }
                
                routeLines.push('');
            } else {
                // Simple format
                routeLines.push(`${route.name} | ${route.distance}`);
            }
        });
        
        if (routeLines.length > 0) {
            customRoutesText.value = routeLines.join('\n');
        }
    }

    exportCustomRoutes() {
        if (Object.keys(this.customRoutes).length === 0) {
            alert('Нет пользовательских маршрутов для экспорта');
            return;
        }

        const exportLines = [
            '# Пользовательские маршруты для калькулятора РЖД',
            `Экспортировано: ${new Date().toLocaleString('ru-RU')}`,
            ''
        ];

        Object.values(this.customRoutes).forEach(route => {
            exportLines.push(`# ${route.name}`);
            exportLines.push(`## ${route.distance} км`);
            exportLines.push('');
            
            // If route has custom coefficients, export full table
            if (route.coefficients && (Object.keys(route.coefficients.vl10u || {}).length > 0 || Object.keys(route.coefficients.es6 || {}).length > 0)) {
                exportLines.push('| нагрузка на ось | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |');
                
                if (route.coefficients.vl10u && Object.keys(route.coefficients.vl10u).length > 0) {
                    const vl10uRow = ['| ВЛ10У'];
                    for (let axle = 6; axle <= 14; axle++) {
                        vl10uRow.push(route.coefficients.vl10u[axle] || '-');
                    }
                    vl10uRow.push('|');
                    exportLines.push(vl10uRow.join(' | '));
                }
                
                if (route.coefficients.es6 && Object.keys(route.coefficients.es6).length > 0) {
                    const es6Row = ['| 2ЭС6'];
                    for (let axle = 6; axle <= 14; axle++) {
                        es6Row.push(route.coefficients.es6[axle] || '-');
                    }
                    es6Row.push('|');
                    exportLines.push(es6Row.join(' | '));
                }
            }
            
            exportLines.push('');
        });

        const exportData = exportLines.join('\n');
        const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `маршруты_РЖД_${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    shareCustomRoutes() {
        if (Object.keys(this.customRoutes).length === 0) {
            alert('Нет пользовательских маршрутов для отправки');
            return;
        }

        const routeLines = Object.values(this.customRoutes).map(route => 
            `${route.name} | ${route.distance}`
        ).join('\n');

        const emailSubject = 'Предложение новых маршрутов для калькулятора РЖД';
        const emailBody = `Привет!

Предлагаю добавить следующие маршруты в калькулятор:

${routeLines}

С уважением,
Пользователь калькулятора РЖД`;
        
        const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        
        // Also copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(routeLines).then(() => {
                alert('Маршруты скопированы в буфер обмена. Открываем почтового клиента...');
                window.open(mailtoLink);
            }).catch(() => {
                window.open(mailtoLink);
            });
        } else {
            window.open(mailtoLink);
        }
    }

    // Initialize routes from file system
    async initializeRoutes() {
        // Wait for routes to load from files
        setTimeout(() => {
            this.updateRouteSelectWithFileRoutes();
        }, 500); // Increased wait time to ensure files are loaded
        
        // Also try to reload after 2 seconds if no routes were found
        setTimeout(() => {
            if (Object.keys(ROUTE_DATA).length === 0) {
                console.log('No routes loaded, attempting to reload...');
                if (typeof loadRoutesFromFiles === 'function') {
                    loadRoutesFromFiles().then(() => {
                        this.updateRouteSelectWithFileRoutes();
                    });
                }
            }
        }, 2000);
    }

    updateRouteSelectWithFileRoutes() {
        const routeSelect = document.getElementById('route');
        if (!routeSelect) return;

        // Remove old standard routes except custom option
        const optionsToRemove = routeSelect.querySelectorAll('option:not([value=""]):not([value="custom"]):not([data-custom="true"])');
        optionsToRemove.forEach(option => option.remove());

        // Add routes from ROUTE_DATA (loaded from files)
        Object.keys(ROUTE_DATA).forEach(routeId => {
            const route = ROUTE_DATA[routeId];
            const option = document.createElement('option');
            option.value = routeId;
            option.textContent = `${route.name} (${route.distance} км)`;
            
            // Insert before custom option
            const customOption = routeSelect.querySelector('option[value="custom"]');
            routeSelect.insertBefore(option, customOption);
        });
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new EnergyCalculator();
    console.log('Energy Calculator initialized');
});