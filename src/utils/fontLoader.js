/**
 * ฟังก์ชันรอให้ฟอนต์โหลดเสร็จ - ปรับปรุงแล้ว
 */
export const waitForFonts = async (
  fontFamily = "Kanit",
  maxWaitTime = 10000
) => {
  console.log(`🔤 Waiting for font: ${fontFamily}`);

  try {
    // วิธีที่ 1: ใช้ document.fonts.load() - แม่นยำกว่า
    if (document.fonts && document.fonts.load) {
      await Promise.all([
        document.fonts.load("400 16px Kanit"),
        document.fonts.load("700 16px Kanit"),
      ]);
      console.log("✅ Fonts loaded via document.fonts.load()");
      return true;
    }

    // วิธีที่ 2: ใช้ document.fonts.ready - สำหรับ fallback
    if (document.fonts && document.fonts.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, maxWaitTime)),
      ]);

      // ตรวจสอบอีกครั้งว่าฟอนต์โหลดจริงไหม
      const isLoaded =
        document.fonts.check("400 16px Kanit") &&
        document.fonts.check("700 16px Kanit");

      if (isLoaded) {
        console.log("✅ Fonts loaded via document.fonts.ready");
        return true;
      }
    }

    // วิธีที่ 3: Manual check - สำหรับเบราว์เซอร์เก่า
    return await manualFontCheck(fontFamily, maxWaitTime);
  } catch (error) {
    console.warn("⚠️ Font loading error:", error);
    // รอเพิ่มเติมเผื่อฟอนต์ยังโหลดอยู่
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return false;
  }
};

/**
 * ตรวจสอบฟอนต์แบบ manual - สำหรับเบราว์เซอร์เก่า
 */
const manualFontCheck = async (fontFamily, maxWaitTime) => {
  console.log("🔤 Using manual font check...");

  const startTime = Date.now();
  const testString = "กขคงจฉชABCDEF123456";

  // สร้าง element ทดสอบ
  const testElement = document.createElement("div");
  testElement.style.cssText = `
    position: absolute;
    top: -9999px;
    left: -9999px;
    font-size: 48px;
    font-family: monospace;
    visibility: hidden;
  `;
  testElement.textContent = testString;
  document.body.appendChild(testElement);

  const fallbackWidth = testElement.offsetWidth;
  testElement.style.fontFamily = `"${fontFamily}", monospace`;

  return new Promise((resolve) => {
    const checkFont = () => {
      const currentWidth = testElement.offsetWidth;
      const elapsed = Date.now() - startTime;

      if (currentWidth !== fallbackWidth) {
        // ฟอนต์โหลดแล้ว - ขนาดเปลี่ยน
        document.body.removeChild(testElement);
        console.log(`✅ Font loaded after ${elapsed}ms`);
        resolve(true);
      } else if (elapsed >= maxWaitTime) {
        // หมดเวลารอแล้ว
        document.body.removeChild(testElement);
        console.log(`⏰ Font check timeout after ${elapsed}ms`);
        resolve(false);
      } else {
        // ตรวจสอบใหม่อีกครั้ง
        setTimeout(checkFont, 100);
      }
    };

    checkFont();
  });
};

/**
 * Force reload fonts - สำหรับกรณีฉุกเฉิน
 */
export const forceReloadFonts = () => {
  console.log("🔄 Force reloading fonts...");

  // ลบ stylesheet เก่า
  const existingLinks = document.querySelectorAll(
    'link[href*="fonts.googleapis.com"]'
  );
  existingLinks.forEach((link) => link.remove());

  // เพิ่ม stylesheet ใหม่
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&display=swap&v=" +
    Date.now();
  document.head.appendChild(link);

  return waitForFonts();
};
