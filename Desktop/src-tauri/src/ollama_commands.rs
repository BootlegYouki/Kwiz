use serde::Serialize;
use std::fs;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::Manager;

#[derive(Serialize)]
pub struct OllamaSetupStatus {
    installed: bool,
    version: Option<String>,
    model_count: usize,
    has_default_model: bool,
    winget_available: bool,
    install_in_progress: bool,
    managed_install: bool,
    signed_in: bool,
}

const OLLAMA_WINDOWS_STANDALONE_ZIP_URL: &str =
    "https://github.com/ollama/ollama/releases/latest/download/ollama-windows-amd64.zip";

fn run_cmd_capture(program: &str, args: &[&str]) -> Result<(bool, String), String> {
    let mut command = Command::new(program);
    command.args(args);
    #[cfg(target_os = "windows")]
    {
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    let output = command.output().map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let combined = match (stdout.is_empty(), stderr.is_empty()) {
        (false, false) => format!("{stdout}\n{stderr}"),
        (false, true) => stdout,
        (true, false) => stderr,
        (true, true) => String::new(),
    };

    Ok((output.status.success(), combined))
}

#[cfg(target_os = "windows")]
fn collect_managed_ollama_related_pids(app: &tauri::AppHandle) -> Result<Vec<u32>, String> {
    let install_dir = get_managed_ollama_dir(app)?
        .to_string_lossy()
        .replace('\'', "''");
    let script_path = get_managed_ollama_install_script(app)?
        .to_string_lossy()
        .replace('\'', "''");

    let query = format!(
        r#"$installDir = '{install_dir}'
$scriptPath = '{script_path}'
$pids = [System.Collections.Generic.HashSet[uint32]]::new()

Get-CimInstance Win32_Process -Filter "Name = 'ollama.exe'" -ErrorAction SilentlyContinue |
  Where-Object {{
    $_.ExecutablePath -and $_.ExecutablePath.StartsWith($installDir, [System.StringComparison]::OrdinalIgnoreCase)
  }} |
  ForEach-Object {{
    [void]$pids.Add([uint32]$_.ProcessId)
  }}

Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" -ErrorAction SilentlyContinue |
  Where-Object {{
    $_.CommandLine -and $_.CommandLine.IndexOf($scriptPath, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
  }} |
  ForEach-Object {{
    [void]$pids.Add([uint32]$_.ProcessId)
  }}

$pids | Sort-Object | ForEach-Object {{ $_ }}"#,
        install_dir = install_dir,
        script_path = script_path,
    );

    let (ok, output) = run_cmd_capture(
        "powershell",
        &[
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            &query,
        ],
    )?;

    if !ok {
        return Err(if output.is_empty() {
            "Failed to inspect managed Ollama processes.".to_string()
        } else {
            output
        });
    }

    Ok(output
        .lines()
        .filter_map(|line| line.trim().parse::<u32>().ok())
        .collect())
}

#[cfg(target_os = "windows")]
fn stop_managed_ollama_related_processes(app: &tauri::AppHandle) -> Result<(), String> {
    let pids = collect_managed_ollama_related_pids(app)?;

    for pid in pids {
        let pid_text = pid.to_string();
        let _ = run_cmd_capture("taskkill", &["/PID", &pid_text, "/T", "/F"]);
    }

    Ok(())
}

pub fn cleanup_managed_ollama_on_exit(app: &tauri::AppHandle) {
    #[cfg(target_os = "windows")]
    {
        if let Err(err) = stop_managed_ollama_related_processes(app) {
            eprintln!("Failed to stop managed Ollama on exit: {}", err);
        }
    }
}

#[cfg(target_os = "windows")]
fn stop_all_ollama_processes() {
    let _ = run_cmd_capture("taskkill", &["/F", "/IM", "ollama.exe", "/T"]);
}

#[cfg(target_os = "windows")]
fn get_managed_ollama_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("tools")
        .join("ollama-cli");
    Ok(dir)
}

#[cfg(target_os = "windows")]
fn get_managed_ollama_exe(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let direct = get_managed_ollama_dir(app)?.join("ollama.exe");
    if direct.exists() {
        return Ok(direct);
    }

    let root = get_managed_ollama_dir(app)?;
    if root.exists() {
        let mut stack = vec![root];
        while let Some(dir) = stack.pop() {
            if let Ok(entries) = fs::read_dir(&dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_dir() {
                        stack.push(path);
                    } else if path
                        .file_name()
                        .and_then(|name| name.to_str())
                        .map(|name| name.eq_ignore_ascii_case("ollama.exe"))
                        .unwrap_or(false)
                    {
                        return Ok(path);
                    }
                }
            }
        }
    }

    Ok(direct)
}

