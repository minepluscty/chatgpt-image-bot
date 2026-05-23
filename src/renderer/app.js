const $ = (id) => document.getElementById(id);

async function init() {
  const config = await window.botApi.loadConfig();
  $('inputFolder').value = config.inputFolder || '';
  $('outputFolder').value = config.outputFolder || '';
  $('gptLink').value = config.gptLink || '';
  $('commandTranslate').value = config.commandTranslate || 'D';
  $('commandGenerate').value = config.commandGenerate || 'T';
  $('waitAfterUpload').value = config.waitAfterUpload || 15000;
  $('maxWaitTranslate').value = config.maxWaitTranslate || 180000;
  $('maxWaitResult').value = config.maxWaitResult || 240000;
  $('maxBlocks').value = config.maxBlocks || 20;
  $('autoNewChat').checked = config.autoNewChat !== false;
  bindEvents();
}

function getConfig() {
  return {
    inputFolder: $('inputFolder').value.trim(),
    outputFolder: $('outputFolder').value.trim(),
    gptLink: $('gptLink').value.trim(),
    commandTranslate: $('commandTranslate').value.trim() || 'D',
    commandGenerate: $('commandGenerate').value.trim() || 'T',
    waitAfterUpload: Number($('waitAfterUpload').value || 15000),
    maxWaitTranslate: Number($('maxWaitTranslate').value || 180000),
    maxWaitResult: Number($('maxWaitResult').value || 240000),
    maxBlocks: Number($('maxBlocks').value || 20),
    autoNewChat: $('autoNewChat').checked
  };
}

function bindEvents() {
  $('chooseInput').onclick = async () => {
    const folder = await window.botApi.selectFolder();
    if (folder) $('inputFolder').value = folder;
  };
  $('chooseOutput').onclick = async () => {
    const folder = await window.botApi.selectFolder();
    if (folder) $('outputFolder').value = folder;
  };
  $('openInput').onclick = () => window.botApi.openFolder($('inputFolder').value);
  $('openOutput').onclick = () => window.botApi.openFolder($('outputFolder').value);
  $('startBtn').onclick = () => window.botApi.start(getConfig());
  $('stopBtn').onclick = () => window.botApi.stop();
  $('continueBtn').onclick = () => window.botApi.continueRun();
}

window.botApi.onLog((message) => {
  const box = $('logBox');
  box.textContent += message + '\n';
  box.scrollTop = box.scrollHeight;
});

init().catch((error) => {
  const box = $('logBox');
  if (box) box.textContent += 'Lỗi giao diện: ' + error.message + '\n';
});
