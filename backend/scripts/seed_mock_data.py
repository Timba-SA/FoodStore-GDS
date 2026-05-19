import asyncio
import sys
import os

# Add the parent directory to the path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from app.core.config import get_settings
from app.db.models import Categoria, Ingrediente, Producto, Usuario, ProductoCategoria, ProductoIngrediente
from sqlmodel import select

async def seed_data():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    async with AsyncSession(engine) as session:

        # 1. Categories
        cat_data = [
            {"nombre": "Carnes & Aves", "slug": "carnes-y-aves", "imagen_url": "https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80&w=800"},
            {"nombre": "Lácteos selectos", "slug": "lacteos-selectos", "imagen_url": "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=800"},
            {"nombre": "Verduras frescas", "slug": "verduras-frescas", "imagen_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800"},
            {"nombre": "Pastas & Granos", "slug": "pastas-y-granos", "imagen_url": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800"},
            {"nombre": "Bebidas", "slug": "bebidas", "imagen_url": "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&q=80&w=800"}
        ]
        
        cats = {}
        for c in cat_data:
            stmt = select(Categoria).where(Categoria.nombre == c["nombre"])
            result = await session.execute(stmt)
            cat = result.scalar_one_or_none()
            if not cat:
                cat = Categoria(**c)
                session.add(cat)
                await session.flush()
            cats[c["nombre"]] = cat.id
        
        await session.commit()

        # 2. Ingredients
        ing_data = [
            {"nombre": "Lechuga", "es_alergeno": False},
            {"nombre": "Tomate", "es_alergeno": False},
            {"nombre": "Cebolla", "es_alergeno": False},
            {"nombre": "Queso Cheddar", "es_alergeno": True}, # Lácteo
            {"nombre": "Pan de Hamburguesa", "es_alergeno": True}, # Gluten
            {"nombre": "Carne de Res", "es_alergeno": False},
            {"nombre": "Huevo", "es_alergeno": True}, # Alérgeno
            {"nombre": "Leche", "es_alergeno": True}, # Lácteo
            {"nombre": "Nueces", "es_alergeno": True}, # Frutos secos
            {"nombre": "Ajo", "es_alergeno": False},
            {"nombre": "Albahaca", "es_alergeno": False},
            {"nombre": "Pasta", "es_alergeno": True}, # Gluten
            {"nombre": "Pollo", "es_alergeno": False},
            {"nombre": "Salsa de Tomate", "es_alergeno": False},
            {"nombre": "Masa de Pizza", "es_alergeno": True}, # Gluten
            {"nombre": "Mozzarella", "es_alergeno": True}, # Lácteo
            {"nombre": "Pepperoni", "es_alergeno": False},
            {"nombre": "Maní", "es_alergeno": True}, # Alérgeno severo
            {"nombre": "Salsa de Soja", "es_alergeno": True}, # Soja/Gluten
            {"nombre": "Fideos de Arroz", "es_alergeno": False},
            {"nombre": "Camarones", "es_alergeno": True}, # Mariscos
            {"nombre": "Salmón", "es_alergeno": True}, # Pescado
        ]

        ings = {}
        for i in ing_data:
            stmt = select(Ingrediente).where(Ingrediente.nombre == i["nombre"])
            result = await session.execute(stmt)
            ing = result.scalar_one_or_none()
            if not ing:
                ing = Ingrediente(**i)
                session.add(ing)
                await session.flush()
            ings[i["nombre"]] = ing.id

        await session.commit()

        # 3. Products
        prod_data = [
            {
                "nombre": "Ensalada César con Pollo",
                "descripcion": "Clásica ensalada César con trozos de pechuga de pollo a la parrilla, croutones crujientes y aderezo especial.",
                "precio": "8500.00",
                "stock": 50,
                "sku": "ENS-CES-POL-01",
                "imagen_url": "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=800",
                "activo": True,
                "es_alergeno": True,
                "categorias": [cats["Verduras frescas"], cats["Carnes & Aves"]],
                "ingredientes": [ings["Lechuga"], ings["Pollo"], ings["Queso Cheddar"], ings["Ajo"]]
            },
            {
                "nombre": "Hamburguesa Completa",
                "descripcion": "Medallón de carne de res de 200g, queso cheddar derretido, huevo, lechuga y tomate en pan artesanal.",
                "precio": "12000.00",
                "stock": 30,
                "sku": "HAM-COM-01",
                "imagen_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
                "activo": True,
                "es_alergeno": True,
                "categorias": [cats["Carnes & Aves"], cats["Lácteos selectos"]],
                "ingredientes": [ings["Carne de Res"], ings["Pan de Hamburguesa"], ings["Queso Cheddar"], ings["Huevo"], ings["Lechuga"], ings["Tomate"]]
            },
            {
                "nombre": "Pasta Bolognesa",
                "descripcion": "Fideos al dente con salsa de tomate rica y espesa con carne picada de res.",
                "precio": "9500.00",
                "stock": 40,
                "sku": "PAS-BOL-01",
                "imagen_url": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&q=80&w=800",
                "activo": True,
                "es_alergeno": True,
                "categorias": [cats["Pastas & Granos"], cats["Carnes & Aves"]],
                "ingredientes": [ings["Pasta"], ings["Carne de Res"], ings["Salsa de Tomate"], ings["Cebolla"]]
            },
            {
                "nombre": "Pizza Pepperoni",
                "descripcion": "Pizza de masa fina con salsa de tomate, mozzarella abundante y rodajas de pepperoni picante.",
                "precio": "14000.00",
                "stock": 25,
                "sku": "PIZ-PEP-01",
                "imagen_url": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800",
                "activo": True,
                "es_alergeno": True,
                "categorias": [cats["Pastas & Granos"], cats["Lácteos selectos"]],
                "ingredientes": [ings["Masa de Pizza"], ings["Mozzarella"], ings["Pepperoni"], ings["Salsa de Tomate"]]
            },
            {
                "nombre": "Wok de Camarones y Fideos",
                "descripcion": "Salteado oriental con camarones frescos, verduras crocantes y fideos de arroz en salsa de soja.",
                "precio": "15500.00",
                "stock": 20,
                "sku": "WOK-CAM-01",
                "imagen_url": "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&q=80&w=800",
                "activo": True,
                "es_alergeno": True,
                "categorias": [cats["Pastas & Granos"]],
                "ingredientes": [ings["Fideos de Arroz"], ings["Camarones"], ings["Cebolla"], ings["Salsa de Soja"]]
            },
            {
                "nombre": "Ensalada Caprese",
                "descripcion": "Rodajas de tomate fresco, mozzarella de búfala, hojas de albahaca fresca y aceite de oliva.",
                "precio": "7500.00",
                "stock": 60,
                "sku": "ENS-CAP-01",
                "imagen_url": "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?auto=format&fit=crop&q=80&w=800",
                "activo": True,
                "es_alergeno": True,
                "categorias": [cats["Verduras frescas"], cats["Lácteos selectos"]],
                "ingredientes": [ings["Tomate"], ings["Mozzarella"], ings["Albahaca"]]
            },
            {
                "nombre": "Salmón Grillado con Vegetales",
                "descripcion": "Filete de salmón rosado a la parrilla acompañado de mix de verduras asadas.",
                "precio": "18000.00",
                "stock": 15,
                "sku": "SAL-GRI-01",
                "imagen_url": "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&q=80&w=800",
                "activo": True,
                "es_alergeno": True,
                "categorias": [cats["Carnes & Aves"], cats["Verduras frescas"]],
                "ingredientes": [ings["Salmón"], ings["Cebolla"], ings["Tomate"]]
            }
        ]

        for p in prod_data:
            stmt = select(Producto).where(Producto.nombre == p["nombre"])
            result = await session.execute(stmt)
            prod = result.scalar_one_or_none()
            if not prod:
                prod = Producto(
                    nombre=p["nombre"],
                    descripcion=p["descripcion"],
                    precio=p["precio"],
                    stock=p["stock"],
                    sku=p["sku"],
                    imagen_url=p["imagen_url"],
                    activo=p["activo"],
                    es_alergeno=p["es_alergeno"]
                )
                session.add(prod)
                await session.flush()
                
                # Add categories
                for c_id in p["categorias"]:
                    prod_cat = ProductoCategoria(producto_id=prod.id, categoria_id=c_id)
                    session.add(prod_cat)
                    
                # Add ingredients
                for i_id in p["ingredientes"]:
                    prod_ing = ProductoIngrediente(producto_id=prod.id, ingrediente_id=i_id)
                    session.add(prod_ing)
                    
        await session.commit()
        print("Database seeded successfully with Categories, Ingredients, and Products.")

if __name__ == "__main__":
    asyncio.run(seed_data())
