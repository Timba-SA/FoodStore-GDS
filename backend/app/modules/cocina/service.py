import asyncio
import logging
from typing import Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages active WebSocket connections for the Cocina KDS display."""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        """Register a new active WebSocket connection safely."""
        await websocket.accept()
        async with self.lock:
            self.active_connections.add(websocket)
        logger.info("Cocina WS connection accepted.")

    async def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection safely."""
        async with self.lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        logger.info("Cocina WS connection disconnected.")

    async def broadcast(self, message: dict):
        """Broadcast a message to all active WebSockets concurrently and safely."""
        async with self.lock:
            # Create a copy/snapshot under the lock to prevent mutation exceptions
            connections = list(self.active_connections)
        
        if not connections:
            return

        logger.info(f"Broadcasting event to {len(connections)} active KDS clients: {message}")
        
        # Broadcast outside the lock to avoid holding the lock for I/O operations,
        # but safely handle disconnections if any channel fails.
        failed_connections = []
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception as exc:
                logger.warning(f"Error sending message to WebSocket, will cleanup: {exc}")
                failed_connections.append(connection)

        if failed_connections:
            async with self.lock:
                for connection in failed_connections:
                    self.active_connections.discard(connection)

# Global instance for app-wide sharing
cocina_ws_manager = ConnectionManager()
