import socket

def request(path):
    with socket.create_connection(('127.0.0.1', 3001), timeout=5) as sock:
        sock.sendall(f'GET {path} HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n'.encode())
        data = sock.recv(4096)
        print(data.decode(errors='replace'))

request('/test')
