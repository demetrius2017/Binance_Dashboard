#!/bin/bash

echo "🚀 Starting Binance Real-Time Dashboard..."
echo ""

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "⚠️  Virtual environment not found. Run ./setup.sh first."
    echo ""
    read -p "Run setup now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./setup.sh
        source venv/bin/activate
    else
        exit 1
    fi
fi

echo ""
echo "Starting dashboard server..."
echo "Dashboard will be available at: http://localhost:5000"
echo "Press Ctrl+C to stop the server"
echo ""

python app.py
