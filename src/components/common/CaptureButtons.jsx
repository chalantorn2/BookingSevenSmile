import React, { useState, useEffect } from "react";
import { Camera, Download, Copy, Loader } from "lucide-react";
import domtoimage from "dom-to-image";
import { useNotification } from "../../hooks/useNotification";

// การตั้งค่าสำหรับ BookingList
const bookingListConfig = {
  showLabels: false, // ไม่แสดงข้อความ
  primaryButtonStyle: "bg-gray-500 text-white hover:bg-gray-700 shadow-lg",
  secondaryButtonStyle: "bg-gray-300 text-gray-800 hover:bg-gray-400 shadow-md",
  buttonSize: {
    sm: "p-1",
    md: "p-2",
    lg: "p-3",
  },
  iconSize: {
    sm: 16,
    md: 20,
    lg: 24,
  },
  iconClass: "", // ไม่มี mr-1 สำหรับไอคอน
  hoverEffect: "transform hover:scale-105 transition-transform",
};

// การตั้งค่าสำหรับ Home
const homeConfig = {
  showLabels: true, // แสดงข้อความ
  primaryButtonStyle: "bg-gray-500 text-white hover:bg-gray-700", // ไม่มีเงา
  secondaryButtonStyle: "bg-gray-300 text-gray-800 hover:bg-gray-400", // ไม่มีเงา
  buttonSize: {
    sm: "p-2 text-base",
    md: "p-2",
    lg: "p-3 text-lg",
  },
  iconSize: {
    sm: 16,
    md: 20,
    lg: 24,
  },
  iconClass: "mr-1", // มี mr-1 สำหรับไอคอน
  hoverEffect: "transform hover:scale-105 transition-transform",
};

/**
 * ปรับปรุงการตรวจสอบและโหลด Font สำหรับ CaptureButtons
 */
