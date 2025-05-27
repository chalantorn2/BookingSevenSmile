// src/components/common/CaptureWrapper.jsx

import React, { useRef, useState, useEffect } from "react";
import { Camera, Download, Copy, Loader } from "lucide-react";
import {
  captureToImage,
  captureToClipboard,
  captureToDataURL,
} from "../../services/captureService";
import { useNotification } from "../../hooks/useNotification";

/**
 * CaptureWrapper - คอมโพเนนต์ห่อหุ้มเนื้อหาที่ต้องการแคปภาพ
 * ปรับปรุงการจัดการ Font Loading ให้ดีขึ้น
 */
const CaptureWrapper = ({
  children,
  filename = "captured-image",
  options = {},
  showPreview = false,
  className = "",
  showButtons = true,
  buttonPosition = "top-right",
  onCapture = null,
}) => {
  const { showSuccess, showError, showInfo } = useNotification();
  const captureRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontLoadAttempts, setFontLoadAttempts] = useState(0);

  // ปรับปรุงการตรวจสอบและโหลด Font
  useEffect(() => {
    const loadFontsAdvanced = async () => {
      console.log("🔍 CaptureWrapper: Starting advanced font loading...");

      try {
        // เพิ่ม font link ถ้ายังไม่มี
        if (!document.getElementById("kanit-font")) {
          console.log("📥 CaptureWrapper: Adding Kanit font link...");
          const link = document.createElement("link");
          link.id = "kanit-font";
          link.rel = "stylesheet";
          link.href =
            "https://fonts.googleapis.com/css2?family=Kanit:wght@400;700&display=swap";
          document.head.appendChild(link);
        }

        // เพิ่ม preload hints หลายตัว
        if (!document.getElementById("kanit-preload-400")) {
          console.log(
            "🚀 CaptureWrapper: Adding comprehensive font preload hints..."
          );
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

        // Force load fonts ในหลายขนาดและน้ำหนัก
        if (document.fonts && document.fonts.load) {
          console.log("⏳ CaptureWrapper: Force loading fonts...");
          const fontPromises = [
            document.fonts.load("400 12px 'Kanit'"),
            document.fonts.load("400 16px 'Kanit'"),
            document.fonts.load("400 20px 'Kanit'"),
            document.fonts.load("700 12px 'Kanit'"),
            document.fonts.load("700 16px 'Kanit'"),
            document.fonts.load("700 20px 'Kanit'"),
          ];

          // รอ font load promises (timeout 5 วินาที)
          await Promise.race([
            Promise.all(fontPromises),
            new Promise((resolve) => setTimeout(resolve, 5000)),
          ]);
        }

        // รอ document.fonts.ready
        if (document.fonts && document.fonts.ready) {
          console.log("⏳ CaptureWrapper: Waiting for document.fonts.ready...");
          await Promise.race([
            document.fonts.ready,
            new Promise((resolve) => setTimeout(resolve, 3000)),
          ]);
        }

        // ตรวจสอบว่าฟอนต์โหลดจริงแล้วหรือไม่
        let fontCheckResults = [];
        if (document.fonts && document.fonts.check) {
          fontCheckResults = [
            document.fonts.check("400 16px 'Kanit'"),
            document.fonts.check("700 16px 'Kanit'"),
          ];
          console.log(
            "📊 CaptureWrapper: Font check results:",
            fontCheckResults
          );
        }

        const allFontsLoaded = fontCheckResults.every(Boolean);

        if (allFontsLoaded) {
          console.log("✅ CaptureWrapper: All fonts loaded successfully");
          setFontsLoaded(true);
          setFontLoadAttempts(1);

          // รอเพิ่มเติมเพื่อให้ฟอนต์ render
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else {
          console.warn(
            "⚠️ CaptureWrapper: Some fonts not loaded, waiting additional time..."
          );

          // รอเพิ่มเติมแล้วลองตรวจสอบอีกรอบ
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const secondCheck =
            document.fonts && document.fonts.check
              ? document.fonts.check("400 16px 'Kanit'")
              : true; // fallback ให้ผ่านไปก่อน

          console.log("📊 CaptureWrapper: Second font check:", secondCheck);
          setFontsLoaded(true); // ให้ทำงานต่อไปแม้ฟอนต์ไม่โหลด
          setFontLoadAttempts(2);
        }
      } catch (error) {
        console.error("💥 CaptureWrapper: Font loading error:", error);
        // ถ้าเกิด error ให้รอแล้วทำงานต่อไป
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setFontsLoaded(true);
        setFontLoadAttempts(3);
      }
    };

    loadFontsAdvanced();
  }, []);

  // แคปเป็นไฟล์รูปภาพ
  const handleCaptureImage = async () => {
    if (!captureRef.current) {
      showError("ไม่พบองค์ประกอบสำหรับแคปภาพ");
      return;
    }

    if (!fontsLoaded) {
      showInfo("กำลังเตรียมฟอนต์... กรุณารอสักครู่");
      // รอเพิ่มเติมถ้าฟอนต์ยังไม่โหลด
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsCapturing(true);
    showInfo("กำลังเตรียมฟอนต์และสร้างรูปภาพ กรุณารอสักครู่...");

    try {
      // เตรียมฟอนต์อีกรอบก่อนแคป
      if (document.fonts && document.fonts.load) {
        await Promise.all([
          document.fonts.load("400 16px 'Kanit'"),
          document.fonts.load("700 16px 'Kanit'"),
        ]);
      }

      // รอเพิ่มเติมให้ฟอนต์ render
      await new Promise((resolve) => setTimeout(resolve, 500));

      await captureToImage(captureRef.current, filename, {
        ...options,
        fontFamily: "Kanit",
      });
      showSuccess("บันทึกรูปภาพสำเร็จ");

      if (onCapture) {
        onCapture({ type: "image", success: true });
      }
    } catch (error) {
      showError(`เกิดข้อผิดพลาดในการบันทึกรูปภาพ: ${error.message}`);

      if (onCapture) {
        onCapture({ type: "image", success: false, error });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // แคปและคัดลอกไปยังคลิปบอร์ด
  const handleCaptureClipboard = async () => {
    if (!captureRef.current) {
      showError("ไม่พบองค์ประกอบสำหรับแคปภาพ");
      return;
    }

    if (!fontsLoaded) {
      showInfo("กำลังเตรียมฟอนต์... กรุณารอสักครู่");
      // รอเพิ่มเติมถ้าฟอนต์ยังไม่โหลด
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsCapturing(true);
    showInfo("กำลังเตรียมฟอนต์และคัดลอกรูปภาพ กรุณารอสักครู่...");

    try {
      // เตรียมฟอนต์อีกรอบก่อนแคป
      if (document.fonts && document.fonts.load) {
        await Promise.all([
          document.fonts.load("400 16px 'Kanit'"),
          document.fonts.load("700 16px 'Kanit'"),
        ]);
      }

      // รอเพิ่มเติมให้ฟอนต์ render
      await new Promise((resolve) => setTimeout(resolve, 500));

      await captureToClipboard(captureRef.current, {
        ...options,
        fontFamily: "Kanit",
      });
      showSuccess("คัดลอกรูปภาพไปยังคลิปบอร์ดแล้ว");

      if (onCapture) {
        onCapture({ type: "clipboard", success: true });
      }
    } catch (error) {
      showError(`เกิดข้อผิดพลาดในการคัดลอกรูปภาพ: ${error.message}`);

      if (onCapture) {
        onCapture({ type: "clipboard", success: false, error });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // สร้างตัวอย่างรูปภาพ
  const handlePreview = async () => {
    if (!captureRef.current) {
      showError("ไม่พบองค์ประกอบสำหรับแคปภาพ");
      return;
    }

    if (!fontsLoaded) {
      showInfo("กำลังเตรียมฟอนต์... กรุณารอสักครู่");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsCapturing(true);

    try {
      // เตรียมฟอนต์อีกรอบก่อนแคป
      if (document.fonts && document.fonts.load) {
        await Promise.all([
          document.fonts.load("400 16px 'Kanit'"),
          document.fonts.load("700 16px 'Kanit'"),
        ]);
      }

      const dataUrl = await captureToDataURL(captureRef.current, {
        ...options,
        fontFamily: "Kanit",
      });
      setPreviewUrl(dataUrl);

      if (onCapture) {
        onCapture({ type: "preview", success: true, dataUrl });
      }
    } catch (error) {
      showError(`เกิดข้อผิดพลาดในการสร้างตัวอย่าง: ${error.message}`);

      if (onCapture) {
        onCapture({ type: "preview", success: false, error });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // ปิดตัวอย่าง
  const closePreview = () => {
    setPreviewUrl(null);
  };

  // กำหนดตำแหน่งของปุ่ม
  const getButtonPositionClass = () => {
    switch (buttonPosition) {
      case "top-left":
        return "top-2 left-2";
      case "top-right":
        return "top-2 right-2";
      case "bottom-left":
        return "bottom-2 left-2";
      case "bottom-right":
        return "bottom-2 right-2";
      default:
        return "top-2 right-2";
    }
  };

  // สร้างปุ่มควบคุม
  const renderButtons = () => {
    if (!showButtons) return null;

    return (
      <div
        className={`absolute ${getButtonPositionClass()} flex gap-2 p-1 bg-gray-100 bg-opacity-80 rounded-md shadow print:hidden`}
      >
        {showPreview && (
          <button
            onClick={handlePreview}
            disabled={isCapturing}
            className="p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
            title={!fontsLoaded ? "กำลังเตรียมฟอนต์..." : "แสดงตัวอย่าง"}
          >
            <Camera size={18} />
          </button>
        )}
        <button
          onClick={handleCaptureImage}
          disabled={isCapturing}
          className="p-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
          title={!fontsLoaded ? "กำลังเตรียมฟอนต์..." : "บันทึกเป็นรูปภาพ"}
        >
          <Download size={18} />
        </button>
        <button
          onClick={handleCaptureClipboard}
          disabled={isCapturing}
          className="p-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors disabled:opacity-50"
          title={!fontsLoaded ? "กำลังเตรียมฟอนต์..." : "คัดลอกไปยังคลิปบอร์ด"}
        >
          <Copy size={18} />
        </button>
      </div>
    );
  };

  // แสดงตัวอย่างรูปภาพ
  const renderPreview = () => {
    if (!previewUrl) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="bg-gray-100 px-4 py-2 flex justify-between items-center">
            <h3 className="font-medium">ตัวอย่างรูปภาพ</h3>
            <button
              onClick={closePreview}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
          <div className="p-4 overflow-auto flex-1">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full h-auto mx-auto"
            />
          </div>
          <div className="border-t p-3 flex justify-end gap-2">
            <button
              onClick={closePreview}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              ปิด
            </button>
            <button
              onClick={handleCaptureImage}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
            >
              <Download size={16} className="mr-1" />
              บันทึกรูปภาพ
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* แสดงตัวโหลดเมื่อกำลังแคป */}
      {isCapturing && (
        <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <Loader size={40} className="animate-spin text-blue-500" />
            <p className="mt-2 text-blue-600 font-medium">
              กำลังเตรียมฟอนต์และสร้างรูปภาพ...
            </p>
            {fontLoadAttempts > 0 && (
              <p className="text-xs text-gray-500">
                ความพยายาม: {fontLoadAttempts}/3
              </p>
            )}
          </div>
        </div>
      )}

      {/* แสดงปุ่มควบคุม */}
      {renderButtons()}

      {/* แสดงตัวอย่าง */}
      {renderPreview()}

      {/* เนื้อหาที่ต้องการแคป */}
      <div
        ref={captureRef}
        className="capture-content"
        style={{
          fontFamily: "Kanit, sans-serif",
          ...options.contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default CaptureWrapper;
