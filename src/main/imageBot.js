const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { getProfilePath } = require('./config');

class ImageBot {
  constructor(log) {
    this.log = log;
    this.shouldStop = false;
    this.waitingContinue = null;
    this.context = null;
    this.page = null;
  }

  stop() {
    this.shouldStop = true;
    this.log('Đang dừng sau ảnh hiện tại...');
  }

  continueAfterLogin() {
    if (this.waitingContinue) {
      this.waitingContinue();
      this.waitingContinue = null;
    }
  }

  async waitContinue() {
    return new Promise(resolve => {
      this.waitingContinue = resolve;
    });
  }

  async start(config) {
    this.shouldStop = false;

    const inputFolder = config.inputFolder;
    const outputFolder = config.outputFolder;
    const gptLink = config.gptLink;
    const promptText = config.promptText;
    const waitAfterUpload = Number(config.waitAfterUpload || 15000);
    const maxWaitResult = Number(config.maxWaitResult || 180000);

    if (!inputFolder || !fs.existsSync(inputFolder)) {
      this.log('Lỗi: thư mục ảnh nguồn không hợp lệ.');
      return false;
    }

    if (!outputFolder) {
      this.log('Lỗi: chưa chọn thư mục lưu ảnh kết quả.');
      return false;
    }

    if (!gptLink || !gptLink.startsWith('https://chatgpt.com/g/')) {
      this.log('Lỗi: link GPT không hợp lệ.');
      return false;
    }

    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });

    const files = fs.readdirSync(inputFolder).filter(file => {
      const ext = file.toLowerCase();
      return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.webp');
    });

    if (!files.length) {
      this.log('Không tìm thấy ảnh trong thư mục nguồn.');
      return false;
    }

    this.log(`Tìm thấy ${files.length} ảnh.`);
    await this.openPage(gptLink);
    this.log('Nếu chưa đăng nhập ChatGPT, hãy đăng nhập trong Chrome vừa mở.');
    this.log('Sau đó bấm "Tiếp tục chạy" trong app.');
    await this.waitContinue();

    for (let i = 0; i < files.length; i++) {
      if (this.shouldStop) break;

      const file = files[i];
      const fullPath = path.join(inputFolder, file);
      const baseName = path.parse(file).name;

      this.log(`(${i + 1}/${files.length}) Đang xử lý: ${file}`);
      await this.uploadImage(fullPath, waitAfterUpload);
      await this.sendPrompt(promptText);
      this.log('Đã gửi prompt. Đang chờ ảnh kết quả...');

      const saved = await this.waitDownload(outputFolder, baseName, maxWaitResult);
      if (saved) this.log(`Đã lưu ảnh: ${saved}`);
      else this.log('Chưa tải được ảnh. Có thể nút tải chưa hiện hoặc giao diện đã đổi.');
    }

    this.log('Hoàn tất.');
    return true;
  }

  async openPage(gptLink) {
    if (!this.context) {
      this.context = await chromium.launchPersistentContext(getProfilePath(), {
        headless: false,
        channel: 'chrome',
        acceptDownloads: true,
        viewport: null
      });
    }
    if (!this.page || this.page.isClosed()) this.page = await this.context.newPage();
    await this.page.goto(gptLink, { waitUntil: 'domcontentloaded', timeout: 90000 });
  }

  async uploadImage(fullPath, waitAfterUpload) {
    const fileInput = this.page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(fullPath);
    this.log('Đã chọn ảnh, đang chờ upload...');
    await this.page.waitForTimeout(waitAfterUpload);
  }

  async sendPrompt(promptText) {
    const editor = this.page.locator('[contenteditable="true"]').last();
    await editor.waitFor({ state: 'visible', timeout: 30000 });
    await editor.click();
    await this.page.keyboard.type(promptText, { delay: 8 });
    await this.page.waitForTimeout(1000);

    const sendButton = this.page.locator('button[data-testid="send-button"], button[data-testid="composer-submit-button"], button[aria-label="Send prompt"], button[aria-label="Send message"], button[aria-label="Gửi tin nhắn"]').last();
    await sendButton.waitFor({ state: 'visible', timeout: 30000 });
    await sendButton.click();
  }

  async waitDownload(outputFolder, baseName, maxWaitMs) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      if (this.shouldStop) return null;
      const saved = await this.tryDownload(outputFolder, baseName);
      if (saved) return saved;
      await this.page.waitForTimeout(5000);
    }
    return null;
  }

  async tryDownload(outputFolder, baseName) {
    try {
      const buttons = this.page.locator('button[aria-label*="Download"], button[aria-label*="Tải"], a[download], button:has-text("Download"), button:has-text("Tải xuống")');
      const count = await buttons.count();
      if (!count) return null;

      const downloadPromise = this.page.waitForEvent('download', { timeout: 10000 });
      await buttons.nth(count - 1).click();
      const download = await downloadPromise;
      const ext = path.extname(download.suggestedFilename()) || '.png';
      const savePath = uniquePath(path.join(outputFolder, `${baseName}_result${ext}`));
      await download.saveAs(savePath);
      return savePath;
    } catch {
      return null;
    }
  }

  async close() {
    try {
      if (this.context) await this.context.close();
    } catch {}
  }
}

function uniquePath(filePath) {
  if (!fs.existsSync(filePath)) return filePath;
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const name = path.basename(filePath, ext);
  let i = 2;
  while (true) {
    const next = path.join(dir, `${name}_${i}${ext}`);
    if (!fs.existsSync(next)) return next;
    i++;
  }
}

module.exports = { ImageBot };
