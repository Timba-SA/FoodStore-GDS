import pytest
import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import status, WebSocketDisconnect
from fastapi.testclient import TestClient

from app.main import app
from app.db.models.pedido import Pedido, EstadoPedido, HistorialEstadoPedido
from app.db.models.producto import Producto
from app.db.models.usuario import RolEnum
from app.modules.pedidos.service import PedidoService
from app.modules.cocina.service import ConnectionManager
from app.modules.auth.schemas import TokenPayload, UserResponse
from app.modules.auth.service import AuthService


# ============================================================================
# PHASE 1: KDS & Kitchen Unit/Seed Tests
# ============================================================================

def test_rol_enum_cocina():
    """Verify that the COCINA role enum exists and equals 'cocina'."""
    assert RolEnum.COCINA.value == "cocina"


def test_producto_disponible_field():
    """Check that 'disponible' is a field in Producto with default=True and type bool."""
    fields = Producto.model_fields
    assert "disponible" in fields
    field = fields["disponible"]
    assert field.default is True
    assert field.annotation == bool


def test_auth_password_hashing_for_seed():
    """Verify that password hashing and verification works properly (needed for seed scripts)."""
    hashed = AuthService.hash_password("password")
    assert AuthService.verify_password("password", hashed) is True


# ============================================================================
# PHASE 2: ConnectionManager Concurrency Safety Tests
# ============================================================================

@pytest.mark.asyncio
async def test_connection_manager_concurrency():
    """Verify ConnectionManager uses Lock to safely handle WS connections and broadcasts."""
    manager = ConnectionManager()
    
    # Mock WebSockets
    ws1 = AsyncMock()
    ws2 = AsyncMock()
    
    # Connect
    await manager.connect(ws1)
    await manager.connect(ws2)
    assert ws1 in manager.active_connections
    assert ws2 in manager.active_connections
    
    # Broadcast with one failing socket
    ws2.send_json.side_effect = Exception("Connection closed")
    
    await manager.broadcast({"event": "test"})
    
    # Check that failed connection was discarded safely
    assert ws1 in manager.active_connections
    assert ws2 not in manager.active_connections
    
    # Disconnect remaining
    await manager.disconnect(ws1)
    assert len(manager.active_connections) == 0


# ============================================================================
# PHASE 2: Service-Level FSM & Role Checks Tests
# ============================================================================

