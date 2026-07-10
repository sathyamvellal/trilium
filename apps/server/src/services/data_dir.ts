/*
 * This file resolves trilium data path in this order of priority:
 * - case A) if TRILIUM_DATA_DIR environment variable exists, then its value is used as the path
 * - case B) if "trilium-data" dir exists in the installation directory, then it is used
 * - case C) if "trilium-data" dir exists directly in the home dir, then it is used
 * - case D) based on OS convention, if the "app data directory" exists, we'll use or create "trilium-data" directory there
 * - case E) as a fallback if the previous step fails, we'll use home dir
 */

import fs from "fs";
import os from "os";
import { dirname, join as pathJoin } from "path";

const DIR_NAME = "trilium-data";
const FOLDER_PERMISSIONS = 0o700;

export function getTriliumDataDir(dataDirName: string) {
    // case A
    if (process.env.TRILIUM_DATA_DIR) {
        createDirIfNotExisting(process.env.TRILIUM_DATA_DIR);
        return process.env.TRILIUM_DATA_DIR;
    }

    // case B
    const installDataPath = getInstallDirDataPath(dataDirName);
    if (installDataPath) {
        return installDataPath;
    }

    // case C
    const homePath = pathJoin(os.homedir(), dataDirName);
    if (fs.existsSync(homePath)) {
        return homePath;
    }

    // case D
    const platformAppDataDir = getPlatformAppDataDir(os.platform(), process.env.APPDATA);
    if (platformAppDataDir && fs.existsSync(platformAppDataDir)) {
        const appDataDirPath = pathJoin(platformAppDataDir, dataDirName);
        createDirIfNotExisting(appDataDirPath);
        return appDataDirPath;
    }

    // case E
    createDirIfNotExisting(homePath);
    return homePath;
}

export function getInstallDirDataPath(dataDirName: string, platform: ReturnType<typeof os.platform> = os.platform(), executablePath: string = getExecutablePath(platform)) {
    const installDir = getExecutableInstallDir(platform, executablePath);
    const installDataPath = pathJoin(installDir, dataDirName);

    if (fs.existsSync(installDataPath) && fs.statSync(installDataPath).isDirectory()) {
        return installDataPath;
    }

    return null;
}

function getExecutablePath(platform: ReturnType<typeof os.platform>) {
    if (platform === "linux" && process.env.APPIMAGE) {
        return process.env.APPIMAGE;
    }

    return process.execPath;
}

export function getExecutableInstallDir(platform: ReturnType<typeof os.platform>, executablePath: string) {
    if (platform === "darwin") {
        const appBundleMatch = executablePath.match(/^(.*\.app)(?:\/|$)/);

        if (appBundleMatch?.[1]) {
            return dirname(appBundleMatch[1]);
        }
    }

    return dirname(executablePath);
}

export function getDataDirs(TRILIUM_DATA_DIR: string) {
    const dataDirs = {
        TRILIUM_DATA_DIR,
        DOCUMENT_PATH: process.env.TRILIUM_DOCUMENT_PATH || pathJoin(TRILIUM_DATA_DIR, "document.db"),
        BACKUP_DIR: process.env.TRILIUM_BACKUP_DIR || pathJoin(TRILIUM_DATA_DIR, "backup"),
        LOG_DIR: process.env.TRILIUM_LOG_DIR || pathJoin(TRILIUM_DATA_DIR, "log"),
        TMP_DIR: process.env.TRILIUM_TMP_DIR || pathJoin(TRILIUM_DATA_DIR, "tmp"),
        ANONYMIZED_DB_DIR: process.env.TRILIUM_ANONYMIZED_DB_DIR || pathJoin(TRILIUM_DATA_DIR, "anonymized-db"),
        CONFIG_INI_PATH: process.env.TRILIUM_CONFIG_INI_PATH || pathJoin(TRILIUM_DATA_DIR, "config.ini"),
        OCR_CACHE_DIR: process.env.TRILIUM_OCR_CACHE_DIR || pathJoin(TRILIUM_DATA_DIR, "ocr-cache")
    } as const;

    createDirIfNotExisting(dataDirs.TMP_DIR);

    Object.freeze(dataDirs);
    return dataDirs;
}

export function getPlatformAppDataDir(platform: ReturnType<typeof os.platform>, ENV_APPDATA_DIR: string | undefined = process.env.APPDATA) {
    switch (true) {
        case platform === "win32" && !!ENV_APPDATA_DIR:
            return ENV_APPDATA_DIR;

        case platform === "linux":
            return `${os.homedir()}/.local/share`;

        case platform === "darwin":
            return `${os.homedir()}/Library/Application Support`;

        default:
            // if OS is not recognized
            return null;
    }
}

function outputPermissionDiagnostics(targetPath: fs.PathLike) {
    const pathStr = targetPath.toString();
    const parentDir = pathJoin(pathStr, "..");

    console.error("\n========== PERMISSION ERROR DIAGNOSTICS ==========");
    console.error(`Failed to create directory: ${pathStr}`);

    // Output current process UID:GID (Unix only)
    if (typeof process.getuid === "function" && typeof process.getgid === "function") {
        console.error(`Process running as UID:GID = ${process.getuid()}:${process.getgid()}`);
    }

    // Try to get parent directory stats
    try {
        const stats = fs.statSync(parentDir);
        console.error(`Parent directory: ${parentDir}`);
        console.error(`  Owner UID:GID = ${stats.uid}:${stats.gid}`);
        console.error(`  Permissions = ${(stats.mode & 0o777).toString(8)} (octal)`);
    } catch {
        console.error(`Parent directory ${parentDir} is not accessible`);
    }

    console.error("\nTo fix this issue:");
    console.error("  - Ensure the data directory is owned by the user running Trilium");
    console.error("  - Or set USER_UID and USER_GID environment variables to match the directory owner");
    console.error("  - Example: docker run -e USER_UID=$(id -u) -e USER_GID=$(id -g) ...");
    console.error("====================================================\n");
}

function createDirIfNotExisting(path: fs.PathLike, permissionMode: fs.Mode = FOLDER_PERMISSIONS) {
    try {
        fs.mkdirSync(path, permissionMode);
    } catch (err: unknown) {
        if (err && typeof err === "object" && "code" in err) {
            const code = (err as { code: string }).code;

            if (code === "EACCES") {
                outputPermissionDiagnostics(path);
            } else if (code === "EEXIST") {
                // Directory already exists - verify it's actually a directory
                try {
                    if (fs.statSync(path).isDirectory()) {
                        return;
                    }
                } catch {
                    // If we can't stat it, fall through to re-throw original error
                }
            }
        }
        throw err;
    }
}

const TRILIUM_DATA_DIR = getTriliumDataDir(DIR_NAME);
const dataDirs = getDataDirs(TRILIUM_DATA_DIR);

export default dataDirs;
