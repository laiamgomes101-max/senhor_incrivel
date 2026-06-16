import socket
s=socket.socket(socket.AF_INET6)
s.settimeout(5)
try:
    s.connect(('::1',3001))
    req = b"GET /api/posts HTTP/1.1\r\nHost: [::1]\r\nConnection: close\r\n\r\n"
    s.sendall(req)
    data=b''
    while True:
        chunk=s.recv(4096)
        if not chunk: break
        data+=chunk
    print(data.decode('utf-8', errors='replace'))
except Exception as e:
    print('ERROR', e)
finally:
    s.close()
