#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Reto 09 - Responder ICMP + Mini servidor HTTP (corre en VM-A, Linux, como root).

Flujo del reto:
  VM-B hace: ping 192.168.56.105
  -> el echo reply lleva en su campo Data la URL: http://192.168.56.105:9080/
  -> el alumno la ve en Wireshark/tcpdump
  -> la abre en el navegador -> aparece la imagen hack-1.jpg con la bandera

Uso:
  sudo python3 responder.py
  sudo FLAG='CORPX{tu_bandera}' python3 responder.py

Para parar: Ctrl+C  (restaura la config del kernel al salir)

Requisitos: Python 3.6+, root (raw socket ICMP). Sin dependencias extra.
Etica: solo contra este laboratorio aislado.
"""
from __future__ import annotations

import argparse
import os
import socket
import struct
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

# ── Configuracion ────────────────────────────────────────────────────────────
FLAG_DEFAULT = "burbuja"
VM_A_IP      = "192.168.56.105"   # IP de esta maquina en la red host-only
HTTP_PORT    = 9080               # puerto del mini servidor HTTP
SYSCTL_KEY   = "net.ipv4.icmp_echo_ignore_all"
ICMP_ECHO_REQ = 8
ICMP_ECHO_REP = 0

# ── Servidor HTTP ─────────────────────────────────────────────────────────────
def make_handler(image_path: str, flag: str, ip: str, port: int) -> type:
    """Crea el handler HTTP que sirve la imagen y la bandera."""

    import base64

    # Embeder la imagen como data URI para que la pagina sea self-contained
    try:
        raw_img = open(image_path, "rb").read()
        b64_img = base64.b64encode(raw_img).decode("ascii")
        ext = os.path.splitext(image_path)[1].lower().lstrip(".")
        mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg",
                "png": "image/png", "gif": "image/gif"}.get(ext, "image/jpeg")
        img_src = f"data:{mime};base64,{b64_img}"
    except OSError as e:
        raise RuntimeError(f"No se pudo leer la imagen {image_path}: {e}") from e

    page_html = (
        "<!doctype html><html lang='es'>"
        "<head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        "<title>CorpX Canal ICMP</title>"
        "<style>"
        ":root{"
        "--bg:#080f18;--surface:#0d1a26;--border:#1a3a2a;"
        "--accent:#22c55e;--accent2:#16a34a;"
        "--muted:#5a7a8a;--fg:#c8dde8;--fg-hi:#edf4f8;"
        "--flag-bg:#071a0f;--flag-fg:#86efac;"
        "--scan:rgba(34,197,94,0.03);color-scheme:dark}"
        "*{box-sizing:border-box;margin:0;padding:0}"
        "body{background:var(--bg);color:var(--fg);"
        "font-family:'Courier New',monospace;min-height:100vh;"
        "display:flex;flex-direction:column;align-items:center;justify-content:center;"
        "padding:24px 16px;"
        "background-image:repeating-linear-gradient(0deg,var(--scan) 0,var(--scan) 1px,transparent 1px,transparent 4px)}"
        ".card{width:100%;max-width:460px;background:var(--surface);"
        "border:1px solid var(--border);border-radius:10px;overflow:hidden;"
        "box-shadow:0 0 40px rgba(34,197,94,.07),0 2px 20px rgba(0,0,0,.6)}"
        ".topbar{display:flex;align-items:center;gap:8px;padding:9px 14px;"
        "background:#060d14;border-bottom:1px solid var(--border);"
        "font-size:.7rem;color:var(--muted)}"
        ".dot{width:9px;height:9px;border-radius:50%}"
        ".dr{background:#ef4444}.dy{background:#f59e0b}.dg{background:var(--accent)}"
        ".tt{flex:1;text-align:center;color:var(--accent);font-weight:700;letter-spacing:.5px}"
        ".hdr{padding:16px 20px 14px;border-bottom:1px solid var(--border)}"
        ".ey{font-size:.6rem;letter-spacing:2px;text-transform:uppercase;"
        "color:var(--accent);margin-bottom:4px}"
        ".ti{font-size:1.05rem;font-weight:700;color:var(--fg-hi)}"
        ".su{margin-top:3px;font-size:.68rem;color:var(--muted)}"
        ".img-w{background:#040a10;padding:14px 20px;border-bottom:1px solid var(--border)}"
        ".img-w img{width:100%;border-radius:6px;border:1px solid var(--border);display:block}"
        ".meta{padding:12px 20px;border-bottom:1px solid var(--border);"
        "display:grid;grid-template-columns:1fr 1fr;gap:8px}"
        ".ml{font-size:.58rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)}"
        ".mv{font-size:.75rem;color:var(--fg);margin-top:1px}"
        ".mv.ok{color:var(--accent)}"
        ".fs{padding:16px 20px 20px}"
        ".fl{font-size:.6rem;letter-spacing:2px;text-transform:uppercase;"
        "color:var(--accent2);margin-bottom:8px;display:flex;align-items:center;gap:6px}"
        ".fl::before{content:'';width:7px;height:7px;background:var(--accent);"
        "border-radius:50%;animation:bl 1.2s step-end infinite}"
        "@keyframes bl{50%{opacity:0}}"
        ".fb{background:var(--flag-bg);border:1px solid var(--accent2);border-radius:6px;"
        "padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px}"
        ".fv{font-size:.9rem;font-weight:700;color:var(--flag-fg);word-break:break-all;min-width:0}"
        ".cb{flex-shrink:0;background:transparent;border:1px solid var(--accent2);"
        "border-radius:4px;color:var(--accent);font-size:.6rem;letter-spacing:1px;"
        "padding:4px 9px;cursor:pointer;transition:background .15s}"
        ".cb:hover{background:rgba(34,197,94,.1)}"
        ".ft{padding:8px 20px 12px;font-size:.6rem;color:#334455;text-align:center}"
        "</style></head><body>"
        "<div class='card'>"
        "<div class='topbar'>"
        "<span class='dot dr'></span><span class='dot dy'></span><span class='dot dg'></span>"
        "<span class='tt'>corpx-icmp-intercept &mdash; :9080</span></div>"
        "<div class='hdr'>"
        "<div class='ey'>// canal encubierto detectado</div>"
        "<div class='ti'>Mensaje interceptado via ICMP</div>"
        "<div class='su'>192.168.56.105 &rarr; echo reply &rarr; payload no convencional</div>"
        "</div>"
        f"<div class='img-w'><img src='{img_src}' alt='mensaje interceptado'></div>"
        "<div class='meta'>"
        "<div><div class='ml'>protocolo</div><div class='mv'>ICMP echo reply</div></div>"
        "<div><div class='ml'>tipo</div><div class='mv'>0x00 / code 0</div></div>"
        "<div><div class='ml'>origen</div><div class='mv'>192.168.56.105</div></div>"
        "<div><div class='ml'>estado</div><div class='mv ok'>&#10003; bandera hallada</div></div>"
        "</div>"
        "<div class='fs'>"
        "<div class='fl'>bandera capturada</div>"
        "<div class='fb'>"
        f"<span class='fv' id='fv'>{flag}</span>"
        "<button class='cb' onclick=\"var t=document.getElementById('fv').textContent;"
        "navigator.clipboard.writeText(t).then(function(){"
        "this.textContent='\\u2713 OK';setTimeout(function(){document.querySelector('.cb').textContent='COPIAR';},1600)"
        "}.bind(this)).catch(function(){var r=document.createRange();"
        "r.selectNode(document.getElementById('fv'));"
        "window.getSelection().removeAllRanges();window.getSelection().addRange(r);})\">"
        "COPIAR</button></div></div>"
        "<div class='ft'>reto 09 &mdash; payload oculto en ICMP echo reply &mdash; Hackemon CTF</div>"
        "</div></body></html>"
    ).encode("utf-8")

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt, *args):
            print(f"[http] {self.address_string()} - {fmt % args}")

        def do_GET(self):
            if self.path in ("/", "/index.html"):
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(page_html)))
                self.end_headers()
                self.wfile.write(page_html)
            else:
                self.send_error(404)

    return Handler

# ── Utilidades ICMP ───────────────────────────────────────────────────────────
def checksum(data: bytes) -> int:
    if len(data) % 2:
        data += b"\x00"
    s = 0
    for i in range(0, len(data), 2):
        s += (data[i] << 8) + data[i + 1]
    s = (s >> 16) + (s & 0xFFFF)
    s += s >> 16
    return (~s) & 0xFFFF

def build_echo_reply(ident: int, seq: int, payload: bytes) -> bytes:
    header = struct.pack("!BBHHH", ICMP_ECHO_REP, 0, 0, ident, seq)
    chk    = checksum(header + payload)
    return struct.pack("!BBHHH", ICMP_ECHO_REP, 0, chk, ident, seq) + payload

def kernel_echo_ignore(enable: bool) -> str | None:
    try:
        prev = subprocess.check_output(["sysctl", "-n", SYSCTL_KEY],
                                        text=True).strip()
    except Exception:
        prev = None
    subprocess.run(["sysctl", "-w", f"{SYSCTL_KEY}={1 if enable else 0}"],
                   check=False, stdout=subprocess.DEVNULL)
    return prev

# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser(
        description="Responder ICMP + servidor HTTP para el reto 09")
    ap.add_argument("--flag",  default=os.environ.get("FLAG", FLAG_DEFAULT),
                    help="Bandera a mostrar en la pagina web")
    ap.add_argument("--port",  type=int, default=HTTP_PORT,
                    help=f"Puerto HTTP (def: {HTTP_PORT})")
    ap.add_argument("--ip",    default=VM_A_IP,
                    help="IP de esta maquina en la red host-only")
    ap.add_argument("--image",
                    default=os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                         "hack-1.jpg"),
                    help="Imagen a mostrar en la pagina (def: hack-1.jpg)")
    ap.add_argument("--keep-kernel", action="store_true",
                    help="No desactivar la respuesta ICMP del kernel")
    args = ap.parse_args()

    if os.geteuid() != 0:
        print("[!] Necesita root: sudo python3 responder.py", file=sys.stderr)
        return 1

    if not os.path.exists(args.image):
        print(f"[!] No se encuentra la imagen: {args.image}", file=sys.stderr)
        return 1

    # URL que ira en el payload de cada echo reply
    payload = f"http://{args.ip}:{args.port}/".encode("ascii")

    # Servidor HTTP en hilo daemon
    handler = make_handler(args.image, args.flag, args.ip, args.port)
    httpd   = HTTPServer(("0.0.0.0", args.port), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()

    # Desactivar respuesta automatica del kernel
    prev = None
    if not args.keep_kernel:
        prev = kernel_echo_ignore(True)

    try:
        rx = socket.socket(socket.AF_INET, socket.SOCK_RAW,
                           socket.IPPROTO_ICMP)
    except PermissionError:
        print("[!] No se pudo abrir el raw socket (ejecuta con sudo).",
              file=sys.stderr)
        httpd.shutdown()
        return 1

    print()
    print("=" * 55)
    print(f"  Reto 09 - Ping sospechoso")
    print("=" * 55)
    print(f"  Imagen    : {args.image}")
    print(f"  Bandera   : {args.flag}")
    print(f"  Servidor  : http://{args.ip}:{args.port}/")
    print(f"  Payload   : {payload.decode()}")
    print("=" * 55)
    print()
    print(f"  Desde VM-B:  ping {args.ip}")
    print(f"  Captura  :   sudo tcpdump -i eth1 -A icmp")
    print(f"               -> busca la URL en el Data del Echo reply")
    print(f"               -> abrela en el navegador")
    print()
    print("  Ctrl+C para salir.")
    print()

    try:
        while True:
            packet, addr = rx.recvfrom(65535)
            src_ip = addr[0]
            ihl    = (packet[0] & 0x0F) * 4
            icmp   = packet[ihl:]
            if len(icmp) < 8:
                continue
            icmp_type, _, _, ident, seq = struct.unpack("!BBHHH", icmp[:8])
            if icmp_type != ICMP_ECHO_REQ:
                continue

            reply = build_echo_reply(ident, seq, payload)
            tx = socket.socket(socket.AF_INET, socket.SOCK_RAW,
                               socket.IPPROTO_ICMP)
            try:
                tx.sendto(reply, (src_ip, 0))
            finally:
                tx.close()
            print(f"  [>] ping de {src_ip} (id={ident} seq={seq})"
                  f" -> URL enviada")
    except KeyboardInterrupt:
        print("\n  [*] Saliendo...")
    finally:
        rx.close()
        httpd.shutdown()
        if not args.keep_kernel and prev is not None:
            kernel_echo_ignore(prev == "1")
            print(f"  [*] Restaurado {SYSCTL_KEY}={prev}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