#[cfg(target_os = "windows")]
fn get_managed_ollama_install_lock(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(get_managed_ollama_dir(app)?.join("installing.lock"))
}

#[cfg(target_os = "windows")]
fn get_managed_ollama_install_log(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(get_managed_ollama_dir(app)?.join("install.log"))
}

#[cfg(target_os = "windows")]
fn get_managed_ollama_install_pid_file(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(get_managed_ollama_dir(app)?.join("install.pid"))
}

#[cfg(target_os = "windows")]
fn append_ollama_install_log(log_path: &PathBuf, message: &str) {
    let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
    let _ = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path)
        .and_then(|mut file| {
            use std::io::Write;
            writeln!(file, "[{}] {}", timestamp, message)
        });
}

#[cfg(target_os = "windows")]
fn get_managed_ollama_install_script(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(get_managed_ollama_dir(app)?.join("install-ollama-cli.ps1"))
}

#[cfg(target_os = "windows")]
fn is_pid_running(pid: u32) -> bool {
    let query = format!(
        "$p = Get-Process -Id {} -ErrorAction SilentlyContinue; if ($p) {{ 'true' }} else {{ 'false' }}",
        pid
    );

    run_cmd_capture(
        "powershell",
        &[
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            &query,
        ],
    )
    .map(|(ok, output)| ok && output.trim().eq_ignore_ascii_case("true"))
    .unwrap_or(false)
}

#[cfg(target_os = "windows")]
fn get_user_ollama_dir() -> Result<PathBuf, String> {
    std::env::var_os("USERPROFILE")
        .map(PathBuf::from)
        .map(|dir| dir.join(".ollama"))
        .ok_or_else(|| "Unable to resolve the current user's Ollama directory.".to_string())
}

#[cfg(target_os = "windows")]
fn has_managed_ollama_install(app: &tauri::AppHandle) -> bool {
    get_managed_ollama_exe(app)
        .map(|exe| exe.exists())
        .unwrap_or(false)
}

#[cfg(target_os = "windows")]
fn run_ollama_capture(app: &tauri::AppHandle, args: &[&str]) -> Result<(bool, String), String> {
    if let Ok((true, output)) = run_cmd_capture("ollama", args) {
        return Ok((true, output));
    }

    let exe = get_managed_ollama_exe(app)?;
    if exe.exists() {
        return run_cmd_capture(&exe.to_string_lossy(), args);
    }

    Err("Ollama is not installed".to_string())
}

