/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
  // เพิ่ม variants สำหรับการพิมพ์
  variants: {
    extend: {
      display: ["print"],
    },
  },
  // เพิ่ม media queries สำหรับการพิมพ์
  corePlugins: {
    // ...
  },
  // กำหนด media queries ใหม่สำหรับ print
  future: {
    purgeLayersByDefault: true,
  },
  // เพิ่ม modifiers สำหรับการพิมพ์
  modifiers: {
    print: "@media print",
  },
};