const ensureFontReady = async () => {
  console.log("🔍 CaptureButtons: Ensuring font readiness...");

  try {
    // เพิ่ม font link ถ้ายังไม่มี
    if (!document.getElementById("kanit-font")) {
      console.log("📥 CaptureButtons: Adding Kanit font link...");
      const link = document.createElement("link");
      link.id = "kanit-font";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&display=swap";
      document.head.appendChild(link);
    }

    // เพิ่ม preload hints
    if (!document.getElementById("kanit-preload-400")) {
      console.log("🚀 CaptureButtons: Adding font preload hints...");
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

    // Force load fonts
    if (document.fonts && document.fonts.load) {
      console.log("⏳ CaptureButtons: Force loading fonts...");
      await Promise.all([
        document.fonts.load("400 16px 'Kanit'"),
        document.fonts.load("700 16px 'Kanit'"),
        document.fonts.load("400 12px 'Kanit'"),
        document.fonts.load("700 12px 'Kanit'"),
      ]);
    }

    // รอ document.fonts.ready
    if (document.fonts && document.fonts.ready) {
      console.log("⏳ CaptureButtons: Waiting for document.fonts.ready...");
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    }

    // ตรวจสอบว่าฟอนต์โหลดแล้วหรือไม่
    let fontReady = false;
    if (document.fonts && document.fonts.check) {
      fontReady =
        document.fonts.check("400 16px 'Kanit'") &&
        document.fonts.check("700 16px 'Kanit'");
      console.log(`📊 CaptureButtons: Font ready status: ${fontReady}`);
    }

    if (!fontReady) {
      console.log(
        "⏳ CaptureButtons: Font not ready, waiting additional time..."
      );
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    console.log("✅ CaptureButtons: Font preparation completed");
    return true;
  } catch (error) {
    console.error("💥 CaptureButtons: Font preparation error:", error);
    return false;
  }
};

const CaptureButtons = ({
  targetRef,
  filename = "captured-image",
  layout = "row",
  size = "md",
  variant = "default",
  primaryButton = "copy",
  showDownload = true,
  showCopy = true,
  className = "",
  options = {},
  context = "home",
}) => {
  const { showSuccess, showError, showInfo } = useNotification();
  const [isCapturing, setIsCapturing] = useState(false);
  const [fontReady, setFontReady] = useState(false);

  // เลือก config ตาม context
  const config = context === "bookingList" ? bookingListConfig : homeConfig;

  // ตรวจสอบฟอนต์เมื่อ component mount
  useEffect(() => {
    const checkFont = async () => {
      const ready = await ensureFontReady();
      setFontReady(ready);
    };
    checkFont();
  }, []);

  // แคปเป็นไฟล์รูปภาพ
  const captureAsImage = async () => {
    if (!targetRef.current) {
      showError("ไม่พบองค์ประกอบสำหรับแคปภาพ");
      return;
    }

    setIsCapturing(true);
    showInfo("กำลังเตรียมฟอนต์และสร้างรูปภาพ กรุณารอสักครู่...");

    try {
      // เตรียมฟอนต์อีกรอบก่อนแคป
      await ensureFontReady();

      // รอเพิ่มเติมให้ฟอนต์ render
      await new Promise((resolve) => setTimeout(resolve, 500));

      const scale = options.scale || 2;

      // บังคับใช้ฟอนต์ Kanit
      const originalStyle = targetRef.current.style.cssText;
      targetRef.current.style.fontFamily = "'Kanit', sans-serif";

      // เพิ่ม CSS override ชั่วคราว
      const styleOverride = document.createElement("style");
      styleOverride.id = "temp-font-override";
      styleOverride.textContent = `
        * {
          font-family: 'Kanit', sans-serif !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `;
      document.head.appendChild(styleOverride);

      const style = {
        transform: "scale(" + scale + ")",
        transformOrigin: "top left",
        width: targetRef.current.offsetWidth + "px",
        height: "auto",
        maxHeight: "none",
        overflow: "visible",
        backgroundColor: options.bgColor || "#ffffff",
        fontFamily: "'Kanit', sans-serif",
        ...options.styles,
      };

      const param = {
        height: targetRef.current.offsetHeight * scale,
        width: targetRef.current.offsetWidth * scale,
        quality: options.quality || 1,
        style,
        cacheBust: true,
        // เพิ่ม font embedding
        fontEmbedCSS: `
          @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&display=swap');
          * { 
            font-family: 'Kanit', sans-serif !important;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `,
      };

      console.log("📸 CaptureButtons: Starting image capture...");
      const blob = await domtoimage.toBlob(targetRef.current, param);

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      // เคลียร์ style override
      targetRef.current.style.cssText = originalStyle;
      const tempStyle = document.getElementById("temp-font-override");
      if (tempStyle) {
        tempStyle.remove();
      }

      console.log("✅ CaptureButtons: Image saved successfully");
      showSuccess("บันทึกภาพเรียบร้อยแล้ว");
    } catch (error) {
      console.error("💥 CaptureButtons: Image capture failed:", error);
      showError("เกิดข้อผิดพลาดในการแคปภาพ");
    } finally {
      setIsCapturing(false);
    }
  };

  // คัดลอกภาพไปยัง clipboard
  const copyToClipboard = async () => {
    if (!targetRef.current) {
      showError("ไม่พบองค์ประกอบสำหรับแคปภาพ");
      return;
    }

    setIsCapturing(true);
    showInfo("กำลังเตรียมฟอนต์และคัดลอกรูปภาพ กรุณารอสักครู่...");

    try {
      // เตรียมฟอนต์อีกรอบก่อนแคป
      await ensureFontReady();

      // รอเพิ่มเติมให้ฟอนต์ render
      await new Promise((resolve) => setTimeout(resolve, 500));

      const scale = options.scale || 2;

      // บังคับใช้ฟอนต์ Kanit
      const originalStyle = targetRef.current.style.cssText;
      targetRef.current.style.fontFamily = "'Kanit', sans-serif";

      // เพิ่ม CSS override ชั่วคราว
      const styleOverride = document.createElement("style");
      styleOverride.id = "temp-font-override-clipboard";
      styleOverride.textContent = `
        * {
          font-family: 'Kanit', sans-serif !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `;
      document.head.appendChild(styleOverride);

      const style = {
        transform: "scale(" + scale + ")",
        transformOrigin: "top left",
        width: targetRef.current.offsetWidth + "px",
        height: "auto",
        maxHeight: "none",
        overflow: "visible",
        backgroundColor: options.bgColor || "#ffffff",
        fontFamily: "'Kanit', sans-serif",
        ...options.styles,
      };

      const param = {
        height: targetRef.current.offsetHeight * scale,
        width: targetRef.current.offsetWidth * scale,
        quality: options.quality || 1,
        style,
        cacheBust: true,
        // เพิ่ม font embedding
        fontEmbedCSS: `
          @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&display=swap');
          * { 
            font-family: 'Kanit', sans-serif !important;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `,
      };

      console.log("📋 CaptureButtons: Starting clipboard capture...");
      const blob = await domtoimage.toBlob(targetRef.current, param);

      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);

      // เคลียร์ style override
      targetRef.current.style.cssText = originalStyle;
      const tempStyle = document.getElementById("temp-font-override-clipboard");
      if (tempStyle) {
        tempStyle.remove();
      }

      console.log("✅ CaptureButtons: Copied to clipboard successfully");
      showSuccess("คัดลอกรูปภาพไปยังคลิปบอร์ดแล้ว");
    } catch (error) {
      console.error("💥 CaptureButtons: Clipboard capture failed:", error);
      showError("ไม่สามารถคัดลอกไปยังคลิปบอร์ดได้");
    } finally {
      setIsCapturing(false);
    }
  };

  // เลือกฟังก์ชันหลักตาม primaryButton
  const getPrimaryFunction = () => {
    switch (primaryButton) {
      case "download":
        return captureAsImage;
      case "copy":
      default:
        return copyToClipboard;
    }
  };

  // เลือกไอคอนและข้อความหลักตาม primaryButton
  const getPrimaryContent = () => {
    if (isCapturing) {
      return (
        <>
          <Loader
            size={config.iconSize[size]}
            className={`animate-spin ${config.iconClass}`}
          />
          {config.showLabels && <span>กำลังดำเนินการ</span>}
        </>
      );
    }

    switch (primaryButton) {
      case "download":
        return (
          <>
            <Download
              size={config.iconSize[size]}
              className={config.iconClass}
            />
            {config.showLabels && <span>บันทึก</span>}
          </>
        );
      case "copy":
      default:
        return (
          <>
            <Camera size={config.iconSize[size]} className={config.iconClass} />
            {config.showLabels && <span>แคปภาพ</span>}
          </>
        );
    }
  };

  return (
    <div
      className={`flex ${
        layout === "row" ? "flex-row" : "flex-col"
      } gap-1 ${className}`}
    >
      {/* ปุ่มหลัก */}
      <button
        onClick={getPrimaryFunction()}
        disabled={isCapturing}
        className={`flex items-center justify-center rounded-md ${config.buttonSize[size]} ${config.primaryButtonStyle} ${config.hoverEffect}`}
        title={!fontReady ? "กำลังเตรียมฟอนต์..." : ""}
      >
        {getPrimaryContent()}
      </button>

      {/* ปุ่มอื่นๆ */}
      {showCopy && primaryButton !== "copy" && (
        <button
          onClick={copyToClipboard}
          disabled={isCapturing}
          className={`flex items-center justify-center rounded-md ${config.buttonSize[size]} ${config.secondaryButtonStyle} ${config.hoverEffect}`}
          title="คัดลอกไปคลิปบอร์ด"
        >
          {isCapturing ? (
            <>
              <Loader
                size={config.iconSize[size]}
                className={`animate-spin ${config.iconClass}`}
              />
              {config.showLabels && <span>กำลังดำเนินการ</span>}
            </>
          ) : (
            <>
              <Camera
                size={config.iconSize[size]}
                className={config.iconClass}
              />
              {config.showLabels && <span>คัดลอก</span>}
            </>
          )}
        </button>
      )}

      {showDownload && primaryButton !== "download" && (
        <button
          onClick={captureAsImage}
          disabled={isCapturing}
          className={`flex items-center justify-center rounded-md ${config.buttonSize[size]} ${config.secondaryButtonStyle} ${config.hoverEffect}`}
          title="บันทึกเป็นรูปภาพ"
        >
          {isCapturing ? (
            <>
              <Loader
                size={config.iconSize[size]}
                className={`animate-spin ${config.iconClass}`}
              />
              {config.showLabels && <span>กำลังดำเนินการ</span>}
            </>
          ) : (
            <>
              <Download
                size={config.iconSize[size]}
                className={config.iconClass}
              />
              {config.showLabels && <span>บันทึก</span>}
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default CaptureButtons;
