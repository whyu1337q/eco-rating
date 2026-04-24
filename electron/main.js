const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const shouldOpenDevTools = process.env.ECO_DEVTOOLS === "1";
const BASE_CONTENT_WIDTH = 1280;
const BASE_CONTENT_HEIGHT = 860;
const MIN_ZOOM = 0.8;
const MAX_ZOOM = 1.15;
const WINDOW_ICON_PATH = path.join(__dirname, "..", "icon.ico");
const APP_NAME = "Эко-рейтинг";
const APP_USER_MODEL_ID = "ru.ecorating.app";

app.setName(APP_NAME);

if (process.platform === "win32") {
  app.setAppUserModelId(APP_USER_MODEL_ID);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function applyAdaptiveZoom(win) {
  if (win.isDestroyed()) {
    return;
  }

  const [contentWidth, contentHeight] = win.getContentSize();
  const widthFactor = contentWidth / BASE_CONTENT_WIDTH;
  const heightFactor = contentHeight / BASE_CONTENT_HEIGHT;
  const nextZoom = clamp(Math.min(widthFactor, heightFactor), MIN_ZOOM, MAX_ZOOM);

  if (Math.abs(win.webContents.getZoomFactor() - nextZoom) > 0.01) {
    win.webContents.setZoomFactor(nextZoom);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: BASE_CONTENT_WIDTH,
    height: BASE_CONTENT_HEIGHT,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: "#f6f7f3",
    icon: WINDOW_ICON_PATH,
    title: APP_NAME,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.removeMenu();
  win.loadFile(path.join(__dirname, "..", "app", "index.html"));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  let resizeTimer = null;

  win.webContents.on("did-finish-load", () => {
    applyAdaptiveZoom(win);
  });

  win.on("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      applyAdaptiveZoom(win);
    }, 60);
  });

  if (shouldOpenDevTools) {
    win.webContents.openDevTools({ mode: "detach" });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
