// src/services/captureService.js
import domtoimage from "dom-to-image";
import { saveAs } from "file-saver";

/**
 * ปรับปรุงการตรวจสอบว่า Font ถูกโหลดแล้วหรือไม่
 * ใช้วิธีการหลายขั้นตอนเพื่อให้แน่ใจว่าฟอนต์พร้อมใช้งาน
 * @param {string} fontFamily - ชื่อ Font ที่ต้องการตรวจสอบ
 * @returns {Promise<boolean>} - สถานะการโหลด Font
 */
const checkFontLoaded = async (fontFamily = "Kanit") => {
  console.log(`🔍 Starting font loading check for: ${fontFamily}`);

  try {
    // ขั้นตอนที่ 1: Force load font ในหลายน้ำหนัก
    console.log("📥 Step 1: Force loading fonts...");
    const fontPromises = [
      document.fonts.load(`400 12px "${fontFamily}"`),
      document.fonts.load(`400 16px "${fontFamily}"`),
      document.fonts.load(`700 12px "${fontFamily}"`),
      document.fonts.load(`700 16px "${fontFamily}"`),
      document.fonts.load(`400 20px "${fontFamily}"`),
      document.fonts.load(`700 20px "${fontFamily}"`),
    ];

    // รอให้ font load (timeout 5 วินาที)
    await Promise.race([
      Promise.all(fontPromises),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);

    console.log("✅ Step 1 completed: Font load promises resolved");

    // ขั้นตอนที่ 2: รอ document.fonts.ready
    console.log("⏳ Step 2: Waiting for document.fonts.ready...");
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);

    console.log("✅ Step 2 completed: document.fonts.ready");

    // ขั้นตอนที่ 3: ตรวจสอบว่าฟอนต์โหลดจริงแล้วหรือไม่
    console.log("🔍 Step 3: Verifying font availability...");
    const fontChecks = [
      document.fonts.check(`400 16px "${fontFamily}"`),
      document.fonts.check(`700 16px "${fontFamily}"`),
    ];

    const allFontsLoaded = fontChecks.every(Boolean);
    console.log(`📊 Font check results:`, fontChecks);

    if (allFontsLoaded) {
      console.log("✅ Step 3 completed: All fonts verified as loaded");

      // ขั้นตอนที่ 4: รอเพิ่มเติมเพื่อให้ฟอนต์ render
      console.log("⏳ Step 4: Additional rendering wait...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("✅ Step 4 completed: Additional wait finished");

      return true;
    } else {
      console.warn("⚠️ Some fonts not loaded, trying fallback method...");

      // ขั้นตอนที่ 5: Fallback - รอนานขึ้นแล้วลองอีกรอบ
      console.log("🔄 Step 5: Fallback loading...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const fallbackChecks = [
        document.fonts.check(`400 16px "${fontFamily}"`),
        document.fonts.check(`700 16px "${fontFamily}"`),
      ];

      const fallbackResult = fallbackChecks.some(Boolean);
      console.log(`📊 Fallback check results:`, fallbackChecks);

      if (fallbackResult) {
        console.log("✅ Step 5 completed: Fallback successful");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return true;
      } else {
        console.warn(
          "❌ Step 5 failed: Font still not available, proceeding anyway"
        );
        return false;
      }
    }
  } catch (error) {
    console.error("💥 Font loading check failed:", error);
    // รอสักหน่อยแล้วให้ทำงานต่อไป
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return false;
  }
};

/**
 * เพิ่มฟอนต์ลิงก์ถ้ายังไม่มี และ preload ฟอนต์
 */
const ensureFontAvailability = async () => {
  console.log("🔧 Ensuring font availability...");

  // เพิ่ม font link ถ้ายังไม่มี
  if (!document.getElementById("kanit-font")) {
    console.log("📥 Adding Kanit font link...");
    const link = document.createElement("link");
    link.id = "kanit-font";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&display=swap";
    document.head.appendChild(link);
  }

  // เพิ่ม preload hints
  if (!document.getElementById("kanit-preload-400")) {
    console.log("🚀 Adding font preload hints...");
    const preload400 = document.createElement("link");
    preload400.id = "kanit-preload-400";
    preload400.rel = "preload";
    preload400.as = "font";
    preload400.type = "font/woff2";
    preload400.href =
      "https://fonts.gstatic.com/s/kanit/v12/nKKZ-Go6G5tXcraVGwCKd6xBDFs.woff2";
    preload400.crossOrigin = "anonymous";
    document.head.appendChild(preload400);

    const preload700 = document.createElement("link");
    preload700.id = "kanit-preload-700";
    preload700.rel = "preload";
    preload700.as = "font";
    preload700.type = "font/woff2";
    preload700.href =
      "https://fonts.gstatic.com/s/kanit/v12/nKKb-Go6G5tXcraVOyMuVrHaP3KGFw.woff2";
    preload700.crossOrigin = "anonymous";
    document.head.appendChild(preload700);
  }

  // รอให้ link เพิ่มเข้าไปใน DOM
  await new Promise((resolve) => setTimeout(resolve, 100));
  console.log("✅ Font availability ensured");
};

/**
 * ตรวจสอบการรองรับของ Clipboard API
 */
const canUseClipboard = () => {
  return !!(navigator.clipboard && navigator.clipboard.write);
};

/**
 * สร้าง Blob จาก DOM Element พร้อมการจัดการฟอนต์ที่ดีขึ้น
 */
const createImageBlob = async (element, options = {}) => {
  console.log("🖼️ Starting image blob creation...");

  // ขั้นตอนที่ 1: เตรียมฟอนต์
  await ensureFontAvailability();

  // ขั้นตอนที่ 2: ตรวจสอบฟอนต์
  const fontReady = await checkFontLoaded(options.fontFamily || "Kanit");

  if (!fontReady) {
    console.warn("⚠️ Font not fully loaded, but proceeding with capture");
  }

  // ขั้นตอนที่ 3: เตรียม element สำหรับแคป
  console.log("🎨 Preparing element for capture...");

  // บังคับใช้ฟอนต์ Kanit ในทุก element
  const originalStyle = element.style.cssText;
  element.style.fontFamily = "'Kanit', sans-serif";

  // เพิ่ม CSS เพื่อบังคับฟอนต์
  const styleSheet = document.createElement("style");
  styleSheet.id = "capture-font-override";
  styleSheet.textContent = `
    #${element.id || "capture-target"} * {
      font-family: 'Kanit', sans-serif !important;
    }
  `;
  document.head.appendChild(styleSheet);

  // ตั้งค่าสำหรับ domtoimage
  const captureOptions = {
    bgcolor: options.bgColor || "#ffffff",
    style: {
      fontFamily: "'Kanit', sans-serif",
      ...options.styles,
    },
    width: options.width || element.scrollWidth,
    height: options.height || element.scrollHeight,
    quality: options.quality || 1.0,
    cacheBust: true,
    imagePlaceholder:
      "data:image/png;base64,iVBORw0KGoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    // เพิ่ม font embedding CSS
    fontEmbedCSS: `
      @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&display=swap');
      * { 
        font-family: 'Kanit', sans-serif !important; 
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    `,
    // เพิ่มการ filter สำหรับ external resources
    filter: (node) => {
      // อนุญาตให้ใช้ font จาก Google Fonts
      if (
        node.tagName === "LINK" &&
        node.href &&
        node.href.includes("fonts.googleapis.com")
      ) {
        return true;
      }
      return true;
    },
  };

  try {
    console.log("📸 Capturing image with domtoimage...");
    const blob = await domtoimage.toBlob(element, captureOptions);
    console.log("✅ Image blob created successfully");
    return blob;
  } catch (error) {
    console.error("💥 Error creating image blob:", error);
    throw new Error(`ไม่สามารถสร้างรูปภาพได้: ${error.message}`);
  } finally {
    // เคลียร์ style ที่เพิ่มไว้
    element.style.cssText = originalStyle;
    const tempStyle = document.getElementById("capture-font-override");
    if (tempStyle) {
      tempStyle.remove();
    }
    console.log("🧹 Cleanup completed");
  }
};

/**
 * แคปภาพและบันทึกเป็นไฟล์
 */
export const captureToImage = async (
  element,
  filename = "capture",
  options = {}
) => {
  try {
    console.log(`🎯 Starting capture to image: ${filename}`);

    const blob = await createImageBlob(element, options);
    saveAs(blob, `${filename}.png`);

    console.log(`✅ Successfully saved image: ${filename}.png`);
    return true;
  } catch (error) {
    console.error("💥 Error capturing to image:", error);
    throw error;
  }
};

/**
 * แคปภาพและคัดลอกไปยังคลิปบอร์ด
 */
export const captureToClipboard = async (element, options = {}) => {
  try {
    console.log("📋 Starting capture to clipboard...");

    if (!canUseClipboard()) {
      throw new Error("เบราว์เซอร์นี้ไม่รองรับการคัดลอกรูปภาพไปยังคลิปบอร์ด");
    }

    const blob = await createImageBlob(element, options);
    const item = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);

    console.log("✅ Successfully copied to clipboard");
    return true;
  } catch (error) {
    console.error("💥 Error capturing to clipboard:", error);
    throw error;
  }
};

