FROM python:3.14-slim
RUN pip install --no-cache-dir flask waitress scapy pillow \
 && useradd -m juego
WORKDIR /app
COPY app/ /app/
COPY FOCA-v3.4.7.1.zip /downloads/FOCA-v3.4.7.1.zip
RUN python artefactos.py && chown -R juego /app
USER juego
EXPOSE 8080 8081
CMD ["python", "-u", "main.py"]
