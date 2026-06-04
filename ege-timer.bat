@echo off
copy /Y "%~dp0ege-widget.html" "%USERPROFILE%\Desktop\ege-widget.html" >nul
start "" "chrome.exe" --app=file:///%USERPROFILE:\=/%/Desktop/ege-widget.html --window-size=440,155
