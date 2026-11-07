FROM python:3.12-slim
RUN pip install --no-cache-dir flask waitress scapy pillow \
 && useradd -m juego
WORKDIR /app
COPY app/ /app/
RUN python artefactos.py && chown -R juego /app
USER juego
EXPOSE 8080 8081
CMD ["python", "-u", "main.py"]
