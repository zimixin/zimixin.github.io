// Railway Energy Calculator - Main Logic
// Handles form interactions and energy consumption calculations

class EnergyCalculator {
    constructor() {
        this.form = document.getElementById('calculatorForm');
        this.resultsSection = document.getElementById('resultsSection');
        this.historySection = document.getElementById('historySection');
        this.infoModal = document.getElementById('infoModal');
        this.currentResult = null;
        this.initializeEventListeners();
        this.loadHistory();
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
            wagonCount: formData.get('wagonCount') ? parseInt(formData.get('wagonCount')) : null
        };
    }

    calculateEnergyConsumption(data) {
        try {
            // Get locomotive and route data
            const locomotiveData = getLocomotiveData(data.locomotive);
            const routeData = getRouteData(data.route);

            if (!locomotiveData || !routeData) {
                return {
                    success: false,
                    error: 'Неверные данные локомотива или маршрута'
                };
            }

            // Calculate axle load (tons per axle)
            const axleLoad = data.trainWeight / data.axleCount;

            // Get energy coefficient based on axle load
            const coefficient = getEnergyCoefficient(data.locomotive, axleLoad);

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
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new EnergyCalculator();
    console.log('Energy Calculator initialized');
});