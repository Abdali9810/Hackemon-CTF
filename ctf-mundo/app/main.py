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
tries = defaultdict(deque)
@game.post("/api/validar")
def validar():
    q = tries[request.remote_addr]; now = time.time()
    while q and now - q[0] > 60: q.popleft()
    if len(q) >= 8: return jsonify(ok=False, error="limite"), 429
    q.append(now); d = request.get_json(silent=True) or {}; f = F.get(d.get("id"))
    return jsonify(ok=bool(f) and hmac.compare_digest(str(d.get("flag", "")).strip().encode(), f.encode()))
@game.get("/descargas/<path:n>")
def desc(n): return send_from_directory(os.path.join(B, "artefactos"), n, as_attachment=True)

obj = Flask("objetivo"); KEY = secrets.token_hex(8); ADMIN = secrets.token_hex(6)
@obj.get("/")
def home():
    r = make_response('<h1>CorpX Intranet</h1><p>Bienvenido, agente. <a href="/portal">Portal</a></p>')
    r.headers["X-Debug-Token"] = F[3]; return r
@obj.get("/robots.txt")
def robots(): return "User-agent: *\nDisallow: /archivo-secreto-7f3a\n", 200, {"Content-Type": "text/plain"}
@obj.get("/archivo-secreto-7f3a")
def sec(): return F[2] + "\n", 200, {"Content-Type": "text/plain"}
FORM = '<h2>Portal CorpX</h2><form method=post>Usuario <input name=u><br>Clave <input name=c type=password><br><button>Entrar</button></form>'
@obj.route("/portal", methods=["GET", "POST"])
def portal():
    if request.method == "GET": return FORM
    u, c = request.form.get("u", ""), request.form.get("c", "")
    db = sqlite3.connect(":memory:"); db.execute("create table usuarios(u,c,rol)")
    db.executemany("insert into usuarios values(?,?,?)", [("admin", ADMIN, "admin"), ("invitado", "invitado", "user")])
    try: row = db.execute(f"SELECT u,rol FROM usuarios WHERE u='{u}' AND c='{c}'").fetchone()  # vulnerable A PROPOSITO
    except Exception as e: return FORM + f"<p>Error SQL: {escape(e)}</p>", 500
    if not row: return FORM + "<p>Credenciales inválidas</p>", 401
    return f"<p>Hola {escape(row[0])} ({row[1]})</p>" + (f"<p>{F[10]}</p>" if row[1] == "admin" else "")
@obj.get("/backup", strict_slashes=False)
def bk(): return "Acceso restringido", 403
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
tcp(9003, lambda s, ip, ts: s.sendall(b"220 CorpX-FTP listo\r\n"))
tcp(9007, lambda s, ip, ts: s.sendall(f"CORPX-BEACON/1.0 {F[1]}\r\n".encode()))
SEQ, ev = [7003, 7001, 7002], defaultdict(list)
for p in SEQ: tcp(p, lambda s, ip, ts, p=p: ev[ip].append((p, ts)))
def door(s, ip, ts):
    now = time.time(); last = [p for p, t in sorted(ev[ip], key=lambda e: e[1]) if now - t < 15][-3:]
    s.sendall((F[12] + "\n" if last == SEQ else "Acceso denegado\n").encode())
tcp(7100, door)
threading.Thread(target=lambda: serve(obj, host="0.0.0.0", port=8081, threads=8), daemon=True).start()
print("Mundo CTF listo: http://127.0.0.1:8080", flush=True)
serve(game, host="0.0.0.0", port=8080, threads=8)
