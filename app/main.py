import os, time, hmac, secrets, sqlite3, threading, socketserver
from collections import defaultdict, deque
from flask import Flask, jsonify, request, send_from_directory, make_response
from markupsafe import escape
from waitress import serve
from retos import RETOS, F
B = os.path.dirname(os.path.abspath(__file__))
PUB = [{k: v for k, v in r.items() if k != "flag"} for r in RETOS]
game = Flask(__name__, static_folder=os.path.join(B, "static"), static_url_path="")
@game.get("/")
def idx(): return game.send_static_file("index.html")
@game.get("/api/retos")
def retos(): return jsonify(PUB)
@game.get("/descargas/foca")
def descargar_foca():
    return send_from_directory("/downloads", "FOCA-v3.4.7.1.zip", as_attachment=True)
tries = defaultdict(deque)
@game.post("/api/validar")
def validar():
    q = tries[request.remote_addr]; now = time.time()
    while q and now - q[0] > 60: q.popleft()
    if len(q) >= 8: return jsonify(ok=False, error="limite"), 429
    q.append(now); d = request.get_json(silent=True) or {}; f = F.get(d.get("id"))
    return jsonify(ok=bool(f) and hmac.compare_digest(str(d.get("flag", "")).strip().encode(), f.encode()))
ADMIN_TR_USER = "Admin-TR"
ADMIN_TR_PASS = os.environ.get("ADMIN_TR_PASS") or "ContraseñaTR"
admin_tries = defaultdict(deque)
@game.post("/api/admin/login")
def admin_login():
    q = admin_tries[request.remote_addr]; now = time.time()
    while q and now - q[0] > 60: q.popleft()
    if len(q) >= 5: return jsonify(ok=False, error="limite"), 429
    q.append(now); d = request.get_json(silent=True) or {}
    ok = (str(d.get("usuario", "")) == ADMIN_TR_USER
          and hmac.compare_digest(str(d.get("clave", "")).encode(), ADMIN_TR_PASS.encode()))
    if not ok: return jsonify(ok=False), 401
    return jsonify(ok=True, respuestas=F)
@game.get("/descargas/<path:n>")
def desc(n): return send_from_directory(os.path.join(B, "artefactos"), n, as_attachment=True)

obj = Flask("objetivo"); KEY = secrets.token_hex(8); ADMIN = secrets.token_hex(6)
def page(title, body):
    return ('<!doctype html><html lang=es><head><meta charset=utf-8>'
            '<meta name=viewport content="width=device-width,initial-scale=1">'
            f'<title>{title} · CorpX</title><link rel=stylesheet href="/static/corpx.css"></head><body>'
            '<header class=top><div class=logo>CX</div><div><small>Intranet corporativa</small>'
            '<h1>CorpX Intranet</h1></div></header>'
            f'<main class=card>{body}</main></body></html>')
@obj.get("/")
def home():
    r = make_response(page("Inicio", '<h2>Bienvenido, agente</h2><p>Red interna de CorpX. Acceso al <a href="/portal">portal de empleados</a>.</p>'))
    r.headers["X-Debug-Token"] = F[3]; return r
FORM_BODY = ('<h2>Portal de empleados</h2><form method=post>'
             '<label>Usuario</label><input name=u autocomplete=off>'
             '<label>Clave</label><input name=c type=password>'
             '<button>Entrar</button></form>')
FORM = page("Portal", FORM_BODY)
@obj.route("/portal", methods=["GET", "POST"])
def portal():
    if request.method == "GET": return FORM
    u, c = request.form.get("u", ""), request.form.get("c", "")
    db = sqlite3.connect(":memory:"); db.execute("create table usuarios(u,c,rol)")
    db.executemany("insert into usuarios values(?,?,?)", [("admin", ADMIN, "admin"), ("invitado", "invitado", "user")])
    try: row = db.execute(f"SELECT u,rol FROM usuarios WHERE u='{u}' AND c='{c}'").fetchone()  # vulnerable A PROPOSITO
    except Exception as e: return page("Portal", FORM_BODY + f'<p class="msg err">Error SQL: {escape(e)}</p>'), 500
    if not row: return page("Portal", FORM_BODY + '<p class="msg err">Credenciales inválidas</p>'), 401
    body = f'<p class="msg ok">Hola {escape(row[0])} ({row[1]})</p>'
    if row[1] == "admin": body += f'<p>Flag recuperada: <span class=flag>{F[10]}</span></p>'
    return page("Portal", body)
@obj.get("/backup", strict_slashes=False)
def bk(): return page("Backup", '<h2>Acceso restringido</h2><p class="msg err">Este directorio está fuera de tu alcance, agente.</p>'), 403
@obj.get("/backup/config.bak")
def cfg(): return f"# respaldo\nDB_HOST=db.corpx.lab\nAPI_KEY={KEY}\n", 200, {"Content-Type": "text/plain"}
@obj.get("/api/flag")
def apiflag():
    if request.headers.get("X-API-Key") == KEY: return F[11] + "\n"
    return "Falta X-API-Key valida\n", 401

class Q(socketserver.ThreadingTCPServer):
    allow_reuse_address = True; daemon_threads = True
    def get_request(self):
        c, a = super().get_request(); return c, (a[0], a[1], time.time())  # hora exacta de llegada
def tcp(port, fn):
    class H(socketserver.BaseRequestHandler):
        def handle(s):
            try: fn(s.request, s.client_address[0], s.client_address[2])
            except Exception: pass
    threading.Thread(target=Q(("0.0.0.0", port), H).serve_forever, daemon=True).start()
SEQ, ev = [7003, 7001, 7002], defaultdict(list)
for p in SEQ: tcp(p, lambda s, ip, ts, p=p: ev[ip].append((p, ts)))
def door(s, ip, ts):
    now = time.time(); last = [p for p, t in sorted(ev[ip], key=lambda e: e[1]) if now - t < 15][-3:]
    s.sendall((F[12] + "\n" if last == SEQ else "Acceso denegado\n").encode())
tcp(7100, door)
threading.Thread(target=lambda: serve(obj, host="0.0.0.0", port=8081, threads=8), daemon=True).start()
print("Mundo CTF listo: http://127.0.0.1:8080", flush=True)
serve(game, host="0.0.0.0", port=8080, threads=8)
