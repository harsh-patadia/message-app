@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

REM ---- SET YOUR GITHUB REPO URL HERE ----
SET "REPO_URL=https://github.com/harsh-patadia/message-app.git"
SET "FOLDER_NAME=college_project"

REM Delete old folder if exists
IF EXIST "%FOLDER_NAME%" (
    echo Deleting old project folder...
    rmdir /s /q "%FOLDER_NAME%"
)

echo Cloning repo...
git clone %REPO_URL%

REM Install Python backend dependencies
cd %FOLDER_NAME%
echo Installing Python backend dependencies...
pip install -r requirements.txt

REM Install Node frontend dependencies
cd app
echo Installing React dependencies...
call npm install
cd ..

echo Setup complete.
pause
