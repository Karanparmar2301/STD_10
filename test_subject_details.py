import requests
url = "http://localhost:8000/api/subject-details/46a0e54-aedf-4c38-bb23-571b7e0ba0e1/std_10_mathematics"
res = requests.get(url, headers={"Authorization": "Bearer header.eyJzdWIiOiI0NmEwZTU0LWFlZGYtNGMzOC1iYjIzLTU3MWI3ZTBiYTBlMSIsImVtYWlsIjoiZGVtb0BzdHVkZW50LmNvbSIsImlhdCI6MTcwMDAwMDAwMH0.signature"})
print(res.status_code, res.text)