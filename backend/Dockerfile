FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN apt-get update && \
    apt-get install -y postgresql-client && \
    pip install --no-cache-dir -r requirements.txt

COPY . .
COPY init_update_data_vault.sql .

CMD ["flask", "run", "--host=0.0.0.0", "--port=5050"]