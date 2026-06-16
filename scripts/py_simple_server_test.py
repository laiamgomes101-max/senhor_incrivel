import threading
import http.server
import urllib.request
import time

class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"ok": true}')

httpd = http.server.HTTPServer(('127.0.0.1', 3001), H)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
time.sleep(0.5)
with urllib.request.urlopen('http://127.0.0.1:3001/test', timeout=5) as r:
    print(r.status, r.read().decode())
httpd.shutdown()
