import http.client
import json

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo4LCJlbWFpbCI6InBlZGlkb3NAZm9vZHN0b3JlLmNvbSIsInJvbGVzIjpbInBlZGlkb3MiXSwiZXhwIjoxNzc5ODI0NjIyLjYwMzQwMywiaWF0IjoxNzc5ODIyODIyLjYwMzQwM30.j0qE80gQhuh2OQ64SAP8cINC5YDAthVpflRNWikXtlI"

conn = http.client.HTTPConnection("localhost", 8000)
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
payload = json.dumps({"disponible": False})

# Send PATCH to update availability of product with ID 1
conn.request("PATCH", "/api/v1/cocina/productos/1/disponibilidad", payload, headers)
response = conn.getresponse()
data = response.read()

print("Status:", response.status)
print("Response:", data.decode("utf-8"))
