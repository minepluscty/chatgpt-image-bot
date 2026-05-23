const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULT_GPT_LINK = 'https://chatgpt.com/g/g-6a0ed5a8ac748191835929da90200f38-vtarch-translate-layout-fix';

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
    commandTranslate: 'D',
    commandGenerate: 'T',
    waitAfterUpload: 15000,
    maxWaitTranslate: 180000,
    maxWaitResult: 240000,
    autoNewChat: true,
    minBlocks: 1,
    maxBlocks: 20
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