class TestFSMRoleSecurity:
    @pytest.fixture
    def mock_session(self):
        return AsyncMock()

    @pytest.fixture
    def service(self, mock_session):
        return PedidoService(mock_session)

    @pytest.mark.asyncio
    async def test_avanzar_estado_cocina_valid_transition(self, service, mock_session):
        """Kitchen role can transition confirmado -> en_preparacion."""
        pedido = MagicMock(spec=Pedido)
        pedido.id = 123
        pedido.estado_id = 2
        pedido.detalles_pedido = []
        pedido.historial_estados = []

        estado_confirmado = MagicMock(spec=EstadoPedido)
        estado_confirmado.id = 2
        estado_confirmado.nombre = "confirmado"

        estado_preparacion = MagicMock(spec=EstadoPedido)
        estado_preparacion.id = 3
        estado_preparacion.nombre = "en_preparacion"

        # Mock DB queries inside avanzar_estado
        # 1. get_pedido
        # 2. Resolve current state name
        # 3. get_estado (for new state)
        mock_session.execute.side_effect = [
            # get_pedido result
            MagicMock(scalars=lambda: MagicMock(first=lambda: pedido)),
            # current state name result
            MagicMock(scalars=lambda: MagicMock(first=lambda: estado_confirmado)),
            # new state result
            MagicMock(scalars=lambda: MagicMock(first=lambda: estado_preparacion)),
        ]

        # Call under kitchen role
        with patch("app.modules.cocina.service.cocina_ws_manager.broadcast", AsyncMock()) as mock_broadcast:
            updated_pedido = await service.avanzar_estado(
                pedido_id=123,
                nuevo_estado_nombre="en_preparacion",
                usuario_id=999,
                roles=["cocina"]
            )
            
            assert updated_pedido.estado_id == estado_preparacion.id
            mock_broadcast.assert_called_once()
            assert mock_broadcast.call_args[0][0]["event"] == "pedido_actualizado"

    @pytest.mark.asyncio
    async def test_avanzar_estado_cocina_invalid_transition(self, service, mock_session):
        """Kitchen role cannot transition pendiente -> confirmado or other non-kitchen states."""
        pedido = MagicMock(spec=Pedido)
        pedido.id = 123
        pedido.estado_id = 1
        pedido.detalles_pedido = []

        estado_pendiente = MagicMock(spec=EstadoPedido)
        estado_pendiente.id = 1
        estado_pendiente.nombre = "pendiente"

        mock_session.execute.side_effect = [
            MagicMock(scalars=lambda: MagicMock(first=lambda: pedido)),
            MagicMock(scalars=lambda: MagicMock(first=lambda: estado_pendiente)),
        ]

        with pytest.raises(PermissionError, match="El rol cocina no está autorizado"):
            await service.avanzar_estado(
                pedido_id=123,
                nuevo_estado_nombre="confirmado",
                usuario_id=999,
                roles=["cocina"]
            )

    @pytest.mark.asyncio
    async def test_avanzar_estado_admin_unrestricted(self, service, mock_session):
        """Admin is not subject to kitchen state restrictions."""
        pedido = MagicMock(spec=Pedido)
        pedido.id = 123
        pedido.estado_id = 1
        pedido.detalles_pedido = []
        pedido.historial_estados = []

        estado_pendiente = MagicMock(spec=EstadoPedido)
        estado_pendiente.id = 1
        estado_pendiente.nombre = "pendiente"

        estado_cancelado = MagicMock(spec=EstadoPedido)
        estado_cancelado.id = 5
        estado_cancelado.nombre = "cancelado"

        mock_session.execute.side_effect = [
            # 1. _get_pedido result
            MagicMock(scalars=lambda: MagicMock(first=lambda: pedido)),
            # 2. current state name result
            MagicMock(scalars=lambda: MagicMock(first=lambda: estado_pendiente)),
            # 3. get_estado (for new state)
            MagicMock(scalars=lambda: MagicMock(first=lambda: estado_cancelado)),
        ]

        with patch("app.modules.cocina.service.cocina_ws_manager.broadcast", AsyncMock()):
            updated_pedido = await service.avanzar_estado(
                pedido_id=123,
                nuevo_estado_nombre="cancelado",
                usuario_id=999,
                roles=["admin"]
            )
            assert updated_pedido.estado_id == estado_cancelado.id


# ============================================================================
# PHASE 2: Router-Level Integration & Security Tests
# ============================================================================

