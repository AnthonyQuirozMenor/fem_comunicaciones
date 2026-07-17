# Servidor Web local en PowerShell para Linea de Tiempo
# UTF-8 Encoding
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$workspace = "c:\Users\The-b\Downloads\Linea de tiempo"
$fotosDir = Join-Path $workspace "fotos"

# Crear carpeta de fotos si no existe
if (-not (Test-Path $fotosDir)) {
    New-Item -ItemType Directory -Path $fotosDir | Out-Null
    Write-Host "Creada carpeta de fotos en: $fotosDir"
}

# Inicializar HttpListener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8000/")

try {
    $listener.Start()
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host " SERVIDOR INICIADO EN http://localhost:8000" -ForegroundColor Green
    Write-Host " Para apagar el servidor, cierre esta ventana o presione Ctrl+C" -ForegroundColor Yellow
    Write-Host "=========================================================" -ForegroundColor Green
} catch {
    Write-Host "Error al iniciar el servidor. Asegúrese de que el puerto 8000 esté libre: $_" -ForegroundColor Red
    Exit
}

function Get-ContentType ($filename) {
    $ext = [System.IO.Path]::GetExtension($filename).ToLower()
    switch ($ext) {
        ".html" { return "text/html; charset=utf-8" }
        ".css"  { return "text/css; charset=utf-8" }
        ".js"   { return "application/javascript; charset=utf-8" }
        ".json" { return "application/json; charset=utf-8" }
        ".png"  { return "image/png" }
        ".jpg"  { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".gif"  { return "image/gif" }
        ".webp" { return "image/webp" }
        ".svg"  { return "image/svg+xml" }
        default { return "application/octet-stream" }
    }
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $url = $request.Url.LocalPath
        
        # Log de peticiones
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] $($request.HttpMethod) $url" -ForegroundColor Cyan
        
        # Permitir CORS (para desarrollo si fuera necesario, pero servimos del mismo origen)
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, X-File-Name")
        
        # Headers para evitar caché del navegador
        $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
        $response.Headers.Add("Pragma", "no-cache")
        $response.Headers.Add("Expires", "0")
        
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.OutputStream.Close()
            continue
        }
        
        if ($request.HttpMethod -eq "GET") {
            # Endpoint para cargar datos
            if ($url -eq "/api/data") {
                $dataPath = Join-Path $workspace "data.json"
                if (Test-Path $dataPath) {
                    $bytes = [System.IO.File]::ReadAllBytes($dataPath)
                } else {
                    # Devolver datos por defecto vacíos
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes("[]")
                }
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.OutputStream.Close()
                continue
            }
            
            # Servir archivos estáticos
            $localPath = ""
            if ($url -eq "/") {
                $localPath = Join-Path $workspace "index.html"
            } elseif ($url.StartsWith("/fotos/")) {
                $filename = $url.Substring(7)
                # Decodificar el nombre del archivo para soportar espacios/caracteres URL
                $filename = [System.Web.HttpUtility]::UrlDecode($filename)
                $localPath = Join-Path $fotosDir $filename
            } else {
                # Decodificar URL
                $decodedUrl = [System.Web.HttpUtility]::UrlDecode($url.TrimStart('/'))
                $localPath = Join-Path $workspace $decodedUrl
            }
            
            if (Test-Path $localPath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($localPath)
                $response.ContentType = Get-ContentType $localPath
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: El archivo no existe.")
                $response.ContentType = "text/plain; charset=utf-8"
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $response.OutputStream.Close()
            
        } elseif ($request.HttpMethod -eq "POST") {
            # Endpoint para guardar datos
            if ($url -eq "/api/data") {
                $dataPath = Join-Path $workspace "data.json"
                $inputStream = $request.InputStream
                $fileStream = [System.IO.File]::Create($dataPath)
                $inputStream.CopyTo($fileStream)
                $fileStream.Close()
                
                $response.StatusCode = 200
                $response.ContentType = "application/json; charset=utf-8"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"success", "message":"Datos guardados correctamente"}')
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.OutputStream.Close()
                
            # Endpoint para subir imágenes
            } elseif ($url -eq "/api/upload") {
                # Obtener el nombre original desde los headers
                $rawFilename = $request.Headers["X-File-Name"]
                if ([string]::IsNullOrEmpty($rawFilename)) {
                    $rawFilename = "imagen.png"
                }
                
                # Limpiar el nombre de archivo (remover caracteres extraños y ruta)
                $originalName = [System.IO.Path]::GetFileName($rawFilename)
                $originalName = $originalName -replace '[^a-zA-Z0-9_\-\.]', '_'
                
                # Generar un nombre único para evitar sobreescritura
                $uniquePrefix = [Guid]::NewGuid().ToString().Substring(0, 8)
                $finalFilename = $uniquePrefix + "_" + $originalName
                
                $savePath = Join-Path $fotosDir $finalFilename
                
                # Guardar el stream binario al archivo
                $inputStream = $request.InputStream
                $fileStream = [System.IO.File]::Create($savePath)
                $inputStream.CopyTo($fileStream)
                $fileStream.Close()
                
                Write-Host "Archivo guardado en: $savePath" -ForegroundColor Green
                
                # Devolver el path relativo para el frontend
                $response.StatusCode = 200
                $response.ContentType = "application/json; charset=utf-8"
                
                # Codificar el nombre final de la URL para que sea seguro
                $encodedFilename = [System.Web.HttpUtility]::UrlPathEncode($finalFilename)
                $jsonResponse = '{"status":"success", "filePath": "/fotos/' + $encodedFilename + '"}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonResponse)
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.OutputStream.Close()
            } else {
                $response.StatusCode = 404
                $response.OutputStream.Close()
            }
        }
    } catch {
        Write-Host "Error al procesar petición: $_" -ForegroundColor Red
        if ($null -ne $response) {
            try {
                $response.StatusCode = 500
                $bytes = [System.Text.Encoding]::UTF8.GetBytes("500 Internal Server Error: $_")
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.OutputStream.Close()
            } catch {}
        }
    }
}
