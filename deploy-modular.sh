#!/bin/bash

# Cochran Films Modular Website Deployment Script
# This script helps deploy the modular website structure

echo "🚀 Cochran Films Modular Website Deployment"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "index-modular.html" ]; then
    echo "❌ Error: index-modular.html not found. Please run this script from the website root directory."
    exit 1
fi

# Create necessary directories if they don't exist
echo "📁 Creating directory structure..."
mkdir -p modules css js

# Check if modules directory has content
if [ ! "$(ls -A modules)" ]; then
    echo "⚠️  Warning: modules directory is empty. Some modules may not load properly."
fi

# Check if CSS directory has content
if [ ! "$(ls -A css)" ]; then
    echo "⚠️  Warning: CSS directory is empty. Styles may not load properly."
fi

# Check if JS directory has content
if [ ! "$(ls -A js)" ]; then
    echo "⚠️  Warning: JS directory is empty. Functionality may not work properly."
fi

# Test the modular website
echo "🧪 Testing modular website..."
if command -v python3 &> /dev/null; then
    echo "Starting local server with Python 3..."
    python3 -m http.server 8000 &
    SERVER_PID=$!
    echo "✅ Local server started at http://localhost:8000"
    echo "📱 Open index-modular.html in your browser to test"
    echo "🛑 Press Ctrl+C to stop the server"
    
    # Wait for user to stop
    trap "echo '🛑 Stopping server...'; kill $SERVER_PID; exit" INT
    wait
elif command -v python &> /dev/null; then
    echo "Starting local server with Python..."
    python -m SimpleHTTPServer 8000 &
    SERVER_PID=$!
    echo "✅ Local server started at http://localhost:8000"
    echo "📱 Open index-modular.html in your browser to test"
    echo "🛑 Press Ctrl+C to stop the server"
    
    # Wait for user to stop
    trap "echo '🛑 Stopping server...'; kill $SERVER_PID; exit" INT
    wait
else
    echo "ℹ️  No Python found. You can test the website by:"
    echo "   1. Opening index-modular.html in your browser"
    echo "   2. Using a local server extension in VS Code"
    echo "   3. Using Live Server in VS Code"
fi

echo ""
echo "✅ Deployment script completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Test the modular website in your browser"
echo "   2. Check the browser console for any errors"
echo "   3. Verify all modules are loading correctly"
echo "   4. Deploy to your hosting platform"
echo ""
echo "🔧 For production deployment:"
echo "   - Consider bundling CSS and JS files"
echo "   - Optimize images and assets"
echo "   - Set up proper caching headers"
echo "   - Test performance with tools like Lighthouse"
