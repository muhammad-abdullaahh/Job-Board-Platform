#!/usr/bin/env python3
"""
Job Board Platform — Master System Test Runner
Executes comprehensive unit, integration, and E2E tests across the entire platform.

Usage:
    python run_tests.py [options]

Options:
    --all          Run all tests across whole system (default)
    --unit         Run unit tests only (services, models, repositories, schemas, core)
    --integration  Run database and repository integration tests only
    --e2e          Run end-to-end API lifecycle flow tests only
    --backend      Run all backend tests
    --frontend     Run frontend production build verification
    --coverage     Generate test coverage report
    -v, --verbose  Verbose pytest output
    -k PATTERN     Only run tests matching PATTERN
    -h, --help     Show this help message
"""

import sys
import os
import time
import argparse
import subprocess
from pathlib import Path

# Safe encoding on Windows consoles
_reconfigure_stdout = getattr(sys.stdout, "reconfigure", None)
if callable(_reconfigure_stdout):
    try:
        _reconfigure_stdout(encoding="utf-8", errors="replace")
    except Exception:
        pass
_reconfigure_stderr = getattr(sys.stderr, "reconfigure", None)
if callable(_reconfigure_stderr):
    try:
        _reconfigure_stderr(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Enable ANSI colors on Windows terminal
if sys.platform == "win32":
    os.system("")

# Styling helpers
RESET = "\033[0m"
BOLD = "\033[1m"
GREEN = "\033[32m"
RED = "\033[31m"
YELLOW = "\033[33m"
CYAN = "\033[36m"
BLUE = "\033[34m"
MAGENTA = "\033[35m"
WHITE = "\033[37m"
BG_GREEN = "\033[42m\033[30m"
BG_RED = "\033[41m\033[37m"

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

def find_python_interpreter() -> str:
    """Detects active virtualenv or backend virtualenv Python interpreter."""
    candidates = [
        BACKEND_DIR / "venv" / "Scripts" / "python.exe",
        BACKEND_DIR / ".venv" / "Scripts" / "python.exe",
        ROOT_DIR / "venv" / "Scripts" / "python.exe",
        BACKEND_DIR / "venv" / "bin" / "python",
        BACKEND_DIR / ".venv" / "bin" / "python",
        ROOT_DIR / "venv" / "bin" / "python",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return str(candidate)
    return sys.executable

def print_banner():
    banner = f"""
{CYAN}{BOLD}================================================================================
                    JOB BOARD PLATFORM - SYSTEM TEST SUITE
================================================================================{RESET}
{WHITE}Platform Components: FastAPI Backend | PostgreSQL ORM | Security & Auth | React 18{RESET}
"""
    print(banner)

def run_step(step_name: str, cmd: list, cwd: Path) -> tuple[bool, float, str]:
    """Executes a command step, streaming output while tracking duration and outcome."""
    print(f"\n{BLUE}{BOLD}[>] Running: {step_name}{RESET}")
    print(f"{WHITE}Directory: {cwd}{RESET}")
    print(f"{WHITE}Command:   {' '.join(str(c) for c in cmd)}{RESET}")
    print(f"{CYAN}{'-' * 80}{RESET}")

    start_time = time.time()
    try:
        process = subprocess.run(cmd, cwd=str(cwd), check=False)
        duration = time.time() - start_time
        success = (process.returncode == 0)
        return success, duration, ""
    except Exception as e:
        duration = time.time() - start_time
        return False, duration, str(e)

def main():
    parser = argparse.ArgumentParser(description="Job Board Platform Test Runner", add_help=False)
    parser.add_argument("--all", action="store_true", help="Run all tests across whole system (default)")
    parser.add_argument("--unit", action="store_true", help="Run backend unit tests only")
    parser.add_argument("--integration", action="store_true", help="Run backend integration tests only")
    parser.add_argument("--e2e", action="store_true", help="Run backend E2E tests only")
    parser.add_argument("--backend", action="store_true", help="Run all backend tests")
    parser.add_argument("--frontend", action="store_true", help="Run frontend build check")
    parser.add_argument("--coverage", action="store_true", help="Run pytest with coverage report")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose pytest output")
    parser.add_argument("-k", type=str, default="", help="Run tests matching specific expression")
    parser.add_argument("-h", "--help", action="store_true", help="Show help")

    args = parser.parse_args()

    if args.help:
        print(__doc__)
        return 0

    print_banner()

    python_bin = find_python_interpreter()
    print(f"{WHITE}Active Python: {CYAN}{python_bin}{RESET}")

    # Determine which steps to run
    explicit_selection = any([args.unit, args.integration, args.e2e, args.backend, args.frontend])
    run_all = args.all or not explicit_selection

    results = []
    total_start = time.time()

    # 1. Backend Unit Tests
    if run_all or args.unit or args.backend:
        pytest_cmd = [python_bin, "-m", "pytest", "tests/unit"]
        if args.verbose:
            pytest_cmd.append("-v")
        if args.k:
            pytest_cmd.extend(["-k", args.k])
        if args.coverage:
            pytest_cmd.extend(["--cov=src/app", "--cov-report=term-missing"])

        success, duration, err = run_step("Backend Unit Tests (Services, Models, Repositories, Schemas, Core)", pytest_cmd, BACKEND_DIR)
        results.append(("Backend Unit Tests", success, duration, err))

    # 2. Backend Integration Tests
    if run_all or args.integration or args.backend:
        pytest_cmd = [python_bin, "-m", "pytest", "tests/integration"]
        if args.verbose:
            pytest_cmd.append("-v")
        if args.k:
            pytest_cmd.extend(["-k", args.k])

        success, duration, err = run_step("Backend Integration Tests (SQLAlchemy, Queries, Constraints)", pytest_cmd, BACKEND_DIR)
        results.append(("Backend Integration Tests", success, duration, err))

    # 3. Backend E2E Tests
    if run_all or args.e2e or args.backend:
        pytest_cmd = [python_bin, "-m", "pytest", "tests/e2e"]
        if args.verbose:
            pytest_cmd.append("-v")
        if args.k:
            pytest_cmd.extend(["-k", args.k])

        success, duration, err = run_step("Backend E2E Lifecycle Tests (Auth Cookies, Job Posting, Applications)", pytest_cmd, BACKEND_DIR)
        results.append(("Backend E2E Tests", success, duration, err))

    # 4. Frontend Build & Type Validation
    if run_all or args.frontend:
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        frontend_cmd = [npm_cmd, "run", "build"]
        if FRONTEND_DIR.is_dir() and (FRONTEND_DIR / "package.json").is_file():
            success, duration, err = run_step("Frontend Production Build Integrity (Vite + React 18)", frontend_cmd, FRONTEND_DIR)
            results.append(("Frontend Build Integrity", success, duration, err))

    total_duration = time.time() - total_start

    # Summary table
    print(f"\n{CYAN}{BOLD}================================================================================{RESET}")
    print(f"{BOLD}                        TEST EXECUTION SUMMARY REPORT{RESET}")
    print(f"{CYAN}{'=' * 80}{RESET}")
    print(f"{'Test Suite':<50} | {'Status':<10} | {'Duration':<10}")
    print(f"{'-' * 80}")

    all_passed = True
    for suite, success, duration, err in results:
        status_str = f"{GREEN}PASSED{RESET}" if success else f"{RED}FAILED{RESET}"
        if not success:
            all_passed = False
        print(f"{suite:<50} | {status_str:<19} | {duration:.2f}s")

    print(f"{'-' * 80}")
    print(f"{'Total Elapsed Time:':<50} | {total_duration:.2f}s")
    print(f"{CYAN}{'=' * 80}{RESET}")

    if all_passed:
        print(f"\n{BG_GREEN}  [PASS] ALL SUITES PASSED - SYSTEM FULLY TESTED AND VERIFIED OPERATIONAL!  {RESET}\n")
        return 0
    else:
        print(f"\n{BG_RED}  [FAIL] ONE OR MORE TEST SUITES FAILED - REVIEW TRACEBACK ABOVE  {RESET}\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
