import React, { useState, useEffect, useRef } from "react";

/**
 * AutocompleteInput - คอมโพเนนต์สำหรับการค้นหาและเพิ่มข้อมูลใหม่
 *
 * @param {Object} props
 * @param {Array} props.options - ตัวเลือกทั้งหมดที่ใช้แสดง [{ id, value, description }]
 * @param {string} props.value - ค่าที่เลือกปัจจุบัน
 * @param {Function} props.onChange - ฟังก์ชันที่เรียกเมื่อค่าเปลี่ยน (value) => void
 * @param {string} props.placeholder - placeholder สำหรับ input
 * @param {Function} props.onAddNew - ฟังก์ชันที่เรียกเมื่อต้องการเพิ่มข้อมูลใหม่ (newValue) => Promise
 * @param {string} props.name - ชื่อของ input field
 * @param {string} props.id - id ของ input field
 */
const AutocompleteInput = ({
  options = [],
  value = "",
  onChange,
  placeholder = "",
  onAddNew,
  name,
  id,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const wrapperRef = useRef(null);

  // ตั้งค่าค่าเริ่มต้นเมื่อ value เปลี่ยน
  useEffect(() => {
    setInputValue(value);

    // หาตัวเลือกที่ตรงกับค่าปัจจุบัน
    if (value) {
      const option = options.find((opt) => opt.value === value);
      setSelectedOption(option);
    } else {
      setSelectedOption(null);
    }
  }, [value, options]);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // กรองตัวเลือกตามข้อความที่พิมพ์
  const filterOptions = (input) => {
    if (!input.trim()) {
      return options.slice(0, 10); // แสดงแค่ 10 ตัวแรกถ้าไม่มีการพิมพ์
    }

    const filtered = options.filter((option) =>
      option.value.toLowerCase().includes(input.toLowerCase())
    );

    return filtered;
  };

  const handleInputChange = (e) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);

    // กรองตัวเลือก
    const filtered = filterOptions(newInputValue);
    setFilteredOptions(filtered);

    // เปิด dropdown เมื่อมีการพิมพ์
    if (newInputValue) {
      setIsOpen(true);
    } else {
      onChange(""); // ล้างค่าเมื่อ input ว่าง
      setSelectedOption(null);
    }
  };

  const handleOptionClick = (option) => {
    setInputValue(option.value);
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  const handleAddNewClick = () => {
    // แสดง confirm dialog เพื่อแจ้งเตือนผู้ใช้
    const confirmed = window.confirm(
      "คำเตือน: การเพิ่มข้อมูล อาจทำให้ข้อมูลที่คุณกรอกในฟอร์มบางส่วนถูกรีเซ็ต\nยืนยันที่จะเพิ่มข้อมูลนี้หรือไม่?"
    );

    if (confirmed) {
      setIsAdding(true);
      setNewValue(inputValue);
    }
  };

  const handleAddNewSubmit = async () => {
    if (!newValue.trim()) return;

    setIsLoading(true);
    try {
      // เรียกใช้ฟังก์ชัน onAddNew ที่ส่งมาจาก props
      const result = await onAddNew(newValue);

      if (result) {
        // เมื่อเพิ่มสำเร็จ ตั้งค่าอินพุต
        setInputValue(result.value);
        onChange(result.value);
        setSelectedOption(result);

        // แสดงข้อความแจ้งเตือนผู้ใช้ว่าเพิ่มข้อมูลสำเร็จ
        alert(`เพิ่มข้อมูล "${result.value}" ลงใน Information เรียบร้อยแล้ว`);
      }
    } catch (error) {
      console.error("Error adding new item:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message || "ไม่สามารถเพิ่มข้อมูลได้"}`);
    } finally {
      setIsLoading(false);
      setIsAdding(false);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (isAdding) {
        handleAddNewSubmit();
      } else if (filteredOptions.length > 0) {
        handleOptionClick(filteredOptions[0]);
      } else if (inputValue && !selectedOption) {
        // เมื่อกด Enter ในสถานะปกติและไม่พบข้อมูลที่ตรงกัน
        // ไม่ควรเรียก handleAddNewClick() โดยตรงเพราะจะข้าม confirm dialog
        // แทนที่จะเปิดโหมด Add New อัตโนมัติ ควรให้ผู้ใช้คลิกที่ปุ่ม "เพิ่ม" ด้วยตนเอง
        // เพื่อให้ได้เห็น confirm dialog

        // แสดงข้อความเตือนว่าไม่พบข้อมูล และแนะนำให้คลิกปุ่มเพิ่ม
        alert(
          'ไม่พบข้อมูลที่ตรงกัน กรุณาคลิกที่ปุ่ม "เพิ่ม" เพื่อเพิ่มข้อมูลใหม่'
        );
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      if (isAdding) {
        setIsAdding(false);
      }
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {!isAdding ? (
        <div className="relative">
          <input
            type="text"
            id={id}
            name={name}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={`w-full border p-2 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${className}`}
            autoComplete="off"
          />
          {!isOpen && selectedOption && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <button
                type="button"
                onClick={() => {
                  setInputValue("");
                  setSelectedOption(null);
                  onChange("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border p-2 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="พิมพ์ข้อมูลใหม่..."
            autoFocus
          />
          <button
            type="button"
            onClick={handleAddNewSubmit}
            className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "เพิ่ม"
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      )}

      {isOpen && !isAdding && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            <ul>
              {filteredOptions.map((option) => (
                <li
                  key={option.id}
                  onClick={() => handleOptionClick(option)}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="font-medium">{option.value}</div>
                  {option.description && (
                    <div className="text-sm text-gray-500">
                      {option.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center">
              <p className="text-gray-500 mb-2">ไม่พบข้อมูลที่ตรงกัน</p>
              <button
                type="button"
                onClick={handleAddNewClick}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors inline-flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                เพิ่ม "{inputValue}"
              </button>
            </div>
          )}

          {/* ปุ่มเพิ่มข้อมูลใหม่ถ้ามีการพิมพ์ แต่ไม่ตรงกับตัวเลือกที่มีอยู่ */}
          {inputValue &&
            !filteredOptions.find(
              (opt) => opt.value.toLowerCase() === inputValue.toLowerCase()
            ) &&
            filteredOptions.length > 0 && (
              <div className="p-2 border-t">
                <button
                  type="button"
                  onClick={handleAddNewClick}
                  className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-center flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  เพิ่ม "{inputValue}"
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
