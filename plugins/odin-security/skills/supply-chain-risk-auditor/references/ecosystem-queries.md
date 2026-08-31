# Ecosystem advisory queries

Per-ecosystem advisory sources and query methods. Load the section for the detected ecosystem before step 4 of the procedure.

## npm

Run `npm audit --json` against the lockfile, or query the GitHub Advisory Database API for the package name. Record advisory ID, severity, affected version ranges, and fixed version for each match.

## PyPI

Query the OSV API (`https://api.osv.dev/v1/query`) with the package name and resolved version. Record advisory ID, severity, affected version ranges, and fixed version for each match.

## Go

Query the Go vulnerability database (`https://vuln.go.dev`) for each module path and resolved version. Record advisory ID, severity, affected version ranges, and fixed version for each match.
