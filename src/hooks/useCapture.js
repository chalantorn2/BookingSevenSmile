// src/hooks/useCapture.js
import { useState, useRef, useEffect } from "react";
import { useNotification } from "./useNotification";
import {
  captureToImage,
  captureToClipboard,
  captureToDataURL,
  captureWithOptions,
} from "../services/captureService";

/**
 * Hook สำหรับการใช้งานระบบแคปภาพในคอมโพเนนต์ใดๆ
 * ปรับปรุงการจัดการ Font Loading ให้ดีขึ้น
 */
const useCapture = (options = {}) => {
  const { showSuccess, showError, showInfo } = useNotification();
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [lastCaptureResult, setLastCaptureResult] = useState(null);
  const captureRef = useRef(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontLoadAttempts, setFontLoadAttempts] = useState(0);

  // ปรับปรุงการตรวจสอบและโหลด Font
  useEffect(() => {
    const loadFontsWithRetry = async (attempt = 1) => {
      console.log(`🔍 Font loading attempt ${attempt}...`);

      try {
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

        // รอให้ DOM อัพเดท
        await new Promise((resolve) => setTimeout(resolve, 100));

        // ลอง force load font
        if (document.fonts && document.fonts.load) {
          console.log("⏳ Force loading fonts...");
          await Promise.all([
            document.fonts.load("400 16px 'Kanit'"),
            document.fonts.load("700 16px 'Kanit'"),
            document.fonts.load("400 12px 'Kanit'"),
            document.fonts.load("700 12px 'Kanit'"),
          ]);
        }

        // รอ document.fonts.ready
        if (document.fonts && document.fonts.ready) {
          console.log("⏳ Waiting for document.fonts.ready...");
          await Promise.race([
            document.fonts.ready,
            new Promise((resolve) => setTimeout(resolve, 3000)),
          ]);
        } else {
          // Fallback สำหรับเบราว์เซอร์เก่า
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // ตรวจสอบว่าฟอนต์โหลดจริงแล้วหรือไม่
        let isFontLoaded = false;
        if (document.fonts && document.fonts.check) {
          isFontLoaded =
            document.fonts.check("400 16px 'Kanit'") &&
            document.fonts.check("700 16px 'Kanit'");
          console.log(`📊 Font check result: ${isFontLoaded}`);
        }

        if (isFontLoaded || attempt >= 3) {
          // ถ้าฟอนต์โหลดแล้ว หรือลองแล้ว 3 ครั้ง ให้หยุด
          console.log(
            isFontLoaded
              ? "✅ Fonts loaded successfully"
              : "⚠️ Max attempts reached, proceeding anyway"
          );
          setFontsLoaded(true);
          setFontLoadAttempts(attempt);

          // รอเพิ่มเติมเพื่อให้ฟอนต์ render
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else if (attempt < 3) {
          // ถ้ายังไม่โหลดและยังลองไม่ถึง 3 ครั้ง ให้ลองใหม่
          console.log(
            `❌ Font not loaded, retrying in 1 second... (attempt ${attempt}/3)`
          );
          setTimeout(() => loadFontsWithRetry(attempt + 1), 1000);
        }
      } catch (error) {
        console.error(`💥 Font loading error (attempt ${attempt}):`, error);
        if (attempt < 3) {
          setTimeout(() => loadFontsWithRetry(attempt + 1), 1000);
        } else {
          console.warn(
            "⚠️ Font loading failed after 3 attempts, proceeding anyway"
          );
          setFontsLoaded(true);
          setFontLoadAttempts(attempt);
        }
      }
    };

    loadFontsWithRetry();
  }, []);

  /**
   * แคปภาพและบันทึกเป็นไฟล์
   */
  const capture = async (filename = "captured-image", captureOptions = {}) => {
    if (!captureRef.current) {
      showError("ไม่พบองค์ประกอบสำหรับแคปภาพ");
      return null;
    }

    if (!fontsLoaded) {
      console.warn("⚠️ Fonts not fully loaded, but proceeding with capture");
      showInfo("กำลังเตรียมฟอนต์... อาจใช้เวลาสักครู่");

      // รอเพิ่มเติมถ้าฟอนต์ยังไม่โหลด
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsCapturing(true);
    showInfo("กำลังสร้างรูปภาพ กรุณารอสักครู่...");

    try {
      const combinedOptions = {
        ...options,
        ...captureOptions,
        fontFamily: "Kanit",
      };

      await captureToImage(captureRef.current, filename, combinedOptions);
      showSuccess("บันทึกรูปภาพสำเร็จ");

      const result = { success: true, type: "image", filename };
      setLastCaptureResult(result);
      return result;
    } catch (error) {
      const result = { success: false, type: "image", error };
      setLastCaptureResult(result);
      showError(`เกิดข้อผิดพลาดในการบันทึกรูปภาพ: ${error.message}`);
      return result;
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * แคปภาพและคัดลอกไปยังคลิปบอร์ด
   */
  const copyToClipboard = async (captureOptions = {}) => {
    if (!captureRef.current) {
      showError("ไม่พบองค์ประกอบสำหรับแคปภาพ");
      return null;
    }

    if (!fontsLoaded) {
      console.warn("⚠️ Fonts not fully loaded, but proceeding with capture");
      showInfo("กำลังเตรียมฟอนต์... อาจใช้เวลาสักครู่");

      // รอเพิ่มเติมถ้าฟอนต์ยังไม่โหลด
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsCapturing(true);
    showInfo("กำลังคัดลอกรูปภาพ กรุณารอสักครู่...");

    try {
      const combinedOptions = {
        ...options,
        ...captureOptions,
        fontFamily: "Kanit",
      };

      await captureToClipboard(captureRef.current, combinedOptions);
      showSuccess("คัดลอกรูปภาพไปยังคลิปบอร์ดแล้ว");

      const result = { success: true, type: "clipboard" };
      setLastCaptureResult(result);
      return result;
    } catch (error) {
      const result = { success: false, type: "clipboard", error };
      setLastCaptureResult(result);
      showError(`เกิดข้อผิดพลาดในการคัดลอกรูปภาพ: ${error.message}`);
      return result;
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * สร้างตัวอย่างรูปภาพ
   */
  const createPreview = async (captureOptions = {}) => {
    if (!captureRef.current) {
      showError("ไม่พบองค์ประกอบสำหรับแคปภาพ");
      return null;
    }

    if (!fontsLoaded) {
      console.warn("⚠️ Fonts not fully loaded, but proceeding with preview");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsCapturing(true);

    try {
      const combinedOptions = {
        ...options,
        ...captureOptions,
        fontFamily: "Kanit",
      };

      const dataUrl = await captureToDataURL(
        captureRef.current,
        combinedOptions
      );
      setPreviewUrl(dataUrl);

      const result = { success: true, type: "preview", dataUrl };
      setLastCaptureResult(result);
      return result;
    } catch (error) {
      const result = { success: false, type: "preview", error };
      setLastCaptureResult(result);
      showError(`เกิดข้อผิดพลาดในการสร้างตัวอย่าง: ${error.message}`);
      return result;
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * ล้างตัวอย่างรูปภาพ
   */
  const clearPreview = () => {
    setPreviewUrl(null);
  };

  /**
   * สั่งพิมพ์
   */
  const print = () => {
    window.print();
    return { success: true, type: "print" };
  };

  /**
   * แคปภาพด้วยตัวเลือกขั้นสูง
   */
  const captureAdvanced = async (advancedOptions = {}) => {
    if (!captureRef.current) {
      showError("ไม่พบองค์ประกอบสำหรับแคปภาพ");
      return null;
    }

    if (!fontsLoaded) {
      console.warn("⚠️ Fonts not fully loaded, waiting a bit more...");
      showInfo("กำลังเตรียมฟอนต์... กรุณารอสักครู่");
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    setIsCapturing(true);
    showInfo("กำลังดำเนินการ กรุณารอสักครู่...");

    try {
      const combinedOptions = {
        ...options,
        ...advancedOptions,
        fontFamily: "Kanit",
      };

      const result = await captureWithOptions(
        captureRef.current,
        combinedOptions
      );

      if (combinedOptions.saveAs) {
        showSuccess("บันทึกรูปภาพสำเร็จ");
      }

      if (combinedOptions.copyToClipboard) {
        showSuccess("คัดลอกรูปภาพไปยังคลิปบอร์ดแล้ว");
      }

      if (combinedOptions.preview) {
        setPreviewUrl(result.dataURL);
      }

      setLastCaptureResult({ success: true, type: "advanced", ...result });
      return { success: true, ...result };
    } catch (error) {
      const errorResult = { success: false, type: "advanced", error };
      setLastCaptureResult(errorResult);
      showError(`เกิดข้อผิดพลาด: ${error.message}`);
      return errorResult;
    } finally {
      setIsCapturing(false);
    }
  };

  return {
    captureRef,
    isCapturing,
    previewUrl,
    lastCaptureResult,
    fontsLoaded,
    fontLoadAttempts, // เพิ่มตัวนี้เพื่อ debug
    capture,
    copyToClipboard,
    createPreview,
    clearPreview,
    print,
    captureAdvanced,
  };
};

export default useCapture;
