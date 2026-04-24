const { contextBridge } = require("electron");
const fs = require("fs/promises");
const path = require("path");

contextBridge.exposeInMainWorld("ecoShell", {
  platform: process.platform,
  isElectron: true,
  async readBundledTextFile(fileName) {
    const filePath = path.join(__dirname, "..", "app", fileName);
    return fs.readFile(filePath, "utf8");
  }
});
