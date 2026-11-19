F = {i: f for i, f in enumerate([
 "HACKEMON{foca_en_los_metadatos}", "2600:3c01:e000:3e6::6d4e:7061", "HACKEMON{las_cabeceras_hablan}",
 "Port21", "HACKEMON{http_sin_cifrar_se_ve_todo}", "HACKEMON{ftp_en_texto_plano}",
 "HACKEMON{dns_tambien_filtra_datos}", "HACKEMON{SNMP_Win32_Users_Enumerated}", "HACKEMON{icmp_oculta_mensajes}",
 "HACKEMON{inyeccion_sql_clasica}", "HACKEMON{enumerar_antes_de_atacar}", "HACKEMON{golpea_las_puertas_en_orden}"], 1)}
D = "http://127.0.0.1:8080/descargas/"
W = "http://127.0.0.1:8081"
def r(i, z, x, y, titulo, cri, tipo, brief, objetivo, tools, etica, pistas, descarga=None,
      herramienta_descarga=None):
    return dict(id=i, zona=z, x=x, y=y, titulo=titulo, criatura=cri, tipo=tipo, brief=brief,
                objetivo=objetivo, tools=tools, etica=etica, pistas=pistas, flag=F[i], descarga=descarga,
                herramienta_descarga=herramienta_descarga)
