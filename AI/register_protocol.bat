@echo off
:: Check if running as Administrator
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo Requesting administrative privileges...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit
)

:: Registry modifications for custom URL protocol
reg add "HKEY_CLASSES_ROOT\examclient" /ve /d "URL:Exam Client Protocol" /f
reg add "HKEY_CLASSES_ROOT\examclient" /v "URL Protocol" /d "" /f
reg add "HKEY_CLASSES_ROOT\examclient\shell" /f
reg add "HKEY_CLASSES_ROOT\examclient\shell\open" /f
reg add "HKEY_CLASSES_ROOT\examclient\shell\open\command" /ve /d "\"%~dp0anti_cheat.exe\" \"%1\"" /f

echo Custom protocol registered successfully.
