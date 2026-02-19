# Railway Energy Consumption Calculator - Application Logic and Operation Guide

## Overview
This is a Progressive Web Application (PWA) for calculating railway energy consumption norms for freight trains. The application allows users to select locomotive types, input train parameters, and select routes to accurately calculate energy consumption.

## Core Application Logic

### 1. Main Components
- **EnergyCalculator Class**: Main controller managing form interactions and calculations
- **Data Module**: Handles locomotive and route data loading
- **Theme Manager**: Manages light/dark theme switching
- **PWA Manager**: Handles PWA functionality

### 2. Calculation Formula
```
Energy Consumption = (Train Weight × Energy Coefficient × Route Distance) / 10000 / 100
```

Where:
- **Train Weight**: Mass of the train in tons
- **Energy Coefficient**: Depends on locomotive type and axle load (individual per route or standard values)
- **Route Distance**: Route length in kilometers

### 3. Axle Load Calculation
```
Axle Load = Train Weight / Number of Axles
```
The axle load is rounded to the nearest integer to determine the appropriate coefficient from the tables.

### 4. Supported Locomotives
- **VL10U**: Length 32m, Standard coefficients: 89.5 - 65.15
- **2ES6**: Length 34m, Standard coefficients: 82.0 - 59.73
- **VL10K**: Length 30m
- **VL10UK**: Length 32m
- **VL10**: Length 32m

## Data Flow Process

### 1. Route Loading
- Automatically detects and loads all .md files from the `/data` folder
- Parses route information from Markdown files
- Updates the route dropdown with available options
- Each route file contains:
  - Route name
  - Distance
  - Travel time
  - Individual coefficients for each locomotive type

### 2. Real-time Calculation
- Performs calculations as users input data
- Validates form fields in real-time
- Updates results section dynamically
- Highlights the selected coefficient in the table

### 3. Coefficient Selection
- Prioritizes route-specific coefficients from data files
- Finds the closest matching axle load if exact match isn't available
- Falls back to standard coefficients if route-specific data isn't available

## Example Calculations

### Example 1: Basic Calculation
**Input Parameters:**
- Route: "Abdulino-Kinel" (233 km)
- Locomotive: VL10U
- Train Weight: 1191 tons
- Number of Axles: 120
- Actual Wagons: 15
- Conditional Wagons: 15

**Calculations:**
1. Axle Load = 1191 / 120 = 9.925 → Rounded to 10 tons/axle
2. From route data, VL10U coefficient for 10 tons/axle = 72.45
3. Energy Consumption = (1191 × 72.45 × 233) / 10000 / 100 = 20.11 kWh

**Output:**
- Energy Consumption: 20.11 kWh
- Axle Load: 9.93 tons/axle
- Train Length: (calculated if conditional wagons > 0)

### Example 2: Multiple Locomotives
**Input Parameters:**
- Route: "Moscow-Saint Petersburg" (650 km)
- Locomotives: 2 × VL10U, 1 × 2ES6 (one cold)
- Train Weight: 3500 tons
- Number of Axles: 180
- Conditional Wagons: 30

**Calculations:**
1. Axle Load = 3500 / 180 = 19.44 → Rounded to 19 tons/axle
2. Uses first active locomotive (VL10U) for calculation
3. From route data, VL10U coefficient for 19 tons/axle = 60.25
4. Energy Consumption = (3500 × 60.25 × 650) / 10000 / 100 = 137.07 kWh
5. Train Length = (2 × 32) + (1 × 32) + (30 × 14) = 504 m

**Output:**
- Energy Consumption: 137.07 kWh
- Axle Load: 19.44 tons/axle
- Train Length: 504 m

### Example 3: Cold Locomotive Scenario
**Input Parameters:**
- Route: "Abdulino-Syzran" (150 km)
- Locomotives: 1 × VL10U, 1 × Cold locomotive (X)
- Train Weight: 2000 tons
- Number of Axles: 100
- Conditional Wagons: 20

**Calculations:**
1. Axle Load = 2000 / 100 = 20 tons/axle
2. Uses active locomotive (VL10U) for calculation
3. From route data, VL10U coefficient for 20 tons/axle = 58.50
4. Energy Consumption = (2000 × 58.50 × 150) / 10000 / 100 = 17.55 kWh
5. Train Length = (1 × 32) + (1 × 32) + (20 × 14) = 344 m

**Output:**
- Energy Consumption: 17.55 kWh
- Axle Load: 20.00 tons/axle
- Train Length: 344 m

## UI Logic and Display

### 1. Form Validation
- Real-time validation of input fields
- Minimum/maximum value checks
- Axle load range validation (5-25 tons/axle)
- Required field validation

### 2. Dynamic Elements
- Route information display updates when route is selected
- Coefficient table shows relevant values for selected route
- Results section appears automatically when calculation is valid
- Locomotive cards allow adding/removing units

### 3. Results Display
- Energy consumption in kWh
- Axle load in tons/axle
- Train length in meters (when conditional wagons > 0)
- Export and save to history buttons appear after calculation

### 4. History Management
- Stores last 10 calculations in browser's localStorage
- Shows calculation date, parameters, and results
- Clear history functionality

### 5. Theme Management
- Light/dark theme toggle
- Theme preference saved in localStorage
- System preference detection

## Route Data Format

Routes are defined in Markdown files in the `/data` folder with the following format:

```
# Route Name
## Distance km
- Travel time hours

| axle load | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 |
|-----------|-- |-- |-- |-- |---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| VL10U     |89.5|83.41|78.85|75.29|72.45|70.13|68.19|66.55|65.15|63.85|62.65|61.55|60.55|59.65|58.85|58.15|57.55|
| 2ES6      |82.0|76.43|72.26|69.01|66.41|64.29|62.52|61.02|59.73|58.53|57.43|56.43|55.53|54.73|54.03|53.43|52.93|
```

## PWA Features
- Offline functionality via Service Worker
- Installable as a standalone app
- Responsive design for all device sizes
- Local storage for settings and history