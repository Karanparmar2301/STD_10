@echo off
echo ========================================
echo   Student Dashboard - Supabase Version
echo ========================================
echo.
echo Starting Backend (FastAPI + Supabase)...
echo.

cd /d "%~dp0.."
start "Backend - FastAPI" cmd /k "python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend (React + Vite)...
echo.

cd /d "%~dp0"
start "Frontend - React" cmd /k "npm run dev"

echo.
echo ========================================
echo   Both servers are starting...
echo ========================================
echo.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
