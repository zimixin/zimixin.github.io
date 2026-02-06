// Railway Energy Calculator - Main Logic
// Handles form interactions and energy consumption calculations

class EnergyCalculator {
    constructor() {
        this.form = document.getElementById('calculatorForm');
        this.resultsSection = document.getElementById('resultsSection');
        this.historySection = document.getElementById('historySection');
        this.infoModal = document.getElementById('infoModal');
        this.currentResult = null;
        this.locomotiveCount = 1;
        this.wagonCount = 1;
        this.locomotives = {};
        this.wagons = {};
        this.initializeEventListeners();
        this.loadHistory();
        this.initializeRoutes();
        this.setupRealTimeCalculation();
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
            routeSelect.addEventListener('change', () => {
                this.displayRouteInformation();
                this.performRealTimeCalculation();
            });
        }

        // Add locomotive button
        const addLocomotiveBtn = document.getElementById('addLocomotiveBtn');
        if (addLocomotiveBtn) {
            addLocomotiveBtn.addEventListener('click', () => this.addLocomotive());
        }
    }

    setupRealTimeCalculation() {
        // Set up event listeners for real-time calculation
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                // Delay calculation slightly to avoid too many recalculations
                clearTimeout(this.calculationTimeout);
                this.calculationTimeout = setTimeout(() => {
                    this.performRealTimeCalculation();
                }, 300);
            });
        });
    }

    performRealTimeCalculation() {
        // Check if all required fields are filled
        const routeSelect = document.getElementById('route');
        const trainWeight = document.getElementById('trainWeight');
        const trainAxles = document.getElementById('trainAxles');
        
        if (routeSelect && routeSelect.value && 
            trainWeight && trainWeight.value && 
            trainAxles && trainAxles.value) {
            
            const formData = this.getFormData();
            const result = this.calculateEnergyConsumption(formData);

            if (result.success) {
                this.displayResults(result.data);
            }
        }
    }

    addLocomotive() {
        this.locomotiveCount++;
        const locomotiveContainer = document.getElementById('locomotiveContainer');
        
        const locomotiveCard = document.createElement('div');
        locomotiveCard.className = 'locomotive-card-wrapper';
        locomotiveCard.id = `locomotiveCard${this.locomotiveCount}`;
        
        locomotiveCard.innerHTML = `
            <div class="locomotive-card locomotive-vl10u" onclick="toggleLocomotiveSelection(${this.locomotiveCount})">
                <div class="locomotive-info">
                    <h3>ВЛ10У</h3>
                    <p>Длина: 32м</p>
                </div>
            </div>
            <div class="locomotive-type-selector" id="locomotiveSelector${this.locomotiveCount}" style="display:none;">
                <div class="locomotive-option" onclick="selectLocomotiveType(${this.locomotiveCount}, 'vl10u', 'ВЛ10У', 32)">
                    <div class="locomotive-card locomotive-vl10u">
                        <div class="locomotive-info">
                            <h3>ВЛ10У</h3>
                            <p>Длина: 32м</p>
                        </div>
                    </div>
                </div>
                <div class="locomotive-option" onclick="selectLocomotiveType(${this.locomotiveCount}, '2es6', '2ЭС6', 34)">
                    <div class="locomotive-card locomotive-es6">
                        <div class="locomotive-info">
                            <h3>2ЭС6</h3>
                            <p>Длина: 34м</p>
                        </div>
                    </div>
                </div>
            </div>
            <button class="remove-locomotive-btn" onclick="removeLocomotive(${this.locomotiveCount})">×</button>
        `;
        
        locomotiveContainer.appendChild(locomotiveCard);
    }

    removeLocomotive(index) {
        const locomotiveCard = document.getElementById(`locomotiveCard${index}`);
        if (locomotiveCard) {
            locomotiveCard.remove();
            this.locomotiveCount--;
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
        // Collect locomotive data
        const locomotives = [];
        for (let i = 1; i <= this.locomotiveCount; i++) {
            const locomotiveType = document.querySelector(`#locomotiveCard${i} .locomotive-card`).getAttribute('data-type') || 'vl10u';
            const locomotiveName = document.querySelector(`#locomotiveCard${i} .locomotive-card h3`).textContent;
            const locomotiveLength = document.querySelector(`#locomotiveCard${i} .locomotive-card p`).textContent.replace('Длина: ', '').replace('м', '');
            
            locomotives.push({
                type: locomotiveType,
                name: locomotiveName,
                length: parseFloat(locomotiveLength)
            });
        }
        
        // Get train parameters
        const trainWeightInput = document.getElementById('trainWeight');
        const trainAxlesInput = document.getElementById('trainAxles');
        const actualWagonsInput = document.getElementById('actualWagons');
        const conditionalWagonsInput = document.getElementById('conditionalWagons');
        
        const routeSelect = document.getElementById('route');
        const wagonCountInput = document.getElementById('wagonCount');
        
        return {
            locomotives: locomotives,
            locomotiveCount: locomotives.length,
            trainWeight: parseFloat(trainWeightInput?.value) || 0,
            axleCount: parseInt(trainAxlesInput?.value) || 0,
            actualWagons: parseInt(actualWagonsInput?.value) || 0,
            conditionalWagons: parseInt(conditionalWagonsInput?.value) || 0,
            route: routeSelect ? routeSelect.value : '',
            wagonCount: wagonCountInput ? (parseInt(wagonCountInput.value) || null) : null
        };
    }

    calculateEnergyConsumption(data) {
        try {
            // Use the first locomotive for calculation (simplified approach)
            if (!data.locomotives || data.locomotives.length === 0) {
                return {
                    success: false,
                    error: 'Нет данных локомотива'
                };
            }
            
            const locomotiveData = data.locomotives[0]; // Using first locomotive for calculation
            
            // Get route data (standard routes only)
            let routeData = getRouteData(data.route) || ROUTE_DATA[data.route];

            if (!routeData) {
                return {
                    success: false,
                    error: 'Неверные данные маршрута'
                };
            }

            // Calculate axle load (tons per axle)
            if (data.axleCount === 0) {
                return {
                    success: false,
                    error: 'Количество осей не может быть 0'
                };
            }
            
            const axleLoad = data.trainWeight / data.axleCount;

            // Get energy coefficient based on axle load
            const coefficient = getEnergyCoefficient(locomotiveData.type, axleLoad, routeData);

            if (!coefficient) {
                return {
                    success: false,
                    error: 'Не удалось найти коэффициент для данной нагрузки на ось'
                };
            }

            // Calculate energy consumption using the formula:
            // (Weight * Coefficient * Distance) / 10000 / 100
            const energyConsumption = (data.trainWeight * coefficient * routeData.distance) / 10000 / 100;

            // Calculate train length using conditional wagons from train parameters
            let trainLength = null;
            if (data.conditionalWagons > 0) {
                trainLength = (locomotiveData.length * data.locomotiveCount) + (data.conditionalWagons * WAGON_LENGTH);
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
        if (field.name === 'trainAxles' && field.value.trim()) {
            const trainWeightInput = document.getElementById('trainWeight');
            const trainWeight = parseFloat(trainWeightInput?.value);
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
            `- Фактические вагоны: ${data.formData.actualWagons}`,
            `- Условные вагоны: ${data.formData.conditionalWagons}`,
            `- Маршрут: ${data.route.name} (${data.route.distance} км)`,
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
                    Факт. вагоны: ${item.formData.actualWagons}, Усл. вагоны: ${item.formData.conditionalWagons},
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


    // Route Information Display
    displayRouteInformation() {
        const routeSelect = document.getElementById('route');
        const routeInfoDisplay = document.getElementById('routeInfoDisplay');
        const selectedRouteName = document.getElementById('selectedRouteName');
        const selectedRouteDistance = document.getElementById('selectedRouteDistance');
        const coefficientsSection = document.getElementById('coefficientsSection');
        const noCoefficients = document.getElementById('noCoefficients');
        const coefficientsTableBody = document.getElementById('coefficientsTableBody');

        if (!routeSelect.value) {
            routeInfoDisplay.style.display = 'none';
            return;
        }

        // Get route data
        let routeData = getRouteData(routeSelect.value) || ROUTE_DATA[routeSelect.value];

        if (!routeData) {
            routeInfoDisplay.style.display = 'none';
            return;
        }

        // Display route information
        selectedRouteName.textContent = routeData.name;
        selectedRouteDistance.textContent = `${routeData.distance} км`;

        // Check if route has custom coefficients
        const hasCoefficients = routeData.coefficients &&
            (Object.keys(routeData.coefficients.vl10u || {}).length > 0 ||
             Object.keys(routeData.coefficients['2es6'] || {}).length > 0);

        if (hasCoefficients) {
            coefficientsSection.style.display = 'block';
            noCoefficients.style.display = 'none';
            this.populateCoefficientsTable(routeData.coefficients, coefficientsTableBody);
        } else {
            coefficientsSection.style.display = 'none';
            noCoefficients.style.display = 'block';
        }

        routeInfoDisplay.style.display = 'block';
        routeInfoDisplay.classList.add('fade-in');
    }

    populateCoefficientsTable(coefficients, tableBody) {
        tableBody.innerHTML = '';

        // Get all available axle loads
        const allAxleLoads = new Set();
        if (coefficients.vl10u) {
            Object.keys(coefficients.vl10u).forEach(load => allAxleLoads.add(parseInt(load)));
        }
        if (coefficients['2es6']) {
            Object.keys(coefficients['2es6']).forEach(load => allAxleLoads.add(parseInt(load)));
        }

        const sortedAxleLoads = Array.from(allAxleLoads).sort((a, b) => a - b);

        // Create rows for each locomotive type
        if (coefficients.vl10u && Object.keys(coefficients.vl10u).length > 0) {
            const vl10uRow = document.createElement('tr');
            vl10uRow.innerHTML = '<td>ВЛ10У</td>';

            // Add coefficients for axle loads 6-23
            for (let axle = 6; axle <= 23; axle++) {
                const cell = document.createElement('td');
                const value = coefficients.vl10u[axle];
                cell.textContent = value ? value.toString() : '-';
                if (!value) {
                    cell.style.opacity = '0.3';
                }
                vl10uRow.appendChild(cell);
            }

            tableBody.appendChild(vl10uRow);
        }

        if (coefficients['2es6'] && Object.keys(coefficients['2es6']).length > 0) {
            const es6Row = document.createElement('tr');
            es6Row.innerHTML = '<td>2ЭС6</td>';

            // Add coefficients for axle loads 6-23
            for (let axle = 6; axle <= 23; axle++) {
                const cell = document.createElement('td');
                const value = coefficients['2es6'][axle];
                cell.textContent = value ? value.toString() : '-';
                if (!value) {
                    cell.style.opacity = '0.3';
                }
                es6Row.appendChild(cell);
            }

            tableBody.appendChild(es6Row);
        }
    }

    // Initialize routes from file system
    async initializeRoutes() {
        // Wait a bit for routes to load from files
        setTimeout(() => {
            this.updateRouteSelectWithFileRoutes();
        }, 100); // Minimal wait time
    }

    updateRouteSelectWithFileRoutes() {
        const routeSelect = document.getElementById('route');
        if (!routeSelect) return;

        // Remove old standard routes
        const optionsToRemove = routeSelect.querySelectorAll('option:not([value=""])');
        optionsToRemove.forEach(option => option.remove());

        // Add routes from ROUTE_DATA (loaded from files)
        Object.keys(ROUTE_DATA).forEach(routeId => {
            const route = ROUTE_DATA[routeId];
            const option = document.createElement('option');
            option.value = routeId;
            option.textContent = `${route.name} (${route.distance} км)`;
            routeSelect.appendChild(option);
        });

        // If a route is currently selected, update its information display
        if (routeSelect.value && routeSelect.value !== '') {
            this.displayRouteInformation();
        }
    }
}

// Global functions for locomotive and wagon management
function toggleLocomotiveSelection(index) {
    const selector = document.getElementById(`locomotiveSelector${index}`);
    if (selector) {
        if (selector.style.display === 'none' || selector.style.display === '') {
            selector.style.display = 'block';
        } else {
            selector.style.display = 'none';
        }
    }
}

function selectLocomotiveType(index, type, name, length) {
    const locomotiveCard = document.querySelector(`#locomotiveCard${index} .locomotive-card`);
    if (locomotiveCard) {
        locomotiveCard.setAttribute('data-type', type);
        locomotiveCard.querySelector('h3').textContent = name;
        locomotiveCard.querySelector('p').textContent = `Длина: ${length}м`;
        
        // Update class based on locomotive type
        locomotiveCard.className = 'locomotive-card';
        if (type === 'vl10u') {
            locomotiveCard.classList.add('locomotive-vl10u');
        } else if (type === '2es6') {
            locomotiveCard.classList.add('locomotive-es6');
        }
        
        // Hide the selector after selection
        const selector = document.getElementById(`locomotiveSelector${index}`);
        if (selector) {
            selector.style.display = 'none';
        }
    }
}

function removeLocomotive(index) {
    if (window.calculator) {
        window.calculator.removeLocomotive(index);
    }
}


// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new EnergyCalculator();
    // Make calculator globally available for route updates
    window.calculator = calculator;
    console.log('Energy Calculator initialized');
});