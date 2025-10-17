# ColorCraft

An intelligent visual design companion that helps users explore, extract, and analyze color relationships from images or custom inputs.

## Features

- **Image Upload & Color Extraction**: Upload images and extract dominant colors using KMeans clustering in LAB color space
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
- scikit-learn for KMeans clustering
- LAB color space for perceptual accuracy
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

**Windows Users:** If you encounter any dependency issues, make sure you have the latest pip:
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

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
│   ├── color_extractor.py   # KMeans color extraction in LAB space
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

## API Endpoints

- `GET /` - Health check
- `POST /api/extract-colors` - Extract colors from uploaded image
- `POST /api/analyze-colors` - Analyze color theory and accessibility
- `POST /api/full-analysis` - Combined extraction and analysis

## Color Extraction Algorithm

ColorCraft uses a sophisticated color extraction approach:

1. **Image Preprocessing**: Resize to max 400px for performance
2. **Color Space Conversion**: Convert RGB to LAB color space for perceptual accuracy
3. **KMeans Clustering**: Cluster pixels in LAB space (20 initializations for stability)
4. **Representative Selection**: Use median color from each cluster for robustness
5. **Conversion**: Convert back to RGB, HEX, and HSL formats

## Troubleshooting

### Backend Issues

**Import errors or dependency conflicts:**
```bash
# Create a virtual environment (recommended)
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Port already in use:**
- Change the port in `backend/main.py` (last line)
- Update the proxy in `frontend/vite.config.ts` to match

### Frontend Issues

**pnpm not found:**
```bash
npm install -g pnpm
```

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Acknowledgments

- Color theory algorithms based on traditional color wheel mathematics
- WCAG 2.1 accessibility guidelines
- LAB color space for perceptual color clustering

