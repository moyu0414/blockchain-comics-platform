import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // 導入 Link 元件
import './bootstrap.min.css';
import './googleapis.css';

const Identity = ({ isLogged }) => {
  // Your state variables here

  useEffect(() => {
    console.log("isLogged changed:", isLogged);
    if (isLogged) {
      // 如果已登錄，則執行首頁相關的邏輯
      // 這裡可以放置你希望在用戶登錄後顯示的任何內容或邏輯
    }
  }, [isLogged]);

  console.log("isLogged in Home:", isLogged);

  return (
    <div className="app">
        <div className="button-container">
          <Link to="/reader" className="custom-button" style={{ backgroundColor: "#F9DBBD" }}>讀者身分</Link> {/* 使用 Link 將按鈕連接到 /reader 路徑 */}
          <Link to="/creator" className="custom-button" style={{ backgroundColor: "#E3D5CA" }}>創作者身分</Link> {/* 使用 Link 將按鈕連接到 /creator 路徑 */}
          <Link to="/dual" className="custom-button" style={{ backgroundColor: "#D5BDAF" }}>雙重身分</Link> {/* 使用 Link 將按鈕連接到 /dual 路徑 */}
        </div>
    </div>
  );
};

export default Identity;
