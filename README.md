# ColorCraft

An intelligent visual design companion that helps users explore, extract, and analyze color relationships from images or custom inputs.

## Features

- **Image Upload & Color Extraction**: Upload images and extract dominant colors using UMAP-based clustering
- **Manual Color Input**: Add custom colors via HEX/RGB input or color picker
- **Color Theory Analysis**: Analyze color harmonies (complementary, analogous, triadic, etc.)
- **Interactive Visualization**: Color wheel showing relationships between colors
- **Accessibility Metrics**: WCAG AA/AAA contrast ratings and accessibility insights

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- D3.js for color wheel visualization
- Vite for build tooling

### Backend
- Python FastAPI
- UMAP for dimensionality reduction
- scikit-learn for color clustering
- Color theory and accessibility algorithms

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.11+
- pip

### Installation

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```

The backend will run on `http://localhost:8000`

#### Frontend Setup
```bash
cd frontend
pnpm install
pnpm dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. Upload an image (JPG, PNG, or WebP)
2. Select the number of colors to extract (3-10)
3. Click "Find Colors" to extract dominant colors
4. Optionally add custom colors using the "+" button
5. Click "Apply Color Theory" to analyze color relationships
6. View the interactive color wheel, harmony tags, and accessibility metrics

## Project Structure

```
ColorCraft/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── color_extractor.py   # UMAP + KMeans color extraction
│   ├── color_theory.py      # Color harmony analysis
│   ├── accessibility.py     # WCAG contrast calculations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## License

MIT

