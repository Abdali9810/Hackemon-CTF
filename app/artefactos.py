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
# 5 http
body = f"usuario=admin&clave={F[5]}".encode()
p1, t = sess(A, B, 40001, 80, [(True, b"GET / HTTP/1.1\r\nHost: intranet.corpx.lab\r\n\r\n"), (False, b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK")], 1.7e9)
p2, t = sess(A, B, 40002, 80, [(True, b"POST /login HTTP/1.1\r\nHost: intranet.corpx.lab\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: %d\r\n\r\n" % len(body) + body), (False, b"HTTP/1.1 302 Found\r\nLocation: /panel\r\n\r\n")], t)
w("reto05_http.pcap", p1 + p2)
# 6 ftp
m = [(False, b"220 CorpX FTP\r\n"), (True, b"USER agente\r\n"), (False, b"331 Password required\r\n"), (True, b"PASS " + F[6].encode() + b"\r\n"), (False, b"230 Login ok\r\n"), (True, b"QUIT\r\n"), (False, b"221 Bye\r\n")]
w("reto06_ftp.pcap", sess(A, B, 40010, 21, m, 1.7e9)[0])
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
print("artefactos listos:", sorted(os.listdir(O)))
