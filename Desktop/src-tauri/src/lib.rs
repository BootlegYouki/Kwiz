use std::io::{Read, Write};
use std::net::TcpListener;
use std::thread;
use tauri::menu::{CheckMenuItem, Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager};
use tauri_plugin_autostart::ManagerExt;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

mod ollama_commands;


// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn start_oauth_server(window: tauri::Window) {
    thread::spawn(move || {
        let listener = match TcpListener::bind("127.0.0.1:14200") {
            Ok(l) => l,
            Err(e) => {
                println!("Failed to bind to port 14200: {}", e);
                return;
            }
        };

        for stream in listener.incoming() {
            match stream {
                Ok(mut stream) => {
                    let mut buffer = [0; 1024];
                    if let Ok(_) = stream.read(&mut buffer) {
                        let request = String::from_utf8_lossy(&buffer[..]);

                        // Parse the URL parameters to find code
                        // Format of request line: GET /oauth2redirect?code=xyz HTTP/1.1
                        let mut code = String::new();
                        if let Some(path_line) = request.lines().next() {
                            if let Some(params_start) = path_line.find("code=") {
                                let params = &path_line[params_start + 5..];
                                if let Some(end) = params.find(' ') {
                                    code = params[..end].to_string();
                                } else {
                                    code = params.to_string();
                                }

                                // Strip any other URL queries (e.g. &scope=...)
                                if let Some(amp) = code.find('&') {
                                    code = code[..amp].to_string();
                                }
                            }
                        }

                        // Respond with a success page matching the app's TUI style
                        let response = format!("HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nConnection: close\r\n\r\n{}", r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kwiz Authentication</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --color-primary: #ffffff;
            --color-background: #18181b;
            --color-card: #18181b;
            --color-border: #52525b;
            --color-foreground: #fafafa;
            --color-muted: #a1a1aa;
            --color-success: #22c55e;
        }

        body {
            background-color: var(--color-background);
            color: var(--color-foreground);
            font-family: 'JetBrains Mono', monospace;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            overflow: hidden;
        }

        .container {
            width: 440px;
            position: relative;
            border: 1.5px solid var(--color-primary);
            background-color: var(--color-card);
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-shadow: 6px 6px 0px rgba(255, 255, 255, 0.1);
        }

        .legend {
            position: absolute;
            top: -10px;
            left: 16px;
            padding: 0 8px;
            background-color: var(--color-card);
            font-weight: bold;
            font-size: 12px;
            color: var(--color-primary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="legend">[ Success ]</div>
        
        <div style="font-size: 13px; line-height: 1.6; text-align: center; padding: 20px 0; color: var(--color-foreground);">
            Google Drive connected successfully!<br>
            You can now close this tab and return to Kwiz.
        </div>
    </div>
</body>
</html>"#);

                        let _ = stream.write_all(response.as_bytes());
                        let _ = stream.flush();

                        if !code.is_empty() {
                            // Send code to frontend via Tauri event
                            let _ = window.emit("oauth-code", code);
                            break; // Stop listening after we capture the code!
                        }
                    }
                }
                Err(e) => {
                    println!("Error accepting connection: {}", e);
                }
            }
        }
    });
}

#[tauri::command]
async fn check_markitdown() -> bool {
    #[cfg(target_os = "windows")]
    {
        let mut cmd = std::process::Command::new("where.exe");
        cmd.arg("markitdown");
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("which")
            .arg("markitdown")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }
}

#[tauri::command]
async fn check_llama(port: u16) -> bool {
    let client = reqwest::Client::new();
    let health_url = format!("http://127.0.0.1:{}/health", port);
    let models_url = format!("http://127.0.0.1:{}/v1/models", port);
    let tags_url = format!("http://127.0.0.1:{}/api/tags", port);
    let root_url = format!("http://127.0.0.1:{}/", port);
    
    if let Ok(resp) = client.get(&health_url).send().await {
        if resp.status().is_success() {
            return true;
        }
    }
    
    if let Ok(resp) = client.get(&models_url).send().await {
        if resp.status().is_success() {
            return true;
        }
    }

    if let Ok(resp) = client.get(&tags_url).send().await {
        if resp.status().is_success() {
            return true;
        }
    }

    if let Ok(resp) = client.get(&root_url).send().await {
        if resp.status().is_success() {
            if let Ok(text) = resp.text().await {
                if text.contains("Ollama is running") {
                    return true;
                }
            }
        }
    }
    
    false
}

#[tauri::command]
async fn generate_quiz(
    file_path: Option<String>,
    prompt: Option<String>,
    question_type: String,
    count: u32,
    llama_port: u16,
) -> Result<String, String> {
    // 1. Get content from file using markitdown, or use prompt
    let markdown_content = if let Some(path) = file_path {
        let mut cmd = std::process::Command::new("markitdown");
        cmd.arg(&path);
        #[cfg(target_os = "windows")]
        {
            const CREATE_NO_WINDOW: u32 = 0x0800_0000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }
        let output = cmd.output()
            .map_err(|e| format!("Failed to run markitdown: {}. Make sure it is installed via 'pip install markitdown'.", e))?;
        
        if !output.status.success() {
            let err_msg = String::from_utf8_lossy(&output.stderr).to_string();
            return Err(format!("markitdown failed: {}", err_msg));
        }
        
        String::from_utf8_lossy(&output.stdout).to_string()
    } else if let Some(p) = prompt.clone() {
        p
    } else {
        return Err("Neither file_path nor prompt was provided.".to_string());
    };

    // 2. Build the system prompt instructions based on type
    let instructions = match question_type.as_str() {
        "multiple_choice" => format!("Generate exactly {} questions of type mc (multiple choice). Each must have 'k': 'mc', 'q': '<question text>', 'c': [<4 options as strings>], and 'a': '<correct option letter: A, B, C, or D>'.", count),
        "identification" => format!("Generate exactly {} questions of type id (identification). Each must have 'k': 'id', 'q': '<question text>', 'a': '<text answer>', and 'n': <integer character count of the answer>.", count),
        "hybrid" => format!("Generate exactly {} questions alternating between mc (multiple choice) and id (identification) types. MC questions must have 'k': 'mc', 'q': '<question text>', 'c': [<4 options as strings>], and 'a': '<correct option letter: A, B, C, or D>'. ID questions must have 'k': 'id', 'q': '<question text>', 'a': '<text answer>', and 'n': <integer character count of the answer>.", count),
        _ => format!("Generate exactly {} questions.", count),
    };

    let system_prompt = format!(
        "You are a quiz generator. Output ONLY compact JSON with no markdown fences, no formatting, no prefix, no suffix. \
        Format: {{\"t\":\"<quiz title>\",\"qs\":[{{\"k\":\"mc\",\"q\":\"...\",\"c\":[\"A\",\"B\",\"C\",\"D\"],\"a\":\"A\"}},{{\"k\":\"id\",\"q\":\"...\",\"a\":\"answer\",\"n\":6}}]}} \
        {} from the following content. \
        {}",
        instructions,
        prompt.map(|p| format!("Custom guidelines: {}", p)).unwrap_or_default()
    );

    // 3. Construct request to local LLM OpenAI-compatible API
    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:{}/v1/chat/completions", llama_port);

    let model_name = if llama_port == 11434 {
        "gpt-oss:20b-cloud"
    } else {
        "local-model"
    };

    let request_body = serde_json::json!({
        "model": model_name,
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": format!("Content:\n{}", markdown_content)
            }
        ],
        "temperature": 0.3,
        "response_format": { "type": "json_object" }
    });

    let resp = client.post(&url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Failed to connect to llama.cpp on port {}: {}", llama_port, e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("llama.cpp returned error status {}: {}", status, body));
    }

    let resp_json: serde_json::Value = resp.json().await
        .map_err(|e| format!("Failed to parse response JSON from llama.cpp: {}", e))?;

    // Extract content from response
    let content = resp_json["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| format!("Invalid response structure from llama.cpp: {:?}", resp_json))?;

    Ok(content.to_string())
}

