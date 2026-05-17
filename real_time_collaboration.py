"""
Real-time Collaboration Module

This module provides functionality for real-time collaboration between users.
It uses WebSockets to establish a bi-directional communication channel between clients and server.
"""

import asyncio
import websockets
from typing import Dict, List

class RealTimeCollaboration:
    def __init__(self):
        self.clients: Dict[str, websockets.WebSocketServer] = {}
        self.messages: List[str] = []

    async def register_client(self, client_id: str, websocket: websockets.WebSocketServer) -> None:
        """
        Register a new client with the given ID and WebSocket connection.

        Args:
            client_id (str): Unique identifier for the client.
            websocket (websockets.WebSocketServer): WebSocket connection for the client.
        """
        self.clients[client_id] = websocket

    async def unregister_client(self, client_id: str) -> None:
        """
        Unregister a client with the given ID.

        Args:
            client_id (str): Unique identifier for the client to be unregistered.
        """
        if client_id in self.clients:
            del self.clients[client_id]

    async def broadcast_message(self, message: str) -> None:
        """
        Broadcast a message to all connected clients.

        Args:
            message (str): Message to be broadcasted.
        """
        for websocket in self.clients.values():
            await websocket.send(message)

    async def handle_connection(self, websocket: websockets.WebSocketServer) -> None:
        """
        Handle incoming WebSocket connections.

        Args:
            websocket (websockets.WebSocketServer): Incoming WebSocket connection.
        """
        try:
            # Register the client
            client_id = str(id(websocket))
            await self.register_client(client_id, websocket)

            # Receive messages from the client
            async for message in websocket:
                # Broadcast the message to all connected clients
                await self.broadcast_message(message)
        except websockets.ConnectionClosed:
            # Unregister the client if the connection is closed
            await self.unregister_client(str(id(websocket)))

    async def start(self, host: str = 'localhost', port: int = 8765) -> None:
        """
        Start the real-time collaboration server.

        Args:
            host (str): Host IP address or hostname. Defaults to 'localhost'.
            port (int): Port number. Defaults to 8765.
        """
        async with websockets.serve(self.handle_connection, host, port):
            print(f"Real-time Collaboration Server started on {host}:{port}")
            await asyncio.Future()  # run forever

if __name__ == "__main__":
    collaboration = RealTimeCollaboration()
    collaboration.start()