@echo off
REM ==============================================================================
REM Job Board Platform - Windows Batch Test Runner
REM Double-click or run from command prompt / PowerShell to test the whole system.
REM ==============================================================================

setlocal
cd /d "%~dp0"

echo.
echo ==============================================================================
echo              Job Board Platform - Master System Test Suite
echo ==============================================================================
echo.

python run_tests.py %*
if errorlevel 1 (
    echo.
    echo [ERROR] Tests failed with exit code %errorlevel%.
    exit /b %errorlevel%
)

echo.
echo [SUCCESS] Whole system verified successfully.
exit /b 0
