#[test]
fn macos_bundle_signing_uses_hardened_runtime_for_developer_id() {
    let script = std::fs::read_to_string(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../scripts/bundle-macos.sh"
    ))
    .expect("bundle-macos script is readable");

    assert!(
        script.contains("--timestamp --options runtime"),
        "Developer ID macOS signing should enable hardened runtime and secure timestamp"
    );
    assert!(
        script.contains("sign_macos_code \"$APP/Contents/MacOS/openpencil-desktop\""),
        "bundle script should explicitly sign the main app executable before signing the bundle"
    );
    assert!(
        script.contains("sign_macos_code \"$APP/Contents/MacOS/op\""),
        "bundle script should sign the embedded op CLI before signing the bundle"
    );

    let sign_cli = script
        .find("sign_macos_code \"$APP/Contents/MacOS/op\"")
        .expect("bundle script signs embedded op CLI");
    let sign_main = script
        .find("sign_macos_code \"$APP/Contents/MacOS/openpencil-desktop\"")
        .expect("bundle script signs the main app executable");
    assert!(
        sign_cli < sign_main,
        "bundle script should sign embedded CLI executables before the main app executable"
    );
}

#[test]
fn windows_nsis_installer_services_vc_runtime_fail_closed() {
    let installer = std::fs::read_to_string(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../scripts/package-windows.nsi"
    ))
    .expect("Windows NSIS installer is readable");
    assert!(
        installer.contains("!ifndef VC_REDIST_FILE")
            && installer.contains(r#"File "/oname=${VC_REDIST_EXE}" "${VC_REDIST_FILE}""#)
            && !installer.contains(r#"File /nonfatal "/oname=${VC_REDIST_EXE}""#),
        "the VC++ Redistributable must be a required, embedded NSIS input"
    );
    assert!(
        installer.contains(
            "!getdllversion /packed /productversion \"${VC_REDIST_FILE}\" VC_REDIST_VERSION_",
        ) && !installer.contains("!getdllversion /noerrors")
            && installer.contains("StrCpy $VCRuntimeRequiredHigh \"${VC_REDIST_VERSION_HIGH}\"")
            && installer.contains("StrCpy $VCRuntimeRequiredLow \"${VC_REDIST_VERSION_LOW}\"")
            && installer.contains("SetRegView 64")
            && installer.contains(r#"SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\${ARCH}"#)
            && installer.contains("Installed"),
        "NSIS must compare the embedded Runtime version with the installed machine Runtime"
    );
    assert!(
        installer.contains("ExecWait")
            && installer.contains("/install /passive /norestart")
            && installer.contains("OpenPencil-vc-redist-${ARCH}.log"),
        "NSIS must invoke the Microsoft Runtime installer non-interactively and retain its log"
    );
    assert!(
        installer.contains("SetRebootFlag true")
            && installer.contains("Function .onInstSuccess")
            && installer.contains("SetErrorLevel 3010"),
        "NSIS must preserve reboot-required state and re-check already-installed status"
    );
    assert!(
        installer.contains("MB_ICONSTOP")
            && installer
                .matches("Abort \"Microsoft Visual C++ Redistributable")
                .count()
                == 3,
        "a failed Runtime install or post-install version check must abort OpenPencil installation"
    );
}

#[test]
fn windows_cli_installer_services_vc_runtime_fail_closed() {
    let installer = std::fs::read_to_string(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../scripts/install-op.ps1"
    ))
    .expect("Windows CLI installer is readable");
    assert!(
        installer.contains("14.51.36247.0")
            && installer.contains("https://aka.ms/vs/18/release/14.51.36247/VC_redist.x64.exe")
            && installer
                .contains("843068991daaa1f73ad9f6239bce4d0f6a07a51f18c37ea2a867e9beca71295c"),
        "the CLI installer must bind the reviewed VC++ Runtime version, URL, and digest"
    );
    assert!(
        installer.contains("function Get-InstalledVcRedistVersion")
            && installer.contains("[Microsoft.Win32.RegistryView]::Registry64")
            && installer.contains(
                r#"SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\$RuntimeArch"#,
            )
            && installer.contains("$env:PROCESSOR_ARCHITEW6432")
            && installer.contains("$env:PROCESSOR_ARCHITECTURE")
            && installer.contains(r#"$VcRuntimeArch = "arm64""#)
            && installer.contains(r#"$VcRuntimeArch = "x64""#),
        "the CLI installer must query the native-architecture Runtime key through the 64-bit registry view"
    );
    let service_start = installer
        .find("function Install-VcRedistIfRequired")
        .expect("CLI installer should define Runtime servicing");
    let service_end = installer[service_start..]
        .find("function Resolve-Version")
        .map(|offset| service_start + offset)
        .expect("Runtime servicing should be isolated before release resolution");
    let service = &installer[service_start..service_end];
    assert_eq!(
        service.matches("Get-InstalledVcRedistVersion").count(),
        2,
        "Runtime servicing must check the installed version both before and after installation"
    );
    assert!(
        service.contains("$InstallerItem.PSIsContainer")
            && service.contains("[System.IO.FileAttributes]::ReparsePoint")
            && service.contains("$InstallerItem.Length -le 0")
            && service.contains("Get-AuthenticodeSignature")
            && service.contains("[System.Management.Automation.SignatureStatus]::Valid")
            && service.contains("GetNameInfo")
            && service.contains("X509NameType]::SimpleName")
            && service.contains("$SignerName -cne \"Microsoft Corporation\"")
            && service.contains("O=Microsoft Corporation"),
        "the downloaded Runtime must be a regular file with a valid Microsoft Authenticode signer"
    );
    assert!(
        service.contains("Start-Process")
            && service.contains("-Verb RunAs -Wait -PassThru")
            && service.contains("/install /passive /norestart /log")
            && service.contains("@(0, 3010, 1638)"),
        "the Runtime installer must run elevated/passively and accept only reviewed success statuses"
    );
    assert!(
        service.contains("$null -eq $InstalledVersion -or $InstalledVersion -lt $VcRedistVersion")
            && service.contains("throw \"install-op: Visual C++ runtime"),
        "the CLI install must fail closed when the post-install Runtime version is insufficient"
    );
    let service_call = installer
        .find("$VcRedistRebootRequired = Install-VcRedistIfRequired")
        .expect("CLI install should service the Runtime");
    let archive_download = installer
        .find("Invoke-WebRequest -Uri $Url -OutFile $Archive")
        .expect("CLI install should download its release archive");
    assert!(
        service_call < archive_download,
        "the VC++ Runtime prerequisite must be ready before installing the CLI archive"
    );
    let reboot_branch = installer
        .rfind("if ($VcRedistRebootRequired)")
        .expect("CLI installer should branch on Runtime reboot status");
    let reboot_branch = &installer[reboot_branch..];
    assert!(
        reboot_branch
            .find("} else {")
            .zip(reboot_branch.find("& $Target --version"))
            .is_some_and(|(otherwise, verify)| otherwise < verify),
        "a 3010 Runtime result must not execute op before Windows restarts"
    );
}

#[test]
fn web_smoke_page_uses_current_canvaskit_bundle_command() {
    let smoke = std::fs::read_to_string(concat!(env!("CARGO_MANIFEST_DIR"), "/smoke/step-1b.html"))
        .expect("web smoke page is readable");

    assert!(
        smoke.contains("--features canvaskit"),
        "web smoke page should show the current CanvasKit bundle build command"
    );
    assert!(
        smoke.contains("mod.mount_ck('op')"),
        "web smoke page should mount the production CanvasKit shell"
    );
    assert!(
        !smoke.contains("mod.mount('op')"),
        "web smoke page must not mount the default wasm stub"
    );
    assert!(
        !smoke.contains("--features skia"),
        "web smoke page must not point users at the retired skia wasm build"
    );
    assert!(
        !smoke.contains("EMSDK"),
        "web smoke page must not require the retired EMSDK setup"
    );
}

#[test]
fn web_integration_notes_avoid_legacy_ambiguous_markers() {
    let manifest_dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
    let files = [
        "Cargo.toml",
        "src/dom_io.rs",
        "src/file_actions.rs",
        "src/iconify_web.rs",
        "src/lib.rs",
        "src/live_sync.rs",
        "src/raf_pump.rs",
        "src/web_clipboard.rs",
        "src/web_fonts.rs",
    ];

    for file in files {
        let text = std::fs::read_to_string(manifest_dir.join(file))
            .unwrap_or_else(|err| panic!("{file} is readable: {err}"));
        assert!(
            !text.contains("UNVERIFIED in-browser"),
            "{file} should name the concrete smoke/daemon boundary instead of a blanket UNVERIFIED marker"
        );
        assert!(
            !text.contains("EMSDK"),
            "{file} should describe the current CanvasKit/web-sys boundary instead of the retired EMSDK path"
        );
    }
}

#[test]
fn browser_smoke_script_covers_canvas_and_daemon_paths() {
    let repo = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let script = std::fs::read_to_string(repo.join("tools/check-web-browser-smoke.sh"))
        .expect("browser smoke script is readable");

    assert!(
        script.contains("--dump-dom"),
        "browser smoke should drive a real headless browser, not only curl"
    );
    assert!(
        script.contains("/smoke/step-1b.html"),
        "browser smoke should cover the pure CanvasKit mount harness"
    );
    assert!(
        script.contains("/api/mcp/server"),
        "browser smoke should cover the daemon health path"
    );
    assert!(
        script.contains("data-op-smoke=\"ok\""),
        "browser smoke should assert the DOM success marker written after mount"
    );
    assert!(
        script.contains("local status=$?")
            && script.contains("set +e")
            && script.contains("kill -9 \"$SERVER_PID\"")
            && script.matches("kill -9 \"$chrome_pid\"").count() >= 3
            && script.contains("for _ in $(seq 1 20)")
            && script.contains("return \"$status\""),
        "cleanup should preserve the smoke result instead of replacing it with a profile deletion race"
    );
}

#[test]
fn web_rust_publish_has_docker_and_start_script_entrypoints() {
    let repo = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let dockerfile =
        std::fs::read_to_string(repo.join("Dockerfile.web-rust")).expect("Dockerfile readable");
    let start_script = std::fs::read_to_string(repo.join("scripts/start-web-rust.sh"))
        .expect("web rust start script is readable");

    assert!(
        dockerfile.contains("op-host-web-server --serve-web"),
        "web Rust Docker image should publish through the headless serve-web daemon"
    );
    assert!(
        start_script.contains("tools/check-wasm-bundle.sh"),
        "start script should build or verify the deployable CanvasKit bundle"
    );
    assert!(
        start_script.contains("op-host-web-server") && start_script.contains("--serve-web"),
        "start script should publish through op-host-web-server --serve-web"
    );
    assert!(
        start_script.contains("OPENPENCIL_WEB_BUNDLE_DIR"),
        "start script should point the daemon at the built web bundle explicitly"
    );
}