#[cfg(target_os = "windows")]
fn spawn_detached_ollama_serve(app: &tauri::AppHandle) -> Result<(), String> {
    const DETACHED_PROCESS: u32 = 0x0000_0008;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;

    stop_all_ollama_processes();

    if run_cmd_capture("ollama", &["--version"]).map(|(ok, _)| ok).unwrap_or(false) {
        let mut cmd = Command::new("ollama");
        cmd.arg("serve")
            .env("OLLAMA_ORIGINS", "*")
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .creation_flags(DETACHED_PROCESS | CREATE_NO_WINDOW);
        cmd.spawn().map_err(|e| e.to_string())?;
        return Ok(());
    }

    let exe = get_managed_ollama_exe(app)?;
    if !exe.exists() {
        return Err("Ollama is not installed yet.".to_string());
    }

    let working_dir = exe
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| get_managed_ollama_dir(app).unwrap_or_default());

    let mut cmd = Command::new(&exe);
    cmd.arg("serve")
        .current_dir(working_dir)
        .env("OLLAMA_ORIGINS", "*")
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .creation_flags(DETACHED_PROCESS | CREATE_NO_WINDOW);
    cmd.spawn().map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(target_os = "windows")]
async fn is_ollama_http_ready() -> bool {
    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_millis(1500))
        .build()
    {
        Ok(client) => client,
        Err(_) => return false,
    };

    client
        .get("http://127.0.0.1:11434/api/tags")
        .send()
        .await
        .map(|response| response.status().is_success())
        .unwrap_or(false)
}

#[cfg(target_os = "windows")]
async fn wait_for_ollama_http_ready(max_wait: std::time::Duration) -> bool {
    let start = std::time::Instant::now();

    loop {
        if is_ollama_http_ready().await {
            return true;
        }

        if start.elapsed() >= max_wait {
            return false;
        }

        tokio::time::sleep(std::time::Duration::from_millis(750)).await;
    }
}

