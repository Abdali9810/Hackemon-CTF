# =============================================================================
# export_docker.ps1  —  Hackemon CTF  —  Construir y exportar imagen Docker
# Ejecutar desde PowerShell en la raíz del proyecto:
#   .\export_docker.ps1
# =============================================================================

$IMAGE     = "hackemon-ctf:latest"
$TAR       = "hackemon-ctf.tar"
$ZIP       = "hackemon-ctf-deploy.zip"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Hackemon CTF — Exportar imagen Docker" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# ── Verificar archivos necesarios ────────────────────────────────────────────
$ok = $true
foreach ($f in @("FOCA-v3.4.7.1.zip", "informe_recon_iana_oculto.pdf")) {
    if (-not (Test-Path $f)) {
        Write-Host "[!] Falta: $f (el reto correspondiente no tendrá descarga)" -ForegroundColor Yellow
        $ok = $false
    }
}
if (-not $ok) {
    Write-Host ""
    Write-Host "  Continuar de todas formas (los retos 1 y 3 no tendrán archivos descargables)."
    Write-Host ""
}

# ── Construir imagen ─────────────────────────────────────────────────────────
Write-Host "[1/3] Construyendo imagen: $IMAGE ..." -ForegroundColor Green
docker build -t $IMAGE .
if ($LASTEXITCODE -ne 0) {
    Write-Host "[x] Error en docker build. Revisa los mensajes anteriores." -ForegroundColor Red
    exit 1
}
Write-Host "     OK: imagen construida." -ForegroundColor Green
Write-Host ""

# ── Exportar imagen a .tar ───────────────────────────────────────────────────
Write-Host "[2/3] Exportando imagen a $TAR ..." -ForegroundColor Green
docker save -o $TAR $IMAGE
if ($LASTEXITCODE -ne 0) {
    Write-Host "[x] Error al exportar la imagen." -ForegroundColor Red
    exit 1
}
$sizeMB = [math]::Round((Get-Item $TAR).Length / 1MB, 1)
Write-Host "     OK: $TAR ($sizeMB MB)" -ForegroundColor Green
Write-Host ""

# ── Crear paquete de despliegue .zip ─────────────────────────────────────────
Write-Host "[3/3] Empaquetando archivos de despliegue en $ZIP ..." -ForegroundColor Green

$filesToPack = @(
    $TAR,
    "docker-compose.yml",
    "deploy.sh",
    ".dockerignore"
)

# Incluir reto07 ICMP si existe
if (Test-Path "reto07_icmp") {
    $filesToPack += "reto07_icmp\responder.py"
    if (Test-Path "reto07_icmp\hack-1.jpg") { $filesToPack += "reto07_icmp\hack-1.jpg" }
}

# Eliminar zip anterior si existe
if (Test-Path $ZIP) { Remove-Item $ZIP -Force }

Compress-Archive -Path $filesToPack -DestinationPath $ZIP -Force
$zipMB = [math]::Round((Get-Item $ZIP).Length / 1MB, 1)
Write-Host "     OK: $ZIP ($zipMB MB)" -ForegroundColor Green
Write-Host ""

# ── Resumen ──────────────────────────────────────────────────────────────────
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  LISTO. Archivos generados:" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  $TAR     — imagen Docker exportada"
Write-Host "  $ZIP  — paquete completo para la VM"
Write-Host ""
Write-Host "  INSTRUCCIONES PARA LA VM (Linux):" -ForegroundColor Yellow
Write-Host "  ─────────────────────────────────"
Write-Host "  1. Copiar $ZIP a la VM:"
Write-Host "       scp $ZIP usuario@IP-VM:/home/usuario/"
Write-Host ""
Write-Host "  2. En la VM, descomprimir y desplegar:"
Write-Host "       unzip $ZIP -d hackemon"
Write-Host "       cd hackemon"
Write-Host "       chmod +x deploy.sh"
Write-Host "       ./deploy.sh --load          # modo local (127.0.0.1)"
Write-Host "       ./deploy.sh --load --server # modo red (0.0.0.0)"
Write-Host ""
Write-Host "  3. Para el reto 7 (ICMP), en la VM objetivo 192.168.56.105:"
Write-Host "       sudo python3 responder.py --flag 'burbuja' --image hack-1.jpg"
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