E_SCAN = "Escanea solo equipos propios o con autorización escrita. Un escaneo sin permiso puede ser delito."
E_WEB = "Probar un sitio ajeno sin permiso es ilegal. Aquí el alcance es solo este laboratorio."
E_PCAP = "Una captura de red contiene datos privados: analízala solo con autorización y no la compartas."
RETOS = [
 r(1,1,5,8,"Metadatos ocultos","Foca","Forense","Una imagen de Hackémon guarda una bandera en sus metadatos. Descárgala y examínala con FOCA.","Revisa los metadatos de la imagen descargada.",["FOCA","exiftool"],
   "Los metadatos pueden revelar información privada. Analiza solo archivos del laboratorio y elimínalos antes de compartir imágenes.",
   ["Descarga reto01_foca.png con el botón de abajo.","Abre la imagen en FOCA y consulta sus metadatos.","Busca el campo Comment"],
   "/descargas/reto01_foca.png", "/descargas/foca"),
 r(2,1,11,6,"El Rastreo Nocturnal de Noctowl","Noctowl","OSINT / Reconocimiento Pasivo","Consulta los registros DNS de nmap.org para identificar su dirección IPv6 pública.","nmap.org",["nslookup"],"La consulta DNS es de reconocimiento pasivo. Limítate a información pública y no escanees sistemas ajenos.",
   ["Abre tu consola o terminal (CMD, PowerShell o Bash) y ejecuta directamente el comando nslookup nmap.org.","Analiza la salida en la pantalla. Una dirección IPv6 se diferencia de la tradicional IPv4 porque es mucho más larga, incluye letras y está separada por bloques de dos puntos (:).","A diferencia de las direcciones tradicionales, la IPv6 que buscas utiliza formato hexadecimal."]),
 r(3,1,6,24,"Cabeceras que hablan","Cabecín","Web","Los desarrolladores dejaron algo en la respuesta HTTP de la página principal.",W,["curl -I","navegador (F12)"],E_WEB,
   ["curl -i "+W,"Mira las cabeceras X-...","Busca una cabecera de depuración."]),
 r(4,1,12,22,"El saludo del FTP","Portulín","Red / FTP",
   "Desde la terminal de Kali Linux, usa curl para consultar el banner del servidor FTP simulado en tu laboratorio local. El servicio de prueba escucha en el puerto 9003.",
   "curl [opciones] ftp://127.0.0.1:9003/ — identifica el puerto estándar de control de FTP. Ingresa solo el valor, sin FLAG{} ni otros caracteres.",
   ["curl","FTP"],
   "Conéctate únicamente al servicio local del laboratorio. No utilices estas instrucciones para consultar sistemas públicos sin autorización.",
   ["Agrega -v después de curl para mostrar los detalles de la conexión.",
    "Agrega --connect-timeout 5 para limitar la espera a cinco segundos.",
    "Usa ftp://127.0.0.1:9003/. El servicio local usa 9003 para la prueba; ¿cuál es el puerto estándar de control de FTP?"]),
 r(5,2,20,7,"Login en claro","Tiburín","Red","Alguien inició sesión en un sitio sin HTTPS. Encuentra su clave en la captura.",D+"reto05_http.pcap",["Wireshark","tshark"],E_PCAP,
   ["Filtro de Wireshark: http.request.method == \"POST\"","Abre el paquete y mira el cuerpo del formulario.","tshark -r reto05_http.pcap -Y http.request.method==POST -T fields -e urlencoded-form.value"]),
 r(6,2,27,9,"FTP sin cifrar","Ftupo","Red","Una sesión FTP quedó grabada. Recupera la contraseña.",D+"reto06_ftp.pcap",["Wireshark"],E_PCAP,
   ["Filtro: ftp","Clic derecho en un paquete > Follow > TCP Stream.","Busca el comando PASS."]),
 r(7,2,21,25,"Datos por DNS","Dnsito","Red","Un equipo comprometido sacó datos escondidos en consultas DNS.",D+"reto07_dns.pcap",["Wireshark","tshark","base32"],E_PCAP,
   ["Filtro: dns.qry.name contains \"datos.hackemon.lab\"","Une los fragmentos en orden (el número antes del guion).","Está en Base32; añade '=' hasta que el largo sea múltiplo de 8 y usa base32 -d."]),
 r(8,2,28,23,"El Sensor SNMP de MIBito","MIBito","Enumeración UDP",
   "El servidor Hackémon expone su servicio SNMP en el puerto 161/UDP. Usa Nmap con el script snmp-win32-users para enumerar las cuentas del sistema y encontrar la bandera oculta.",
   "192.168.56.105",["nmap","snmpwalk","onesixtyone"],
   "El escaneo UDP sin autorización puede considerarse intrusión. El alcance de este reto es exclusivamente el servidor de laboratorio 192.168.56.105.",
   ["SNMP opera sobre UDP, no TCP. Necesitas el flag -sU en nmap para sondear el puerto 161.",
    "Ejecuta: sudo nmap -v -sU -p 161 --script=snmp-win32-users 192.168.56.105",
    "Revisa la sección 'Account' en la salida de nmap. Una de las cuentas tiene un nombre fuera de lo ordinario — ese es tu flag."]),
 r(9,3,36,6,"Ping sospechoso","Pingüex","Red","Un ping con identificador raro lleva un mensaje en el campo de datos.",D+"reto09_icmp.pcap",["Wireshark","tshark","xxd"],E_PCAP,
   ["Filtro: icmp.ident == 4919","Cada paquete lleva unos pocos bytes en Data.","tshark -r reto09_icmp.pcap -Y icmp.ident==4919 -T fields -e data.data | tr -d '\\n' | xxd -r -p"]),
 r(10,3,43,8,"Portal vulnerable","Inyectol","Web","El portal de login arma su consulta SQL concatenando texto. Entra como admin.",W+"/portal",["navegador","curl","burp (opcional)"],"La inyección SQL contra sistemas ajenos es delito. Defensa: consultas parametrizadas.",
   ["Prueba una comilla simple en el usuario y observa el error.","La consulta compara usuario Y clave. ¿Cómo anulas la parte de la clave?","Usuario: admin'--"]),
 r(11,3,37,24,"Enumerar antes de atacar","Gobustín","Web","Hay un directorio de respaldo olvidado con una credencial de API. Úsala en /api/flag.",W,["gobuster","curl"],E_WEB,
   ["gobuster dir -u "+W+" -w /usr/share/wordlists/dirb/common.txt -x bak","Repite dentro del directorio hallado.","curl -H 'X-API-Key: <clave>' "+W+"/api/flag"]),
 r(12,3,44,22,"Golpes en orden","Knocktopus","Red","El servicio oculto del puerto 7100 solo responde si 'golpeas' tres puertos en el orden correcto. La captura muestra un cliente legítimo.",D+"reto12_knock.pcap + 127.0.0.1:7100",["Wireshark","nc","nmap"],E_SCAN,
   ["Filtro: tcp.flags.syn==1 && tcp.flags.ack==0 && tcp.dstport>=7001 && tcp.dstport<=7003","Anota el orden de los puertos 7001-7003.","for p in <orden>; do nc -z -w1 127.0.0.1 $p; done; nc 127.0.0.1 7100"]),
]
