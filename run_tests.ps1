<#
.SYNOPSIS
    Job Board Platform - PowerShell Master Test Runner
.DESCRIPTION
    Runs backend unit tests, integration tests, e2e tests, and frontend build verification.
.EXAMPLE
    .\run_tests.ps1
    .\run_tests.ps1 --unit
    .\run_tests.ps1 --backend
#>

param(
    [switch]$All,
    [switch]$Unit,
    [switch]$Integration,
    [switch]$E2E,
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$Coverage,
    [switch]$Verbose,
    [string]$Pattern = ""
)

$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location -Path $PSScriptRoot

$argsList = @()
if ($All) { $argsList += "--all" }
if ($Unit) { $argsList += "--unit" }
if ($Integration) { $argsList += "--integration" }
if ($E2E) { $argsList += "--e2e" }
if ($Backend) { $argsList += "--backend" }
if ($Frontend) { $argsList += "--frontend" }
if ($Coverage) { $argsList += "--coverage" }
if ($Verbose) { $argsList += "-v" }
if ($Pattern) { $argsList += @("-k", $Pattern) }

python run_tests.py $argsList
exit $LASTEXITCODE
