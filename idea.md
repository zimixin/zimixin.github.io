# Railway Energy Consumption Calculator for GitHub Pages

## Project Concept
Калькулятор норм расхода электроэнергии в грузовом движении на тягу поездов (Calculator for energy consumption standards in freight train traction)

## Core Formula
```
нагрузка на ось = вес поезда / количество осей
норма за поездку = (коэффициент * вес поезда * расстояние) / 10000 / 100
```

Where:
- **нагрузка на ось** (axle load) = train weight / number of axles
- **норма за поездку** (trip consumption standard) = (coefficient * train weight * distance) / 10000 / 100

## Routes and Coefficients

### Абдулино - Кинель (233 км)

| нагрузка на ось | 6     | 7     | 8     | 9     | 10    | 11    | 12    | 13    | 14    |
|-----------------|-------|-------|-------|-------|-------|-------|-------|-------|-------|
| **ВЛ10У**       | 89.5  | 83.41 | 78.85 | 75.29 | 72.45 | 70.13 | 68.19 | 66.55 | 65.15 |
| **2ЭС6**        | 82.0  | 76.43 | 72.26 | 69.01 | 66.41 | 64.29 | 62.52 | 61.02 | 59.73 |

## User Interface Requirements

### Input Fields:
1. **Locomotive Type Selection**:
   - ВЛ10У (length: 32m)
   - 2ЭС6 (length: 34m)
   - Number of locomotives

2. **Train Parameters**:
   - Train weight (вес поезда)
   - Number of axles (количество осей)
   - Route selection (маршрут)

3. **Train Composition (Optional)**:
   - Number of cars (условное число вагонов)
   - Automatic calculation: train length = locomotive length + (number of cars × 14m)
   - Car length: 14m each

### Output:
- Calculated energy consumption standard for the trip
- Train composition details (if car count provided)

## Technical Implementation
- **Platform**: GitHub Pages
- **Target**: Static website calculator
- **User Flow**: 
  1. Select locomotive type and quantity
  2. Enter train weight and axle count
  3. Choose route
  4. Optional: Enter car count for automatic length calculation
  5. Get calculated energy consumption result

## Future Expansion
The system is designed to handle additional routes and locomotive types as needed ("И не только" - and not only).