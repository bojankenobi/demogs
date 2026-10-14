@echo off
chcp 65001 >nul
title Grand Slot Server
echo ===================================================
echo           POKRETANJE GRAND SLOT APLIKACIJE
echo ===================================================
echo Otvaranje pretraživaca na: http://localhost:8080
echo.

start http://localhost:8080

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Pokretanje putem Python servera na portu 8080...
    python -m http.server 8080
    goto end
)

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Pokretanje putem Node.js servera na portu 8080...
    node -e "const http=require('http'),fs=require('fs'),path=require('path');const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json','.json':'application/json','.ico':'image/x-icon'};http.createServer((req,res)=>{let p=path.join('.',decodeURIComponent(req.url.split('?')[0]));if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');fs.readFile(p,(err,data)=>{if(err){res.writeHead(404);res.end('Not Found');}else{res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});res.end(data);}});}).listen(8080,()=>console.log('Server aktivan na http://localhost:8080'));"
    goto end
)

echo [GRESKA] Nije pronadjen Python ni Node.js u sistemskim putanjama.
pause

:end
