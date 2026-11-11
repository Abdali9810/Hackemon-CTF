# Reto 07 — URL oculta en ICMP → imagen con la bandera

El echo reply lleva en su campo **Data** una URL en texto plano.
El alumno la descubre capturando el ping con Wireshark/tcpdump,
abre la URL en el navegador y ve una imagen con la bandera.

## Topología

```
VM-B 192.168.56.106               VM-A 192.168.56.105
   │                                     │
   │  ping 192.168.56.105                │
   │ ─────────────────────────────────► │  responder.py (raw socket)
   │                                     │  + mini servidor HTTP :9080
   │  echo reply  [Data: http://192.168.56.105:9080/]
   │ ◄───────────────────────────────── │
   │                                     │
   │  GET http://192.168.56.105:9080/    │
   │ ─────────────────────────────────► │
   │  <imagen con la bandera>            │
   │ ◄───────────────────────────────── │
```

> **¿Por qué no usar el Docker directamente?**
> Los puertos del contenedor están mapeados solo a `127.0.0.1`,
> así que VM-B no llega. El responder corre **en el SO de VM-A** (fuera
> del contenedor) y levanta su propio servidor HTTP en el puerto 9080.

---

## Montaje (en VM-A — como root)

```bash
cd reto07_icmp/
sudo python3 responder.py
```

Opciones:
```bash
sudo FLAG='CORPX{tu_bandera}' python3 responder.py     # cambia la bandera
sudo python3 responder.py --port 9080                   # cambia el puerto HTTP
sudo python3 responder.py --no-regen                    # usa imagen ya generada
```

El script hace tres cosas de forma automática:
1. **Genera** `reto07_flag.png` con la bandera (Pillow).
2. **Levanta** un servidor HTTP en `0.0.0.0:9080` que sirve la imagen.
3. **Intercepta** cada ping y responde con `http://192.168.56.105:9080/`
   en el payload (desactivando temporalmente la respuesta del kernel).

Al salir con **Ctrl+C** restaura `net.ipv4.icmp_echo_ignore_all`.

---

## Lo que hace el alumno (VM-B)

### 1. Hacer ping y capturar a la vez

```bash
# Terminal 1 — ping normal
ping 192.168.56.105

# Terminal 2 — captura
sudo tcpdump -i eth1 -A icmp
```

En la salida de tcpdump, en los paquetes **ICMP echo reply**, el campo Data
muestra algo como:

```
...q...http://192.168.56.105:9080/
```

Un echo reply normal llevaría `!"#$%&'()*+,-./0123456789:...` como payload,
así que esa URL salta a la vista.

### 2. Wireshark (alternativa visual)

Filtro: `icmp`

Seleccionar un *Echo (ping) reply* → panel inferior → **Data**:

```
68 74 74 70 3a 2f 2f 31 39 32 2e 31 36 38 2e 35 36 2e 31 30 35 3a 39 30 38 30 2f
h  t  t  p  :  /  /  1  9  2  .  1  6  8  .  5  6  .  1  0  5  :  9  0  8  0  /
```

### 3. Abrir la URL en el navegador

```
http://192.168.56.105:9080/
```

→ Se abre una página con la imagen **reto07_flag.png** mostrando la bandera.

---

## Pistas sugeridas para el juego

1. No todo ping responde igual. Captura el tráfico mientras pingeas a esa IP.
2. Filtro en Wireshark: `icmp`. Fíjate en el campo **Data** del *Echo reply*,
   no en el request.
3. El contenido del campo Data de la respuesta… ¿no parece texto legible?

---

## Ética

Laboratorio aislado. Haz ping y captura **solo** contra estas VMs propias.
