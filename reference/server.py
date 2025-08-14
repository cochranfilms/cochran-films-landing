#!/usr/bin/env python3
"""
Simple HTTP server for local development of the Cochran Films Template Showcase
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        # Handle preflight CORS requests
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        # Custom logging format
        print(f"[{self.log_date_time_string()}] {format % args}")

def main():
    # Get the directory containing this script
    script_dir = Path(__file__).parent.absolute()
    
    # Change to the script directory
    os.chdir(script_dir)
    
    # Server configuration
    PORT = 8000
    HOST = 'localhost'
    
    print(f"🚀 Starting Cochran Films Template Showcase server...")
    print(f"📁 Serving from: {script_dir}")
    print(f"🌐 URL: http://{HOST}:{PORT}")
    print(f"📱 Open your browser and navigate to the URL above")
    print(f"⏹️  Press Ctrl+C to stop the server")
    print("-" * 60)
    
    try:
        with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
            print(f"✅ Server started successfully on port {PORT}")
            print(f"🔗 Open: http://{HOST}:{PORT}")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n⏹️  Server stopped by user")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use. Try a different port:")
            print(f"   python server.py --port {PORT + 1}")
        else:
            print(f"❌ Error starting server: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    # Parse command line arguments
    if "--port" in sys.argv:
        try:
            port_index = sys.argv.index("--port")
            if port_index + 1 < len(sys.argv):
                PORT = int(sys.argv[port_index + 1])
                print(f"Using custom port: {PORT}")
        except (ValueError, IndexError):
            print("Invalid port number. Using default port 8000")
    
    main()