/**
 * แคปภาพและแสดงตัวอย่าง
 */
export const captureToDataURL = async (element, options = {}) => {
  try {
    console.log("🖼️ Starting capture to data URL...");

    // เตรียมฟอนต์และตรวจสอบ
    await ensureFontAvailability();
    await checkFontLoaded(options.fontFamily || "Kanit");

    const captureOptions = {
      bgcolor: options.bgColor || "#ffffff",
      style: {
        fontFamily: "'Kanit', sans-serif",
        ...options.styles,
      },
      width: options.width || element.scrollWidth,
      height: options.height || element.scrollHeight,
      quality: options.quality || 1.0,
      cacheBust: true,
      fontEmbedCSS: `
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&display=swap');
        * { font-family: 'Kanit', sans-serif !important; }
      `,
    };

    const dataURL = await domtoimage.toPng(element, captureOptions);
    console.log("✅ Successfully created data URL");
    return dataURL;
  } catch (error) {
    console.error("💥 Error capturing to data URL:", error);
    throw error;
  }
};

/**
 * แคปภาพด้วยตัวเลือกขั้นสูง
 */
export const captureWithOptions = async (element, options = {}) => {
  try {
    console.log("🔧 Starting advanced capture...");

    const blob = await createImageBlob(element, options);
    const dataURL = await captureToDataURL(element, options);

    // ถ้ามีการระบุให้บันทึกไฟล์
    if (options.saveAs && options.filename) {
      saveAs(blob, `${options.filename}.png`);
    }

    // ถ้ามีการระบุให้คัดลอกไปคลิปบอร์ด
    if (options.copyToClipboard && canUseClipboard()) {
      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
    }

    console.log("✅ Advanced capture completed successfully");
    return { blob, dataURL };
  } catch (error) {
    console.error("💥 Error in advanced capture:", error);
    throw error;
  }
};

/**
 * ตรวจสอบสภาพแวดล้อมสำหรับการแคปภาพ
 */
export const checkCaptureEnvironment = () => {
  const env = {
    domToImageSupported: typeof domtoimage !== "undefined",
    clipboardSupported: canUseClipboard(),
    fileSaverSupported: typeof saveAs === "function",
    fontsSupported: "fonts" in document,
    fontLoadSupported: "fonts" in document && "load" in document.fonts,
  };

  console.log("🔍 Capture environment check:", env);
  return env;
};

export default {
  captureToImage,
  captureToClipboard,
  captureToDataURL,
  captureWithOptions,
  checkCaptureEnvironment,
};
