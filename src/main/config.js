const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULT_GPT_LINK = 'https://chatgpt.com/g/g-69bbaa14756481919a6f33be7a5ccb50-tach-nen-san-pham-fill-mat-canh-mat-goc';
const DEFAULT_PROMPT = 'Tách nền sản phẩm, fill mất cảnh, mất góc. Giữ sản phẩm rõ nét, tự nhiên, sạch sẽ. Xuất ảnh chất lượng cao.';

function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function getProfilePath() {
  return path.join(app.getPath('userData'), 'browser-profile');
}

function defaultConfig() {
  return {
    inputFolder: '',
    outputFolder: '',
    gptLink: DEFAULT_GPT_LINK,
    promptText: DEFAULT_PROMPT,
    waitAfterUpload: 15000,
    maxWaitResult: 180000
  };
}

function loadConfig() {
  try {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) return defaultConfig();
    return { ...defaultConfig(), ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
  } catch {
    return defaultConfig();
  }
}

function saveConfig(config) {
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf8');
}

module.exports = { loadConfig, saveConfig, getProfilePath };
