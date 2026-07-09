# Agent Notes

## Windows / Git Bash traps

This repo is developed on Windows using Git Bash (`MINGW64`). The runner re-executes verify commands in a fresh shell with a sanitized PATH, which exposes assumptions that hold in an interactive developer shell but fail in CI-like conditions.

When writing or fixing smoke/CI scripts (`scripts/smoke-*.sh`, Docker entrypoints, etc.):

- Prefer `npm.cmd` over `npm` on Git Bash/MINGW. The Node.js Windows installer ships `/c/nodejs/npm` as a shell script that detects WSL/interop and can abort with:
  ```
  WSL 1 is not supported. Please upgrade to WSL 2 or above.
  Could not determine Node.js install directory
  ```
  `npm.cmd` is the Windows batch wrapper and does not have this detection.

- Do not assume Windows system tools are on PATH. `netstat`, `taskkill`, `cmd`, `powershell` may be missing when the runner sanitizes PATH to the minimum needed for Node/npm. Always guard with `command -v <tool>` and provide a safe fallback or skip.

- Test smoke scripts with a reduced PATH before declaring done:
  ```bash
  PATH="/mingw64/bin:/usr/bin:/c/nodejs" bash scripts/smoke-dev.sh
  ```
  This catches hidden dependencies on system utilities.

- Process cleanup in Git Bash is unreliable. Use `trap cleanup EXIT`, kill the main PID, and also kill listeners on the expected port as a fallback — but only if the necessary tools are present.

- Docker Desktop on Windows can retain port 3000 if Node processes are orphaned. Clean up before `docker run -p 3000:3000`.