#[tauri::command]
async fn read_kwiz_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
async fn write_kwiz_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| format!("Failed to write file: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .setup(|app| {
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                ollama_commands::ensure_ollama_ready_during_boot(
                    &app_handle,
                    std::time::Duration::from_secs(20),
                )
                .await;
            });

            let show_i = MenuItem::with_id(app, "show", "Open Kwiz", true, None::<&str>)?;
            let sync_i = MenuItem::with_id(app, "sync", "Sync Now", true, None::<&str>)?;
            let is_autostart_enabled = app.autolaunch().is_enabled().unwrap_or(false);
            let autostart_i = CheckMenuItem::with_id(
                app,
                "autostart",
                "Run when my computer starts",
                true,
                is_autostart_enabled,
                None::<&str>,
            )?;
            let quit_i = MenuItem::with_id(app, "quit", "Close Kwiz", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &sync_i, &autostart_i, &quit_i])?;

            let autostart_i_clone = autostart_i.clone();

            let mut tray_builder = TrayIconBuilder::new().menu(&menu);

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            } else {
                let icon_bytes = include_bytes!("../icons/32x32.png");
                if let Ok(icon) = tauri::image::Image::from_bytes(icon_bytes) {
                    tray_builder = tray_builder.icon(icon);
                }
            }

            let _tray = tray_builder
                .on_menu_event(
                    move |app: &tauri::AppHandle, event| match event.id.as_ref() {
                        "quit" => {
                            app.exit(0);
                        }
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "sync" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.emit("tray-sync", ());
                            }
                        }
                        "autostart" => {
                            let current_state =
                                app.autolaunch().is_enabled().unwrap_or_else(|_| {
                                    autostart_i_clone.is_checked().unwrap_or(false)
                                });
                            let new_state = !current_state;
                            let res = if new_state {
                                app.autolaunch().enable()
                            } else {
                                app.autolaunch().disable()
                            };
                            let _ = autostart_i_clone.set_checked(new_state);
                            if let Err(e) = res {
                                println!("Failed to set autostart to {}: {:?}", new_state, e);
                            }
                        }
                        _ => {}
                    },
                )
                .on_tray_icon_event(|tray: &tauri::tray::TrayIcon, event| {
                    if let TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            start_oauth_server,
            check_markitdown,
            check_llama,
            generate_quiz,
            read_kwiz_file,
            write_kwiz_file,
            ollama_commands::get_ollama_setup_status,
            ollama_commands::get_ollama_install_log,
            ollama_commands::launch_ollama_setup_step,
            ollama_commands::start_ollama_background,
            ollama_commands::uninstall_managed_ollama
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let tauri::RunEvent::Exit = event {
            ollama_commands::cleanup_managed_ollama_on_exit(app_handle);
        }
    });
}

