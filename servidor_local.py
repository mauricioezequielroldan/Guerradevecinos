from pathlib import Path
import http.server,webbrowser
root=Path(__file__).resolve().parent
handler=lambda *a,**k:http.server.SimpleHTTPRequestHandler(*a,directory=str(root),**k)
with http.server.ThreadingHTTPServer(('127.0.0.1',8765),handler) as server:
 print('Servidor local en http://127.0.0.1:8765 - cerrar esta ventana para detenerlo')
 webbrowser.open('http://127.0.0.1:8765/index.html')
 server.serve_forever()
