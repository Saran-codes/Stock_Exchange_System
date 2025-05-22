FROM python:3.9-slim-bullseye

WORKDIR /app
COPY requirements.txt .
RUN apt-get update && apt-get upgrade -y && apt-get clean && \
	pip install --no-cache-dir -r requirements.txt

COPY . .
ENV PYTHONUNBUFFERED=1

COPY wait-for-it.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/wait-for-it.sh

ENTRYPOINT ["wait-for-it.sh", "postgres:5432", "--",
             "wait-for-it.sh", "kafka:9092", "--",
             "uvicorn", "app.backend:app", "--host", "0.0.0.0", "--port", "8000"]

CMD ["uvicorn", "app.backend:app", "--host", "0.0.0.0", "--port", "8000"]

