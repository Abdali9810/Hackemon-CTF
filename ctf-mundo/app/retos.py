F = {i: f for i, f in enumerate([
 "HACKEMON{nmap_ve_puertos_abiertos}", "HACKEMON{robots_no_es_seguridad}", "HACKEMON{las_cabeceras_hablan}",
 "HACKEMON{sunshine}", "HACKEMON{http_sin_cifrar_se_ve_todo}", "HACKEMON{ftp_en_texto_plano}",
 "HACKEMON{dns_tambien_filtra_datos}", "HACKEMON{metadatos_que_delatan}", "HACKEMON{icmp_oculta_mensajes}",
 "HACKEMON{inyeccion_sql_clasica}", "HACKEMON{enumerar_antes_de_atacar}", "HACKEMON{golpea_las_puertas_en_orden}"], 1)}
D = "http://127.0.0.1:8080/descargas/"
W = "http://127.0.0.1:8081"
def r(i, z, x, y, titulo, cri, tipo, brief, objetivo, tools, etica, pistas):
    return dict(id=i, zona=z, x=x, y=y, titulo=titulo, criatura=cri, tipo=tipo, brief=brief,
                objetivo=objetivo, tools=tools, etica=etica, pistas=pistas, flag=F[i])
E_SCAN = "Escanea solo equipos propios o con autorización escrita. Un escaneo sin permiso puede ser delito."
E_WEB = "Probar un sitio ajeno sin permiso es ilegal. Aquí el alcance es solo este laboratorio."
E_PCAP = "Una captura de red contiene datos privados: analízala solo con autorización y no la compartas."
RETOS = [
 r(1,1,5,8,"Puertos abiertos","Nmapito","Red","Un servicio de Hackemon responde en algún puerto entre el 9001 y el 9010. Hay un señuelo.","127.0.0.1 puertos 9001-9010",["nmap","nc"],E_SCAN,
   ["Escanea el rango: nmap -p 9001-9010 127.0.0.1","Dos puertos están abiertos; uno es un señuelo.","Conéctate a cada uno: nc 127.0.0.1 <puerto>"]),
 r(2,1,11,6,"Lo que robots no quiere","Robotín","Web","La intranet web esconde una ruta que no quiere que los buscadores indexen.",W,["curl","navegador"],E_WEB,
   ["curl "+W+"/robots.txt","Disallow no protege nada: la ruta sigue siendo pública.","Visita la ruta que aparece prohibida."]),
 r(3,1,6,24,"Cabeceras que hablan","Cabecín","Web","Los desarrolladores dejaron algo en la respuesta HTTP de la página principal.",W,["curl -I","navegador (F12)"],E_WEB,
   ["curl -i "+W,"Mira las cabeceras X-...","Busca una cabecera de depuración."]),
 r(4,1,12,22,"Hash descuidado","Hashlín","Cripto","Descarga el archivo con un hash MD5. Recupera la contraseña original: la bandera es HACKEMON{contraseña}.",D+"reto04_hash.txt",["hashid","john","hashcat"],"Romper hashes solo es legítimo con datos propios o autorizados. Defensa: contraseñas largas y hashes lentos (bcrypt, argon2).",
   ["hashid reto04_hash.txt","john --format=raw-md5 --wordlist=/usr/share/wordlists/rockyou.txt reto04_hash.txt","Si rockyou.txt no existe: sudo gunzip /usr/share/wordlists/rockyou.txt.gz"]),
 r(5,2,20,7,"Login en claro","Tiburín","Red","Alguien inició sesión en un sitio sin HTTPS. Encuentra su clave en la captura.",D+"reto05_http.pcap",["Wireshark","tshark"],E_PCAP,
   ["Filtro de Wireshark: http.request.method == \"POST\"","Abre el paquete y mira el cuerpo del formulario.","tshark -r reto05_http.pcap -Y http.request.method==POST -T fields -e urlencoded-form.value"]),
 r(6,2,27,9,"FTP sin cifrar","Ftupo","Red","Una sesión FTP quedó grabada. Recupera la contraseña.",D+"reto06_ftp.pcap",["Wireshark"],E_PCAP,
   ["Filtro: ftp","Clic derecho en un paquete > Follow > TCP Stream.","Busca el comando PASS."]),
 r(7,2,21,25,"Datos por DNS","Dnsito","Red","Un equipo comprometido sacó datos escondidos en consultas DNS.",D+"reto07_dns.pcap",["Wireshark","tshark","base32"],E_PCAP,
   ["Filtro: dns.qry.name contains \"datos.hackemon.lab\"","Une los fragmentos en orden (el número antes del guion).","Está en Base32; añade '=' hasta que el largo sea múltiplo de 8 y usa base32 -d."]),
 r(8,2,28,23,"Foto delatora","Exifox","Forense","Una foto filtrada guarda más de lo que muestra.",D+"reto08_foto.png",["exiftool","strings","base64"],"Los metadatos pueden exponer ubicación y autoría. Bórralos antes de publicar imágenes.",
   ["exiftool reto08_foto.png","Mira el campo Comment.","Parece Base64: echo '...' | base64 -d"]),
 r(9,3,36,6,"Ping sospechoso","Pingüex","Red","Un ping con identificador raro lleva un mensaje en el campo de datos.",D+"reto09_icmp.pcap",["Wireshark","tshark","xxd"],E_PCAP,
   ["Filtro: icmp.ident == 4919","Cada paquete lleva unos pocos bytes en Data.","tshark -r reto09_icmp.pcap -Y icmp.ident==4919 -T fields -e data.data | tr -d '\\n' | xxd -r -p"]),
 r(10,3,43,8,"Portal vulnerable","Inyectol","Web","El portal de login arma su consulta SQL concatenando texto. Entra como admin.",W+"/portal",["navegador","curl","burp (opcional)"],"La inyección SQL contra sistemas ajenos es delito. Defensa: consultas parametrizadas.",
   ["Prueba una comilla simple en el usuario y observa el error.","La consulta compara usuario Y clave. ¿Cómo anulas la parte de la clave?","Usuario: admin'--"]),
 r(11,3,37,24,"Enumerar antes de atacar","Gobustín","Web","Hay un directorio de respaldo olvidado con una credencial de API. Úsala en /api/flag.",W,["gobuster","curl"],E_WEB,
   ["gobuster dir -u "+W+" -w /usr/share/wordlists/dirb/common.txt -x bak","Repite dentro del directorio hallado.","curl -H 'X-API-Key: <clave>' "+W+"/api/flag"]),
 r(12,3,44,22,"Golpes en orden","Knocktopus","Red","El servicio oculto del puerto 7100 solo responde si 'golpeas' tres puertos en el orden correcto. La captura muestra un cliente legítimo.",D+"reto12_knock.pcap + 127.0.0.1:7100",["Wireshark","nc","nmap"],E_SCAN,
   ["Filtro: tcp.flags.syn==1 && tcp.flags.ack==0 && tcp.dstport>=7001 && tcp.dstport<=7003","Anota el orden de los puertos 7001-7003.","for p in <orden>; do nc -z -w1 127.0.0.1 $p; done; nc 127.0.0.1 7100"]),
]