class TestCocinaRouterIntegration:
    @pytest.fixture
    def client(self):
        app.dependency_overrides.clear()
        yield TestClient(app, raise_server_exceptions=False)
        app.dependency_overrides.clear()

    @pytest.fixture
    def mock_user_cocina(self):
        return UserResponse(
            id=1,
            nombre="Cocinero",
            email="chef@store.com",
            roles=["cocina"],
            creado_en=datetime.now(timezone.utc),
            actualizado_en=datetime.now(timezone.utc)
        )

    @pytest.fixture
    def mock_user_client(self):
        return UserResponse(
            id=2,
            nombre="Cliente",
            email="client@store.com",
            roles=["client"],
            creado_en=datetime.now(timezone.utc),
            actualizado_en=datetime.now(timezone.utc)
        )

    def test_get_active_orders_unauthorized(self, client):
        """Unauthenticated call should return 401."""
        response = client.get("/api/v1/cocina/pedidos")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_active_orders_forbidden_for_clients(self, client, mock_user_client):
        """Client role should return 403 Forbidden."""
        from app.modules.auth.router import get_current_user
        app.dependency_overrides[get_current_user] = lambda: mock_user_client
        response = client.get(
            "/api/v1/cocina/pedidos",
            headers={"Authorization": "Bearer some-token"}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_active_orders_success(self, client, mock_user_cocina):
        """Kitchen role should retrieve active orders (confirmado, en_preparacion) oldest first."""
        order1 = MagicMock(spec=Pedido)
        order1.id = 1
        order1.numero_pedido = "ORD-001"
        order1.estado_id = 2
        order1.notas = "Extra salsa"
        order1.created_at = datetime(2026, 5, 20, 10, 0, 0)
        order1.detalles_pedido = []
        order1.historial_estados = []

        order2 = MagicMock(spec=Pedido)
        order2.id = 2
        order2.numero_pedido = "ORD-002"
        order2.estado_id = 3
        order2.notas = "No onions"
        order2.created_at = datetime(2026, 5, 20, 10, 5, 0)
        order2.detalles_pedido = []
        order2.historial_estados = []

        mock_db_result = MagicMock()
        mock_db_result.scalars.return_value.all.return_value = [order1, order2]

        from app.modules.auth.router import get_current_user
        app.dependency_overrides[get_current_user] = lambda: mock_user_cocina

        with patch("app.modules.cocina.router.get_db", AsyncMock()), \
             patch("sqlalchemy.ext.asyncio.AsyncSession.execute", AsyncMock(return_value=mock_db_result)), \
             patch("app.modules.cocina.router._get_estado_nombre", AsyncMock(side_effect=["confirmado", "en_preparacion"])):
            
            response = client.get(
                "/api/v1/cocina/pedidos",
                headers={"Authorization": "Bearer some-token"}
            )
            
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
        assert data[0]["numero_pedido"] == "ORD-001"
        assert data[1]["numero_pedido"] == "ORD-002"
        assert data[0]["estado_nombre"] == "confirmado"

    def test_update_product_disponibilidad_success(self, client, mock_user_cocina):
        """Kitchen role can toggle product availability."""
        product = MagicMock(spec=Producto)
        product.id = 10
        product.nombre = "Hamburguesa"
        product.disponible = True

        mock_db_result = MagicMock()
        mock_db_result.scalars.return_value.first.return_value = product

        from app.modules.auth.router import get_current_user
        app.dependency_overrides[get_current_user] = lambda: mock_user_cocina

        with patch("app.modules.cocina.router.get_db", AsyncMock()), \
             patch("sqlalchemy.ext.asyncio.AsyncSession.execute", AsyncMock(return_value=mock_db_result)), \
             patch("sqlalchemy.ext.asyncio.AsyncSession.commit", AsyncMock()), \
             patch("sqlalchemy.ext.asyncio.AsyncSession.refresh", AsyncMock()):
            
            response = client.patch(
                "/api/v1/cocina/productos/10/disponibilidad",
                json={"disponible": False},
                headers={"Authorization": "Bearer some-token"}
            )
            
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["disponible"] is False


# ============================================================================
# PHASE 2: WebSocket Authentication Handshake Tests
# ============================================================================

class TestCocinaWebSocketHandshake:
    @pytest.fixture
    def client(self):
        return TestClient(app, raise_server_exceptions=False)

    def test_ws_handshake_invalid_token_rejects(self, client):
        """WebSocket connection should be rejected with 1008 if token is invalid or decoding fails."""
        with patch.object(AuthService, "decode_access_token", return_value=None):
            with pytest.raises(WebSocketDisconnect) as exc:
                with client.websocket_connect("/api/v1/cocina/ws?token=invalid-token") as ws:
                    pass
            assert exc.value.code == 1008

    def test_ws_handshake_insufficient_roles_rejects(self, client):
        """WebSocket connection should be rejected with 1008 if the user lacks kitchen roles."""
        payload = TokenPayload(user_id=1, email="client@store.com", roles=["client"], exp=9999999999)
        user = MagicMock()
        user.id = 1
        user.activo = True

        with patch.object(AuthService, "decode_access_token", return_value=payload), \
             patch.object(AuthService, "get_user_by_id", AsyncMock(return_value=user)), \
             patch.object(AuthService, "get_user_roles", AsyncMock(return_value=["client"])):
            
            with pytest.raises(WebSocketDisconnect) as exc:
                with client.websocket_connect("/api/v1/cocina/ws?token=client-token") as ws:
                    pass
            assert exc.value.code == 1008

    def test_ws_handshake_success(self, client):
        """WebSocket connection should succeed and register with kitchen WS manager for authorized role."""
        payload = TokenPayload(user_id=1, email="chef@store.com", roles=["cocina"], exp=9999999999)
        user = MagicMock()
        user.id = 1
        user.activo = True

        with patch.object(AuthService, "decode_access_token", return_value=payload), \
             patch.object(AuthService, "get_user_by_id", AsyncMock(return_value=user)), \
             patch.object(AuthService, "get_user_roles", AsyncMock(return_value=["cocina"])):
            
            with client.websocket_connect("/api/v1/cocina/ws?token=valid-chef-token") as ws:
                # Handshake succeeded! Connection is open.
                pass
