fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .plugin("app", tauri_build::InlinedPlugin::new().commands(&[
                "greet",
                "start_oauth_server",
                "check_markitdown",
                "convert_to_markdown",
                "generate_quiz",
                "read_kwiz_file",
                "write_kwiz_file",
            ]))
    ).expect("failed to run tauri-build");
}
