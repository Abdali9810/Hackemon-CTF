FROM python:3.14-slim

# Dependencias Python + usuario sin privilegios
RUN pip install --no-cache-dir flask waitress scapy pillow markupsafe \
 && useradd -m juego \
 && mkdir -p /downloads

WORKDIR /app

# Código fuente del juego
COPY app/ /app/

# Archivos de descarga para retos 1 y 3.
# REQUISITO: colocar estos archivos en la raíz del proyecto antes de hacer docker build.
# Si no están disponibles, comenta las dos líneas COPY y esos botones darán 404.
COPY FOCA-v3.4.7.1.zip          /downloads/FOCA-v3.4.7.1.zip
COPY informe_recon_iana_oculto.pdf /downloads/informe_recon_iana_oculto.pdf

# Generar artefactos del CTF (imágenes, pcaps, archivos de retos)
RUN python artefactos.py && chown -R juego /app

USER juego

# 8080: juego principal  |  8081: app objetivo (retos 10-11)  |  9003: simulador FTP (reto 4)
EXPOSE 8080 8081 9003

CMD ["python", "-u", "main.py"]
