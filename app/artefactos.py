import os, base64, hashlib
from PIL import Image, ImageDraw
from PIL.PngImagePlugin import PngInfo
from scapy.all import Ether, IP, TCP, UDP, ICMP, DNS, DNSQR, Raw, wrpcap
from retos import F
O = os.path.join(os.path.dirname(os.path.abspath(__file__)), "artefactos"); os.makedirs(O, exist_ok=True)
CM, SM, A, B = "02:00:00:00:00:01", "02:00:00:00:00:02", "10.13.37.5", "10.13.37.10"
def sess(c, s, sp, dp, msgs, t):
    pk = []; cs, ss = 1000, 5000
    def add(p):
        nonlocal t; p.time = t; t += 0.01; pk.append(p)
    e = lambda a, b, x, y: Ether(src=a, dst=b) / IP(src=x, dst=y)
    add(e(CM, SM, c, s) / TCP(sport=sp, dport=dp, flags="S", seq=cs))
    add(e(SM, CM, s, c) / TCP(sport=dp, dport=sp, flags="SA", seq=ss, ack=cs + 1)); cs += 1; ss += 1
    add(e(CM, SM, c, s) / TCP(sport=sp, dport=dp, flags="A", seq=cs, ack=ss))
    for fromc, d in msgs:
        if fromc:
            add(e(CM, SM, c, s) / TCP(sport=sp, dport=dp, flags="PA", seq=cs, ack=ss) / Raw(d)); cs += len(d)
            add(e(SM, CM, s, c) / TCP(sport=dp, dport=sp, flags="A", seq=ss, ack=cs))
        else:
            add(e(SM, CM, s, c) / TCP(sport=dp, dport=sp, flags="PA", seq=ss, ack=cs) / Raw(d)); ss += len(d)
            add(e(CM, SM, c, s) / TCP(sport=sp, dport=dp, flags="A", seq=cs, ack=ss))
    return pk, t
def w(n, p): wrpcap(os.path.join(O, n), p)
# 1 imagen con bandera en metadatos
im = Image.new("RGB", (192, 192), "#16324f"); d = ImageDraw.Draw(im)
for i in range(0, 192, 12): d.rectangle([i, 0, i + 6, 191], fill="#1f4f7a")
d.ellipse([56, 56, 136, 136], fill="#f5a524"); d.text((70, 90), "FOCA", fill="#101c19")
pi = PngInfo(); pi.add_text("Author", "CorpX"); pi.add_text("Comment", F[1].removeprefix("CORPX{").removesuffix("}"))
im.save(os.path.join(O, "reto01_foca.png"), pnginfo=pi)
# 4 hash
open(os.path.join(O, "reto04_hash.txt"), "w").write(hashlib.md5(b"sunshine").hexdigest() + "\n")
# 7 dns
b32 = base64.b32encode(F[7].encode()).decode().rstrip("="); ch = [b32[i:i + 12] for i in range(0, len(b32), 12)]
names = ["www.google.com", "corpx.lab"] + [f"{i}-{c}.datos.corpx.lab" for i, c in enumerate(ch)] + ["update.microsoft.com"]
names.insert(3, "cdn.example.org")
w("reto07_dns.pcap", [Ether() / IP(src=A, dst="8.8.8.8") / UDP(sport=5300 + i, dport=53) / DNS(rd=1, qd=DNSQR(qname=n)) for i, n in enumerate(names)])
# 9 upload
upload_txt = ("# ===========================================================\n"
              "# CORPX SISTEMA DE VERIFICACION DE IDENTIDAD v2.1\n"
              "# ===========================================================\n"
              "# Instrucciones:\n"
              "#   1. Rellena el campo 'nombre' con tu identificador.\n"
              "#   2. Sube este archivo usando el boton del reto.\n"
              "# ===========================================================\n"
              "\n"
              "nombre=agente_nuevo\n"
              "rol=visitante\n"
              "nivel_acceso=0\n"
              "estado=pendiente\n"
              "\n"
              "# ------ NOTAS INTERNAS (solo lectura) ------\n"
              "# El validador ejecuta internamente:\n"
              "#   VERIFICAR rol='<rol>' AND nivel_acceso='<nivel>'\n"
              "# -------------------------------------------\n"
              "# ADVERTENCIA: El modulo v2.1 NO sanitiza los valores\n"
              "# del archivo. Caracteres como la comilla simple (')\n"
              "# podrian alterar la logica de verificacion.\n"
              "# -------------------------------------------\n")
open(os.path.join(O, "reto09_upload.txt"), "w", encoding="utf-8").write(upload_txt)
# 9 archivo de configuracion interno expuesto por la inyeccion
config_interno = ("# ===========================================================\n"
                  "# CORPX - Configuracion de Acceso Interno\n"
                  "# CLASIFICACION: CONFIDENCIAL\n"
                  "# Version: 2.1.0  |  Ultima modificacion: 2024-11-07\n"
                  "# ===========================================================\n"
                  "DB_HOST=db-internal.corpx.lab\n"
                  "DB_PORT=5432\n"
                  "DB_USER=corpx_admin\n"
                  f"AUTH_FLAG={F[9]}\n"
                  "SESSION_TIMEOUT=1800\n"
                  "DEBUG=false\n"
                  "# ===========================================================\n")
open(os.path.join(O, "reto09_config_interno.txt"), "w", encoding="utf-8").write(config_interno)
# 11 archivo clasificado - accesible solo con el token de API descubierto via SQL injection en reto 10
sellado_txt = ("# ===========================================================\n"
               "# CORPX - Archivo Clasificado de Administracion\n"
               "# ACCESO: RESTRINGIDO - Solo operativos con token valido\n"
               "# ===========================================================\n"
               "SISTEMA=corpx-intranet\n"
               "NIVEL_ACCESO=ALTO\n"
               f"FLAG_SISTEMA={F[11]}\n"
               "FECHA_EXPIRACION=2025-12-31\n"
               "# ===========================================================\n")
open(os.path.join(O, "reto11_sellado.txt"), "w", encoding="utf-8").write(sellado_txt)
# 12 archivo de bandera para el servidor SSH (colocar como ~/.flag en 192.168.56.105)
open(os.path.join(O, "reto12_dotflag.txt"), "w", encoding="utf-8").write(F[12] + "\n")
print("artefactos listos:", sorted(os.listdir(O)))
