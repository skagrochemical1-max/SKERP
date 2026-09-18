# Cyber-Agri Formulation System

A professional, industrial-grade frontend web application for managing agrochemical formulations. Built with React, Vite, and Tailwind CSS, featuring a distinctive cyber-agricultural aesthetic.

## Features

### 🎛️ Formulations Dashboard
- View all formulations in a grid layout
- Search and filter by name, ingredient, or status
- Live statistics and metrics
- Quick actions: Edit, Duplicate, Delete, Calculate
- Status tracking (Stable, Testing, Archived)

### ⚗️ Formulation Editor
- Create and edit formulations
- Real-time validation
- Live percentage progress indicator
- Cost calculation
- Ingredient management
- Validation rules:
  - Minimum 2 ingredients
  - Total percentage must equal 100%
  - No negative values
  - All ingredients must be named

### 🧮 Batch Calculator
- Calculate batch quantities from formulations
- Dynamic recalculation
- Cost analysis
- Mixing protocol reference
- Print-friendly layout
- Unit conversion support

## Technology Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: React Context + Hooks
- **Language**: JavaScript (ES6+)
- **Fonts**: Inter (UI), JetBrains Mono (technical data)

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx
│   ├── Navigation.jsx
│   ├── Footer.jsx
│   ├── ProgressRing.jsx
│   └── StatusBadge.jsx
├── context/            # State management
│   └── FormulationContext.jsx
├── pages/              # Main application pages
│   ├── Dashboard.jsx
│   ├── FormulationEditor.jsx
│   └── BatchCalculator.jsx
├── utils/              # Utility functions
│   └── formulationUtils.js
├── App.jsx             # Main app component
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## Design System

### Color Palette
- **Cyber Dark**: `#0a0d12` - Main background
- **Cyber Panel**: `#14171d` - Panel backgrounds
- **Cyber Border**: `#1f2937` - Borders and dividers
- **Cyber Lime**: `#ccff00` - Primary accent
- **Cyber Emerald**: `#10b981` - Success/cost indicators

### Typography
- **Primary UI**: Inter (sans-serif)
- **Technical Data**: JetBrains Mono (monospace)

### Design Principles
- Industrial, technical aesthetic
- High contrast for readability
- Sharp edges, minimal rounding
- Subtle glows on interactive elements
- Laboratory-grade precision

## Data Model

### Formulation
```javascript
{
  id: string,
  name: string,
  baseVolume: number,
  baseUnit: 'L' | 'KG',
  status: 'Stable' | 'Testing' | 'Archived',
  ingredients: Ingredient[],
  createdDate: string (ISO)
}
```

### Ingredient
```javascript
{
  name: string,
  percentage: number,
  costPerUnit: number
}
```

## Features Highlights

- ✅ Frontend-only (no backend required)
- ✅ Local storage persistence
- ✅ Real-time validation
- ✅ Cost calculations
- ✅ Batch quantity calculations
- ✅ Responsive design
- ✅ Print support
- ✅ Search and filtering
- ✅ Professional UI/UX

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

© 2026 Cyber-Agri Systems

---

**Built for industrial formulation management with precision and reliability.**
