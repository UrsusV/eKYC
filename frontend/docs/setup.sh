#!/bin/bash

# Modern React + TypeScript + Vite Project Setup Script
# This script initializes a production-ready React application with:
# - React 18 + TypeScript + Vite
# - Tailwind CSS (JIT mode)
# - Storybook
# - Jest + React Testing Library
# - MSW (Mock Service Worker)
# - React Router

set -e

echo "🚀 Starting project setup..."

# Initialize package.json if it doesn't exist
if [ ! -f "package.json" ]; then
  echo "📦 Initializing package.json..."
  npm init -y
fi

echo "📦 Installing core dependencies..."
npm install react@^18.3.1 \
  react-dom@^18.3.1 \
  react-router-dom@^6.26.2

echo "📦 Installing development dependencies..."
npm install -D vite@^5.4.8 \
  @vitejs/plugin-react@^4.3.2 \
  typescript@^5.6.2 \
  @types/react@^18.3.11 \
  @types/react-dom@^18.3.0 \
  @types/node@^22.7.5

echo "🎨 Installing Tailwind CSS..."
npm install -D tailwindcss@^3.4.13 \
  postcss@^8.4.47 \
  autoprefixer@^10.4.20

echo "📚 Installing Storybook..."
npm install -D @storybook/react@^8.3.5 \
  @storybook/react-vite@^8.3.5 \
  @storybook/addon-essentials@^8.3.5 \
  @storybook/addon-interactions@^8.3.5 \
  @storybook/addon-links@^8.3.5 \
  @storybook/addon-onboarding@^8.3.5 \
  @storybook/blocks@^8.3.5 \
  @storybook/test@^8.3.5 \
  storybook@^8.3.5

echo "🧪 Installing Jest and Testing Library..."
npm install -D jest@^29.7.0 \
  @types/jest@^29.5.13 \
  ts-jest@^29.2.5 \
  @testing-library/react@^16.0.1 \
  @testing-library/jest-dom@^6.5.0 \
  @testing-library/user-event@^14.5.2 \
  jest-environment-jsdom@^29.7.0 \
  identity-obj-proxy@^3.0.0

echo "🌐 Installing MSW (Mock Service Worker)..."
npm install -D msw@^2.4.9

echo "🔧 Initializing MSW..."
npx msw init public/ --save

echo "✨ All dependencies installed successfully!"
echo ""
echo "📝 Next steps:"
echo "  1. Review generated configuration files"
echo "  2. Run 'npm run dev' to start development server"
echo "  3. Run 'npm run storybook' to start Storybook"
echo "  4. Run 'npm test' to run tests"
echo ""
echo "✅ Setup complete!"
