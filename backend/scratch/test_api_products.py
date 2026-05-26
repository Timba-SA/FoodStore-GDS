import asyncio
from httpx import AsyncClient
from app.main import app

async def main():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Test 1: Call GET /productos without only_available (default)
        r = await ac.get("/api/v1/productos?limit=100")
        print("=== Test 1: GET /productos?limit=100 ===")
        print(f"Status: {r.status_code}")
        products = r.json()
        print(f"Total returned: {len(products)}")
        for p in products:
            print(f"ID: {p['id']} | Nombre: {p['nombre']} | Disponible: {p['disponible']}")

        # Test 2: Call GET /productos with only_available=true
        r_only = await ac.get("/api/v1/productos?limit=100&only_available=true")
        print("\n=== Test 2: GET /productos?limit=100&only_available=true ===")
        print(f"Status: {r_only.status_code}")
        products_only = r_only.json()
        print(f"Total returned: {len(products_only)}")
        for p in products_only:
            print(f"ID: {p['id']} | Nombre: {p['nombre']} | Disponible: {p['disponible']}")

if __name__ == "__main__":
    asyncio.run(main())
