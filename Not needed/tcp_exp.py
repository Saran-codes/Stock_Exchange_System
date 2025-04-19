import socket

def main():
    host = '127.0.0.1'  # Server's hostname or IP address
    port = 8080         # Port used by the server

    # Create a socket instance and connect to the server
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((host, port))
        message = "Hello from Python!"
        s.sendall(message.encode('utf-8'))
        print("Message sent to the server.")

if __name__ == '__main__':
    main()
