@echo off
title StockWise Inventory Management System Launcher
echo ====================================================================
echo     STOCKWISE: ENTERPRISE BUSINESS INVENTORY ANALYTICS LAUNCHER
echo ====================================================================
echo.

echo [1/2] Launching Python Flask Backend Server (SQLite DB)...
cd backend
start cmd /k "title StockWise Backend ^&^& echo Installing backend dependencies... ^&^& pip install -r requirements.txt ^&^& echo Booting Flask server with SQLite connection... ^&^& python app.py"
cd ..

echo [2/2] Launching React Frontend Server (Vite Development)...
cd frontend
start cmd /k "title StockWise Frontend ^&^& echo Booting React development server... ^&^& npm run dev"
cd ..

echo.
echo Both servers are booting up in separate command windows.
echo Preparing browser launch...
timeout /t 8 /nobreak
start http://localhost:5173

echo.
echo Application initialized! Keep the server windows open while browsing.
echo Press any key to close this launcher.
pause > nul
