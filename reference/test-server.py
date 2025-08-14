#!/usr/bin/env python3
"""
Simple HTTP server for testing the Cochran Films Ops Hub
Run this script and open http://localhost:8000 in your browser
"""

import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    # Change to the directory containing this script
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Check if index.html exists
    if not Path('index.html').exists():
        print("❌ Error: index.html not found in current directory")
        print(f"Current directory: {os.getcwd()}")
        return
    
    # Check if cochranfilms-links.json exists
    if not Path('cochranfilms-links.json').exists():
        print("⚠️  Warning: cochranfilms-links.json not found")
        print("The app will use built-in sample data")
    
    print("🚀 Starting Cochran Films Ops Hub Test Server")
    print(f"📁 Serving from: {os.getcwd()}")
    print(f"🌐 URL: http://localhost:{PORT}")
    print("📱 Press Ctrl+C to stop the server")
    print()
    
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"✅ Server started successfully on port {PORT}")
            print("🔗 Opening browser automatically...")
            
            # Open browser after a short delay
            import threading
            def open_browser():
                import time
                time.sleep(1)
                webbrowser.open(f'http://localhost:{PORT}')
            
            threading.Thread(target=open_browser, daemon=True).start()
            
            # Start serving
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Error: Port {PORT} is already in use")
            print("Try using a different port or stop the existing server")
        else:
            print(f"❌ Error starting server: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()
