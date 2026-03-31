# Local testing of GitHub Actions (Docker workflow)

The Docker build/publish workflow can be executed locally using [`act`](https://github.com/nektos/act).

> `act` works on Windows as well as on macOS, as long as Docker is available (typically via Docker Desktop). `act` runs GitHub Actions jobs inside containers, so Docker is mandatory.

## Prerequisites

- A working Docker Engine:
  - **macOS / Windows**: Docker Desktop
  - **Linux**: Docker Engine / Docker CE
- `act` installed
  - macOS: `brew install act`
  - Linux: see act releases / your package manager
  - Windows: `choco install act-cli` or `scoop install act` (package name may differ, but the command is `act`)

## Run the workflow locally (manual mode, no push)

This runs the workflow via `workflow_dispatch` and builds both images locally without pushing them to GHCR.

### macOS / Linux (bash/zsh)

```sh
act workflow_dispatch -W .github/workflows/docker-release.yml \
  --container-architecture linux/amd64 \
  --input version=0.0.0-dev \
  --input push=false
```

### Windows (PowerShell)

```powershell
act workflow_dispatch -W .github/workflows/docker-release.yml `
  --container-architecture linux/amd64 `
  --input version=0.0.0-dev `
  --input push=false
```

## Notes

- On **Apple Silicon (M1/M2/…)**, `--container-architecture linux/amd64` is recommended to avoid image/platform issues.
- With `push=false`, Buildx may print a warning that the result remains only in BuildKit cache (this is expected).

## Optional: test with `push=true` (publishing to GHCR)

Local “push” testing is possible, but it **will publish** images to GHCR (there is no real "push but don't publish" mode).

If you want to test the workflow logic without publishing anything, keep `push=false`.

### Requirements

- The target GHCR repository/package must allow pushes with your credentials.
- Create a **GitHub Personal Access Token (PAT)** with at least:
  - `write:packages` (and optionally `read:packages`)
  - If the repo is private and you run into auth issues, also add `repo`

### Run with push enabled

Create a local `.secrets` file (do **not** commit it):

```text
GITHUB_TOKEN=YOUR_PAT_HERE
```

Then run:

```sh
act workflow_dispatch -W .github/workflows/docker-release.yml \
  --container-architecture linux/amd64 \
  --input version=0.0.0-dev-localpush \
  --input push=true \
  --secret-file .secrets
```

Tip: Use a clearly distinguishable tag (e.g. `*-localpush`) so you can delete it easily afterwards.

### Cleanup after a local push test

If you pushed a test tag (e.g. `0.0.0-dev-localpush`), you can remove it afterwards:

1. Go to your GitHub repo/org → **Packages**
2. Open the package (e.g. `...-backend` or `...-frontend`)
3. Select the version/tag you pushed (e.g. `0.0.0-dev-localpush`)
4. Delete that version

This keeps the registry clean while still letting you test the full "push" path.

## Typical issues / fixes

### Docker daemon not reachable

Make sure Docker Desktop (or Docker Engine) is running.

### Permission denied in act cache

This usually happens when `act` (or a previous clone/download step) was executed with different privileges and the cache directory is owned by another user (e.g. `root`).

**Unix (Linux/macOS)**: change ownership and permissions of the cache directory:

```sh
sudo chown -R "$(id -un)":"$(id -gn)" ~/.cache/act
chmod -R u+rwX ~/.cache/act
```

**Windows (PowerShell)**: delete the cache folder (it will be recreated automatically):

```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.cache\act"
```

**Alternative (all platforms)**: delete the cache folder:

```sh
rm -rf ~/.cache/act
```