pub(crate) async fn ensure_ollama_ready_during_boot(
    app: &tauri::AppHandle,
    max_wait: std::time::Duration,
) {
    #[cfg(target_os = "windows")]
    {
        let app_handle = app.clone();
        let installed = tauri::async_runtime::spawn_blocking(move || {
            run_ollama_capture(&app_handle, &["--version"])
                .map(|(ok, _)| ok)
                .unwrap_or(false)
        })
        .await
        .unwrap_or(false);

        if !installed {
            println!("Ollama is not installed; skipping startup gate.");
            return;
        }

        // Only start if they are signed in (meaning SSH key exists)
        let signed_in = tauri::async_runtime::spawn_blocking(|| {
            if let Ok(dir) = get_user_ollama_dir() {
                dir.join("id_ed25519").exists()
            } else {
                false
            }
        })
        .await
        .unwrap_or(false);

        if !signed_in {
            println!("Ollama is installed but not signed in; skipping startup serve.");
            return;
        }

        if is_ollama_http_ready().await {
            println!("Ollama was already ready during boot.");
            return;
        }

        let app_handle = app.clone();
        match tauri::async_runtime::spawn_blocking(move || spawn_detached_ollama_serve(&app_handle))
            .await
        {
            Ok(Ok(())) => {
                println!("Started Ollama in the background during splash.");
            }
            Ok(Err(err)) => {
                println!("Failed to start Ollama during splash: {}", err);
                return;
            }
            Err(err) => {
                println!("Failed to join Ollama startup task during splash: {}", err);
                return;
            }
        }

        if wait_for_ollama_http_ready(max_wait).await {
            println!("Ollama became ready during splash.");
        } else {
            println!(
                "Ollama did not become ready within {:?}; continuing boot.",
                max_wait
            );
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = (app, max_wait);
    }
}

#[cfg(target_os = "windows")]
fn is_managed_ollama_installer_active(app: &tauri::AppHandle) -> bool {
    if let Ok(pid_file) = get_managed_ollama_install_pid_file(app) {
        if let Ok(pid_text) = fs::read_to_string(&pid_file) {
            if let Ok(pid) = pid_text.trim().parse::<u32>() {
                if is_pid_running(pid) {
                    return true;
                }
            }
        }
    }

    let install_dir = match get_managed_ollama_dir(app) {
        Ok(path) => path.to_string_lossy().replace('\'', "''"),
        Err(_) => return false,
    };
    let script_path = match get_managed_ollama_install_script(app) {
        Ok(path) => path.to_string_lossy().replace('\'', "''"),
        Err(_) => return false,
    };
    let script = r#"
$installDir = '{install_dir}'
$scriptPath = '{script_path}'
$matches = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {{
    ($_.Name -match '^(powershell|pwsh)\.exe$' -and $_.CommandLine -like ('*' + $scriptPath + '*')) -or
    ($_.ExecutablePath -and $_.ExecutablePath -like ($installDir + '*'))
}}
if ($matches) {{ 'true' }} else {{ 'false' }}
"#;

    run_cmd_capture(
        "powershell",
        &[
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            &script
                .replace("{install_dir}", &install_dir)
                .replace("{script_path}", &script_path),
        ],
    )
    .map(|(ok, output)| ok && output.trim().eq_ignore_ascii_case("true"))
    .unwrap_or(false)
}

#[cfg(target_os = "windows")]
fn has_ollama_install_lock(app: &tauri::AppHandle) -> bool {
    get_managed_ollama_install_lock(app)
        .map(|lock_path| lock_path.exists())
        .unwrap_or(false)
}

#[cfg(target_os = "windows")]
fn clear_stale_ollama_install_lock(app: &tauri::AppHandle) -> Result<bool, String> {
    let lock_path = get_managed_ollama_install_lock(app)?;
    if !lock_path.exists() {
        return Ok(false);
    }

    if let Ok(metadata) = fs::metadata(&lock_path) {
        if let Ok(modified) = metadata.modified() {
            if let Ok(elapsed) = modified.elapsed() {
                if elapsed < std::time::Duration::from_secs(30) {
                    return Ok(false);
                }
            }
        }
    }

    if is_managed_ollama_installer_active(app) {
        return Ok(false);
    }

    fs::remove_file(&lock_path).map_err(|e| e.to_string())?;
    if let Ok(pid_file) = get_managed_ollama_install_pid_file(app) {
        let _ = fs::remove_file(pid_file);
    }

    if let Ok(log_path) = get_managed_ollama_install_log(app) {
        append_ollama_install_log(
            &log_path,
            "Install did not finish. Cleared a stale installer lock so setup can be retried.",
        );
    }

    Ok(true)
}

#[cfg(target_os = "windows")]
fn is_ollama_install_in_progress(app: &tauri::AppHandle) -> bool {
    let _ = clear_stale_ollama_install_lock(app);
    has_ollama_install_lock(app)
}

#[cfg(target_os = "windows")]
fn write_ollama_install_script(
    install_dir: &Path,
    zip_path: &Path,
    lock_path: &Path,
    pid_path: &Path,
    log_path: &Path,
    script_path: &Path,
) -> Result<(), String> {
    let script = format!(
        r#"$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$installDir = '{install_dir}'
$zipPath = '{zip_path}'
$lockPath = '{lock_path}'
$pidPath = '{pid_path}'
$logPath = '{log_path}'

function Write-Log([string]$message) {{
  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  Add-Content -LiteralPath $logPath -Value "[$timestamp] $message"
}}

trap {{
  Write-Log ('Install failed: ' + $_.Exception.Message)
  if ($_.ScriptStackTrace) {{
    Write-Log ('Stack: ' + $_.ScriptStackTrace)
  }}
  exit 1
}}

try {{
  New-Item -ItemType Directory -Force -Path $installDir | Out-Null
  Write-Log 'Starting lightweight Ollama install'
  if (Test-Path -LiteralPath $zipPath) {{
    Write-Log 'Removing previous partial download'
    Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue
  }}
    Write-Log 'Downloading standalone zip'
    try {{
        Invoke-WebRequest -Uri '{zip_url}' -OutFile $zipPath -UseBasicParsing
    }} catch {{
        Write-Log ('Invoke-WebRequest failed, retrying with curl.exe: ' + $_.Exception.Message)
        & curl.exe -L -f --retry 3 --retry-delay 2 -o $zipPath '{zip_url}'
        if ($LASTEXITCODE -ne 0) {{
            throw ('curl.exe download failed with exit code ' + $LASTEXITCODE)
        }}
    }}

  Write-Log 'Extracting zip'
  Expand-Archive -LiteralPath $zipPath -DestinationPath $installDir -Force
  Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue

  $exe = Get-ChildItem -Path $installDir -Filter 'ollama.exe' -Recurse -File -ErrorAction Stop |
    Select-Object -First 1 -ExpandProperty FullName

  if (-not $exe) {{
    throw 'ollama.exe was not found after extraction'
  }}

  Write-Log "Starting ollama serve from $exe"
  $env:OLLAMA_ORIGINS = "*"
  Get-Process ollama -ErrorAction SilentlyContinue | Stop-Process -Force
  $proc = Start-Process -FilePath $exe -ArgumentList 'serve' -WindowStyle Hidden -PassThru
  Write-Log ('Started ollama serve (PID ' + $proc.Id + ')')

  Write-Log 'Checking for pip to install markitdown dependencies'
  if (Get-Command pip -ErrorAction SilentlyContinue) {{
    try {{
      Write-Log 'Running pip install markitdown[pdf,pptx]'
      & pip install --upgrade "markitdown[pdf,pptx]"
      Write-Log 'Successfully installed/updated markitdown with pdf and pptx support'
    }} catch {{
      Write-Log ('Failed to install markitdown dependencies via pip: ' + $_.Exception.Message)
    }}
  }} else {{
    Write-Log 'pip is not available in PATH; skipping markitdown automatic setup.'
  }}
}} catch {{
  Write-Log ('Install failed: ' + $_.Exception.Message)
  throw
}} finally {{
  Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $pidPath -Force -ErrorAction SilentlyContinue
}}"#,
        install_dir = install_dir.to_string_lossy().replace('\'', "''"),
        zip_path = zip_path.to_string_lossy().replace('\'', "''"),
        lock_path = lock_path.to_string_lossy().replace('\'', "''"),
        pid_path = pid_path.to_string_lossy().replace('\'', "''"),
        log_path = log_path.to_string_lossy().replace('\'', "''"),
        zip_url = OLLAMA_WINDOWS_STANDALONE_ZIP_URL,
    );

    fs::write(script_path, script).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_ollama_setup_status(app: tauri::AppHandle) -> Result<OllamaSetupStatus, String> {
    tauri::async_runtime::spawn_blocking(move || {
        #[cfg(target_os = "windows")]
        {
            let winget_available = run_cmd_capture("where", &["winget"])
                .map(|(ok, _)| ok)
                .unwrap_or(false);
            let install_in_progress = is_ollama_install_in_progress(&app);

            let (installed, version_output) = match run_ollama_capture(&app, &["--version"]) {
                Ok((true, output)) => (true, Some(output)),
                Ok((false, _)) | Err(_) => (false, None),
            };

            let signed_in = get_user_ollama_dir()
                .map(|dir| dir.join("id_ed25519").exists())
                .unwrap_or(false);

            if !installed {
                return Ok(OllamaSetupStatus {
                    installed: false,
                    version: None,
                    model_count: 0,
                    has_default_model: false,
                    winget_available,
                    install_in_progress,
                    managed_install: has_managed_ollama_install(&app),
                    signed_in,
                });
            }

            let (list_ok, list_output) =
                run_ollama_capture(&app, &["list"]).unwrap_or((false, String::new()));
            let model_lines = if list_ok {
                list_output
                    .lines()
                    .skip(1)
                    .filter(|line| !line.trim().is_empty())
                    .collect::<Vec<_>>()
            } else {
                Vec::new()
            };

            let has_default_model = model_lines.iter().any(|line| {
                let lowered = line.to_ascii_lowercase();
                lowered.contains(":cloud") || lowered.contains("gpt-oss")
            });

            Ok(OllamaSetupStatus {
                installed: true,
                version: version_output,
                model_count: model_lines.len(),
                has_default_model,
                winget_available,
                install_in_progress,
                managed_install: has_managed_ollama_install(&app),
                signed_in,
            })
        }

        #[cfg(not(target_os = "windows"))]
        {
            Err("Ollama guided setup is currently supported on Windows only.".to_string())
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn launch_ollama_setup_step(
    app: tauri::AppHandle,
    action: String,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        #[cfg(target_os = "windows")]
        {
            let normalized = action.trim().to_ascii_lowercase();

            match normalized.as_str() {
                "install" => {
                    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
                    let install_dir = get_managed_ollama_dir(&app)?;
                    fs::create_dir_all(&install_dir).map_err(|e| e.to_string())?;

                    let zip_path = install_dir.join("ollama-windows-amd64.zip");
                    let lock_path = get_managed_ollama_install_lock(&app)?;
                    let pid_path = get_managed_ollama_install_pid_file(&app)?;
                    let log_path = get_managed_ollama_install_log(&app)?;
                    let script_path = get_managed_ollama_install_script(&app)?;

                    let _ = clear_stale_ollama_install_lock(&app);
                    if has_ollama_install_lock(&app) && is_managed_ollama_installer_active(&app) {
                        append_ollama_install_log(&log_path, "Install request ignored because another installer is already running.");
                        return Ok("Ollama setup is already running in the background.".to_string());
                    }

                    let _ = fs::remove_file(&log_path);
                    let _ = fs::remove_file(&zip_path);
                    let _ = fs::remove_file(&pid_path);
                    fs::write(&lock_path, b"installing").map_err(|e| e.to_string())?;
                    write_ollama_install_script(
                        &install_dir,
                        &zip_path,
                        &lock_path,
                        &pid_path,
                        &log_path,
                        &script_path,
                    )?;
                    append_ollama_install_log(&log_path, "Launching hidden PowerShell installer.");

                    let stdout_log = fs::OpenOptions::new()
                        .create(true)
                        .append(true)
                        .open(&log_path)
                        .map_err(|e| e.to_string())?;
                    let stderr_log = stdout_log.try_clone().map_err(|e| e.to_string())?;

                    let mut ps = Command::new("powershell");
                    ps.args([
                        "-NoProfile",
                        "-NonInteractive",
                        "-ExecutionPolicy",
                        "Bypass",
                        "-WindowStyle",
                        "Hidden",
                        "-File",
                        &script_path.to_string_lossy(),
                    ])
                    .stdin(std::process::Stdio::null())
                    .stdout(stdout_log)
                    .stderr(stderr_log)
                    .creation_flags(CREATE_NO_WINDOW);

                    let child = match ps.spawn() {
                        Ok(child) => child,
                        Err(err) => {
                            let _ = fs::remove_file(&lock_path);
                            let _ = fs::remove_file(&pid_path);
                            append_ollama_install_log(&log_path, &format!("Failed to start installer: {err}"));
                            return Err(err.to_string());
                        }
                    };

                    if let Err(err) = fs::write(&pid_path, child.id().to_string()) {
                        append_ollama_install_log(
                            &log_path,
                            &format!("Warning: failed to persist installer PID: {err}"),
                        );
                    }

                    Ok("Started lightweight Ollama setup in the background.".to_string())
                }
                "signin" => {
                    let exe_path = match run_cmd_capture("ollama", &["--version"]) {
                        Ok((true, _)) => "ollama".to_string(),
                        _ => {
                            let exe = get_managed_ollama_exe(&app)?;
                            if exe.exists() {
                                exe.to_string_lossy().to_string()
                            } else {
                                return Err("Ollama is not installed yet.".to_string());
                            }
                        }
                    };

                    // Spawning via powershell Start-Process is 100% reliable for launching the browser and key generation on Windows
                    let command_string = format!("Start-Process -FilePath '{}' -ArgumentList 'signin' -WindowStyle Normal", exe_path);
                    
                    let mut cmd = Command::new("powershell");
                    cmd.args(["-NoProfile", "-NonInteractive", "-Command", &command_string]);
                    #[cfg(target_os = "windows")]
                    {
                        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
                        cmd.creation_flags(CREATE_NO_WINDOW);
                    }
                    cmd.spawn().map_err(|e| e.to_string())?;
                    Ok("Ollama sign-in window launched.".to_string())
                }
                _ => Err("Unsupported Ollama setup action.".to_string()),
            }
        }

        #[cfg(not(target_os = "windows"))]
        {
            Err("Ollama guided setup is currently supported on Windows only.".to_string())
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_ollama_install_log(app: tauri::AppHandle) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        #[cfg(target_os = "windows")]
        {
            let log_path = get_managed_ollama_install_log(&app)?;
            if !log_path.exists() {
                return Ok(None);
            }

            let content = fs::read_to_string(&log_path).map_err(|e| e.to_string())?;
            if content.trim().is_empty() {
                Ok(None)
            } else {
                Ok(Some(content))
            }
        }

        #[cfg(not(target_os = "windows"))]
        {
            Err("Ollama guided setup is currently supported on Windows only.".to_string())
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn start_ollama_background(app: tauri::AppHandle) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        #[cfg(target_os = "windows")]
        {
            spawn_detached_ollama_serve(&app)?;
            Ok("Started Ollama service in the background.".to_string())
        }

        #[cfg(not(target_os = "windows"))]
        {
            Err("Background Ollama startup is currently supported on Windows only.".to_string())
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn uninstall_managed_ollama(app: tauri::AppHandle) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        #[cfg(target_os = "windows")]
        {
            if has_ollama_install_lock(&app) {
                return Err("Ollama install is still running. Wait for it to finish before uninstalling.".to_string());
            }

            let install_dir = get_managed_ollama_dir(&app)?;
            let user_ollama_dir = get_user_ollama_dir()?;
            if !install_dir.exists() {
                return Ok("Managed Ollama is not installed.".to_string());
            }

            let install_dir_pattern = format!("{}*", install_dir.to_string_lossy().replace('\'', "''"));
            let stop_script = format!(
                r#"$target = '{install_dir_pattern}'
$matches = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {{
  $_.ExecutablePath -and $_.ExecutablePath -like $target
}}
foreach ($process in $matches) {{
  Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
}}"#
            );

            let _ = run_cmd_capture(
                "powershell",
                &["-NoProfile", "-NonInteractive", "-Command", &stop_script],
            );

            let auth_paths = [
                user_ollama_dir.join("id_ed25519"),
                user_ollama_dir.join("id_ed25519.pub"),
            ];

            for auth_path in auth_paths {
                if auth_path.exists() {
                    fs::remove_file(&auth_path).map_err(|e| {
                        format!(
                            "Managed Ollama was stopped, but failed to clear Ollama sign-in data at {}: {}",
                            auth_path.display(),
                            e
                        )
                    })?;
                }
            }

            let mut last_error: Option<String> = None;
            for _attempt in 0..5 {
                match fs::remove_dir_all(&install_dir) {
                    Ok(()) => {
                        return Ok("Managed Ollama and local Ollama sign-in data were removed from this app.".to_string());
                    }
                    Err(error) => {
                        last_error = Some(error.to_string());
                        std::thread::sleep(std::time::Duration::from_millis(350));
                    }
                }
            }

            Err(last_error.unwrap_or_else(|| "Failed to remove managed Ollama files.".to_string()))
        }

        #[cfg(not(target_os = "windows"))]
        {
            Err("Managed Ollama uninstall is currently supported on Windows only.".to_string())
        }
    })
    .await
    .map_err(|e| e.to_string())?
}
