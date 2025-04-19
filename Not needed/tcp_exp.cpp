#include <iostream>
#include <cstring>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <cstdlib>

int main() {
    int server_fd, new_socket;
    struct sockaddr_in address;
    int opt = 1;
    int addrlen = sizeof(address);
    char buffer[1024] = {0};

    // Create socket file descriptor
    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
        perror("Socket failed");
        return -1;
    }

    // Set SO_REUSEADDR
    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        perror("setsockopt SO_REUSEADDR");
        return -1;
    }

#ifdef SO_REUSEPORT
    // Optionally set SO_REUSEPORT if available
    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEPORT, &opt, sizeof(opt)) < 0) {
        perror("setsockopt SO_REUSEPORT");
        // On macOS, if this causes issues, you can choose to continue without it.
        // Alternatively, comment out this section if not needed.
    }
#endif

    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;  // Listen on all interfaces
    address.sin_port = htons(8080);        // Port number

    // Bind the socket to the address and port
    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        perror("bind failed");
        return -1;
    }
    
    // Listen for incoming connections
    if (listen(server_fd, 3) < 0) {
        perror("listen");
        return -1;
    }
    
    std::cout << "Server listening on port 8080...\n";

    // Accept an incoming connection
    if ((new_socket = accept(server_fd, (struct sockaddr *)&address, (socklen_t*)&addrlen)) < 0) {
        perror("accept");
        return -1;
    }
    
    // Read the message from the client
    int valread = read(new_socket, buffer, 1024);
    std::cout << "Received: " << buffer << std::endl;
    
    // Close the sockets
    close(new_socket);
    close(server_fd);
    return 0;
}
