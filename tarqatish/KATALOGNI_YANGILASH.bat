@echo off
chcp 65001 >nul
echo Katalog yangilanmoqda (YandexDisk - Upakovka katalog papkasidan)...
cd /d "C:\Users\admin\mebel-yuk-joylash"
node tarqatish\katalog.mjs --chiqar
echo.
pause
