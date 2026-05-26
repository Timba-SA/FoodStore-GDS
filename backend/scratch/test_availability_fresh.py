import asyncio
from sqlalchemy import select
from app.db.session import get_db_session
from app.db.models import Usuario, Rol, UsuarioRol, Producto
from app.modules.auth.service import AuthService
from app.modules.auth.schemas import TokenPayload
import http.client
import json

async def test():
    # Use get_db_session generator
    async for session in get_db_session():
        # Find the user 'pedidos@foodstore.com'
        res = await session.execute(select(Usuario).where(Usuario.email == "pedidos@foodstore.com"))
        user = res.scalars().first()
        if not user:
            print("User not found!")
            return
        
        # Generate a fresh access token for this user
        auth_service = AuthService(session)
        roles = await auth_service.get_user_roles(user.id)
        print("User roles in DB:", roles)
        
        token = auth_service.create_access_token(user.id, user.email, roles)
        print("Fresh token:", token)
        
        # Make a connection and test PATCH to product availability
        # We need a valid product ID. Let's fetch one from the database first
        res_prod = await session.execute(select(Producto).limit(1))
        product = res_prod.scalars().first()
        if not product:
            print("No products found in DB!")
            return
        
        print(f"Testing product: {product.nombre} (ID: {product.id}, disponible: {product.disponible})")
        
        # Call PATCH to toggle availability
        conn = http.client.HTTPConnection("localhost", 8000)
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        # Toggle current availability
        payload = json.dumps({"disponible": not product.disponible})
        
        conn.request("PATCH", f"/api/v1/cocina/productos/{product.id}/disponibilidad", payload, headers)
        response = conn.getresponse()
        data = response.read()
        
        print("PATCH Status:", response.status)
        print("PATCH Response:", data.decode("utf-8"))
        break # Exit generator loop after first yield

if __name__ == "__main__":
    asyncio.run(test())
