@echo off
setlocal
set "ROOT=%~dp0.."
cd /d "%ROOT%"
node "%~dp0lint-markdown.cjs" %*
exit /b %ERRORLEVEL%
