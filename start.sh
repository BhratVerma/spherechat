#!/bin/bash
# SphereChat Quick Start Script
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║         SphereChat — Starting up         ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org"
  exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend && npm install

echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install

echo ""
echo "✅ All dependencies installed!"
echo ""
echo "Now run these in TWO separate terminals:"
echo ""
echo "  Terminal 1 (Backend):"
echo "  cd backend && npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:3000"
