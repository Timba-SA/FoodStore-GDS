# 🔌 Configuración de ngrok para Mercado Pago — Food Store

Para que la integración de **Mercado Pago** funcione correctamente en tu entorno de desarrollo local, los servidores de Mercado Pago necesitan poder comunicarse con tu API local para notificar el estado de las transacciones (Webhooks / IPN). 

Como tu entorno corre en `http://localhost:8000` tras el router de tu casa, usamos **ngrok** para crear un túnel seguro y exponer temporalmente tu backend a internet de forma pública y segura (HTTPS).

En esta guía tenés el paso a paso detallado de cómo ponerlo en marcha cada vez que levantes el proyecto.

---

## 🛠️ Requisitos Previos (Se hace una sola vez)

1. **Crear una cuenta en ngrok**: Si no tenés una, registrate gratis en [ngrok.com](https://ngrok.com/).
2. **Instalar ngrok**: Descargalo e instalalo en tu sistema.
3. **Configurar tu Authtoken**:
   Entrá a tu dashboard de ngrok, copia tu Authtoken y ejecutá este comando en tu terminal para autenticar tu máquina:
   ```bash
   ngrok config add-authtoken TU_AUTHTOKEN_AQUI
   ```

---

## 📋 Flujo de Trabajo Diario (Con URL Dinámica)

Cada vez que vayas a trabajar en el proyecto y necesites probar pagos, seguí estos pasos:

### Paso 1: Levantar los contenedores del proyecto
Asegurate de tener levantado el entorno de Docker en la raíz del proyecto:
```bash
docker compose up -d
```

### Paso 2: Iniciar el túnel de ngrok
Abrí una nueva terminal y levantá el túnel apuntando al puerto del **backend** (`8000`):
```bash
ngrok http 8000
```
Verás una pantalla en la consola que muestra información del túnel. Buscá la línea que dice **Forwarding** y copiate la URL pública que empieza con `https://` (ejemplo: `https://abcd-1234.ngrok-free.app`).

### Paso 3: Actualizar las Variables de Entorno del Backend
1. Abrí el archivo de configuración de entorno del backend en [backend/.env](file:///c:/Users/Usuario/Desktop/Programación%20UTN/2do%20Año%202do%20Semestre/Gestión%20del%20Desarrollo%20de%20Sistemas/RepositorioBaseFoodStore-SDD/backend/.env) (si no existe, crealo basándote en `.env.example`).
2. Buscá la variable `MERCADOPAGO_WEBHOOK_URL` y actualizala pegando la URL de ngrok junto con el endpoint del webhook del backend. Debe quedar estructurada así:
   ```env
   MERCADOPAGO_WEBHOOK_URL=https://TU-SUBDOMINIO-TEMPORAL.ngrok-free.app/api/v1/pagos/webhook
   ```
   *(Asegurate de que no termine con barra `/` y de que incluya la ruta exacta `/api/v1/pagos/webhook`)*.

### Paso 4: Reiniciar el backend para aplicar los cambios
Como el contenedor lee las variables de entorno al iniciar, debés reiniciar únicamente el contenedor del backend:
```bash
docker compose restart backend
```

¡Listo! Ya podés simular compras y Mercado Pago enviará las respuestas del checkout a tu terminal local en tiempo real.

---

## 💡 Tip Pro: Usar un Dominio Estático Gratis (¡Muy Recomendado!)

Por defecto, la versión gratuita de ngrok te genera una URL aleatoria distinta cada vez que cerrás y abrís el comando, obligándote a cambiar el `.env` y reiniciar el contenedor a cada rato. **¡Pero podés evitar esto usando un dominio estático gratis!**

ngrok regala **un subdominio estático gratuito** por cuenta. Para configurarlo:

1. Entrá a tu [Dashboard de ngrok](https://dashboard.ngrok.com/) e ingresá a la sección **Cloud Edge > Domains**.
2. Hacé clic en **New Domain** (o seleccioná el subdominio gratuito que te asignaron por defecto, por ejemplo: `mi-proyecto.ngrok-free.app`).
3. Ahora, en lugar de levantar ngrok a secas, levántalo apuntando a tu dominio estático:
   ```bash
   ngrok http 8000 --url=TU-DOMINIO-ESTATICO.ngrok-free.app
   ```
4. **La magia de esto**:
   Configurás la variable de entorno `MERCADOPAGO_WEBHOOK_URL` **una sola vez** en tu `.env` usando ese dominio estático:
   ```env
   MERCADOPAGO_WEBHOOK_URL=https://TU-DOMINIO-ESTATICO.ngrok-free.app/api/v1/pagos/webhook
   ```
   ¡Y listo! Ya nunca más tenés que editar el `.env` ni reiniciar el backend. Cada vez que vayas a programar, simplemente corrés el comando de ngrok con la bandera `--url` y el túnel se conectará a la misma URL fija. 

---

## 🔍 Solución de Problemas Comunes

* **Error 502 Bad Gateway en ngrok**: Ocurre si ngrok está activo pero tu backend en Docker está apagado o no responde en el puerto 8000. Verificá el estado con `docker compose ps` y revisá los logs con `docker compose logs backend`.
* **Los pagos se aprueban pero el webhook no impacta**: 
  1. Verificá que la URL que pusiste en `MERCADOPAGO_WEBHOOK_URL` en tu [backend/.env](file:///c:/Users/Usuario/Desktop/Programación%20UTN/2do%20Año%202do%20Semestre/Gestión%20del%20Desarrollo%20de%20Sistemas/RepositorioBaseFoodStore-SDD/backend/.env) sea exactamente igual a la URL activa de ngrok.
  2. Recordá que **sí o sí** debés reiniciar el contenedor de backend (`docker compose restart backend`) tras modificar el `.env` para que tome el cambio.
