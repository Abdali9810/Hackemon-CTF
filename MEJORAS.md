# Plan de mejoras — rama `mejoras`

Cada mejora es **un commit independiente**: `git cherry-pick <sha>` de la que
quieras, descarta las demás. Ninguna depende de otra.

Leyenda: ✅ implementada · ⏳ pendiente de aprobación

---

# Parte 1 — implementada

| # | Mejora | Commit | Toca |
|---|--------|--------|------|
| M1 | Jingle de victoria completo al capturar (amplía `sfx.caught()`) | `4245631` | `game-audio.js` |
| M2 | Frontend CorpX (8081) con estética del juego — sin tocar lógica/SQLi | `a23886c` | `main.py` + `corpx.css` |
| M3 | Viento en hierba, flores y copas (vaivén con `tm`) | `eb4804c` | `game.js` |
| M4 | Transición de batalla al entrar al reto (barras de zona + whoosh) | `c088356` | `game.js` |
| M5 | Medallas por zona completada: `S.medals`, toast, 3 insignias en HUD e inventario | `1049d7c` | `game.js` + `game.css` |
| M6 | Distintivos por zona — Z1 lupas/notas/huellas · Z2 nodos/antenas/paquetes · Z3 terminales/candados/calaveras | `5e61421` | `game.js` |
| M7 | Aceptar respuesta con o sin `CORPX{}` en todos los retos (reto 2 sigue siendo IPv6 cruda) | `1f306c0` | `game.js` |
| E1 | Banner con nombre de zona al cruzar áreas | `7526a1d` | `game.js` + `game.css` |
| E2 | Confeti de partículas `ZC[z]` al capturar y ganar medalla | `8a171bd` | `game.js` |
| E3 | Pantalla "Liga Hackémon completada" (score, medallas, pistas, tiempo) | `fc63b8f` | `game.js` + `game.css` + `index.html` |
| E4 | Minimapa en HUD | `37fc7f4` | `game.js` + `game.css` + `index.html` |

# Parte 2 — implementada

| # | Mejora | Commit | Toca |
|---|--------|--------|------|
| P2-1 | Minimapa: arriba-izquierda, solo en mapa, toggle con tecla **N** | `bd85bfc` | `game.js` + `game.css` + `index.html` |
| P2-2 | HUD solo en mapa/diálogos — ya no solapa paneles/inventario/menú | `d2c9abf` | `game.js` |
| P2-3 | Ventana responsive hasta 1440px + textos de paneles escalables | `7431d78` | `game.css` |
| P2-4 | Textos de ayuda más grandes (footer `.k`, intro `.controls`) | `a3130d2` | `game.css` |
| P2-5 | Árboles y flores con mejor pixel art (sombra, tronco, tallo, pétalos) | `f195181` | `game.js` |
| P2-6 | Peces saltando en las tiles de agua | `57bc03a` | `game.js` |
| P2-7 | NPC pescador junto al río de Z2 — bloquea paso, habla con tips + humor | `6620251` | `game.js` |
| P2-8 | Fondos de captura por zona: Z1 jardín · Z2 bosque tecnificado con paquetes de luz · Z3 desierto con dunas | `0e3b6e3` | `game.js` |
| P2-9 | NPCs por zona (sistema genérico `NPCS`): niña detective Z1 + hacker retirado Z3 + pescador Z2 | `75e4dd4` | `game.js` |
| P2-10 | Sello "Purista" por zona completada sin pistas (estrella en inventario + toast) | `95c5a33` | `game.js` + `game.css` |
| P2-11 | Ambiente sonoro por zona: zumbido grave Z3, brillo Z2 (`setZone` en HackemonMusic) | `958b460` | `game.js` + `game-audio.js` |
| P2-12 | Ciclo suave de iluminación día/noche sobre el mapa | `b817cd0` | `game.js` |
| P2-13 | Z1 renombrada "Ruta Césped" → "Pradera Recon" | `4b4869f` | `game.js` + `index.html` |
| P2-14 | Cabecera visible siempre; retos/inventario empiezan bajo el HUD (corrige enfoque de P2-2) | `8ab139a` | `game.js` + `game.css` |

Nota: P2-9 refactoriza el código de P2-7 (fisherPos/fisherTalk → NPCS/npcPos/npcTalk); para cherry-pick conviene tomar ambos.

### Diálogos de NPCs (game.js) — contenido nuevo, no original

- **Pescador Z2** (`FISH_LINES`): tips de guardias/controles/pistas/descargas + humor ("hackear redes", "IA jaja", "peces sin ping", "40 años")
- **Niña detective Z1** (`GIRL_LINES`): metadatos/Comment PNG, exiftool/strings, recon pasivo, "cada píxel es una pista"
- **Hacker retirado Z3** (`HACKER_LINES`): enumerar antes de atacar, comilla SQLi `admin'--`, port knocking, cabeceras, "root con paciencia"

# Parte 3 — plan: completar los retos faltantes (retos.md)

El diseño original (`retos.md`) define **16 retos en 4 gimnasios**; el juego
tiene **12 en 3 zonas**. Análisis de qué falta y cómo adaptarlo manteniendo la
coherencia (mismo formato `r()`, pistas progresivas con costo, ética,
artefactos descargables, servicios locales).

## Entorno objetivo: Kali VM + contenedores = "las otras VMs"

El plan original pedía 2 VMs (Docker host + atacante Kali). Corriendo este
compose dentro de la VM Kali, el propio contenedor ES la víctima: tiene IP
real en `hackemon-ctf_default` (172.x) alcanzable desde Kali — nmap, curl y
nc funcionan de verdad contra ella. Los retos de clase pasan de "simulados"
a "reales contra localhost/red interna".

## Estado por reto del diseño original

| retos.md | Estado en el juego | Propuesta |
|----------|--------------------|-----------|
| R01 FOCA metadatos | ✅ = reto 1 | — |
| R02 IPv6 nslookup | ✅ = reto 2 | — |
| R03 DNSDumpster/IANA | ❌ **PDF ya en repo, sin reto** | Reto nuevo Z1: descargar `informe_recon_iana_oculto.pdf`, analizar con FOCA/exiftool → respuesta `220 IANA FTP Server` (flag `CORPX{220_iana_ftp_server}`). **Solo cablea lo que ya existe.** |
| R04 curl FTP banner | ❌ | Servicio TCP falso en puerto local (helper `tcp()` ya existe): `curl 127.0.0.1:PORT` → banner `220 CorpX FTP` con flag. Z3. |
| R05 nmap -sn | ❌ | Artefacto: `nmap_sn.txt` (salida simulada) → identificar la IP objetivo. Z2, coherente con retos de análisis. |
| R06 nmap -sS -sV | ❌ | Igual: `nmap_sv.txt` simulado → puerto+versión de Apache. Z2. |
| R07 SMB NSE | ❌ | Artefacto `smb_os_discovery.txt` → dominio/shares. Z2. |
| R08 SNMP 161 | ❌ | Artefacto `snmp_users.txt` → usuarios enumerados. Z2. |
| R09 pcap HTTP | ✅ ≈ reto 5 | — |
| R10 nmap vuln XML | ❌ | Artefacto `vuln_report.xml` (salida -oX) → hallar CVE/flag. Z3. |
| R11 backdoor.php | ❌ | Endpoint `/backdoor.php?cmd=` en 8081: shell simulada — solo responde a `cat reporte-notas.txt` (o similar) devolviendo la flag. Z3. |
| R12 netcat shell | ❌ | Servicio `tcp()` que al conectar y enviar el comando correcto devuelve flag — simula la reverse shell. Z3. |
| R13 SQLi POST | ✅ = reto 10 | — |
| R14 SQLi UNION GET | ❌ | Endpoint `/buscar?q=` en 8081 vulnerable a UNION: `1 UNION SELECT ...` devuelve la flag. Z3. |
| R15 SQLi blind | ❌ | Endpoint `/perfil?id=` boolean-blind en 8081: `?id=1 AND 1=1` vs `AND 1=2` cambian la página → inferir flag carácter a carácter (o respuesta simplificada para nivel intro). Z3. |
| R16 file upload webshell | ❌ | Endpoint `/subir` en 8081 que valida extensión/MIME de forma bypasseable → al "ejecutar" el archivo subido muestra flag. Z3. |

## Fases propuestas (cada item = commit independiente)

En Kali, la mayoría pasa a ser **reto real** (herramienta real contra la IP
del contenedor o servicios `tcp()`/endpoints 8081):

- **Fase A — retos reales en el lab** (sin tocar el mapa): R03-PDF (cablear
  artefacto + exiftool), R04 FTP banner `tcp()`, R05 `nmap -sn` a la IP del
  contenedor, R06 `nmap -sS -sV` a sus puertos, R11 `/backdoor.php`,
  R12 listener `nc`, R14 `/buscar` UNION, R15 `/perfil` blind, R16 `/subir`
  upload bypass.
- **Fase B — artefactos/artificiales** (lo que no se puede levantar real
  en el contenedor): R07 SMB, R08 SNMP, R10 vuln XML → salidas simuladas en
  `artefactos.py` (opcionalmente responder fake en puertos con `tcp()`).
- **Fase C — 4ª zona "Gimnasio Élite"**: W 48→64 tiles, 3er río+guardia en
  x=47, `ZN[4]/ZC[4]`, 4ª medalla, HUD "N/4". Los retos difíciles (blind,
  upload, shell) quedan aislados como contenido avanzado.

Fuera de alcance: DNSDumpster/Shodan reales, Mutillidae y DVWA externos
(los equivalentes en 8081 cubren el mismo concepto).

## Verificación

`static/` va por volumen → `Ctrl+F5`. Solo M2 pide rebuild
(`docker compose up --build -d`). Todo lo demás ya está en vivo.
