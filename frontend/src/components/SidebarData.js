import React from "react";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import * as IoIcons from "react-icons/io";

export const SidebarData = [
  {
    title: "首頁",
    path: "/",
    cName: "nav-text",
  },
  {
    title: "創作者",
    path: "#", 
    cName: "nav-text",
    subMenu: [
      {
        title: "作品管理",
        path: "/creator",
        cName: "nav-subtext",
      },
      {
        title: "交易紀錄",
        path: "transactionHistory",
        cName: "nav-subtext",
      }
    ],
  },
  {
    title: "讀者",
    path: "#",
    cName: "nav-text",
    subMenu: [
      {
        title: "個人書櫃",
        path: "/reader",
        cName: "nav-subtext",
      },
      {
        title: "購買紀錄",
        path: "purchaseHistory",
        cName: "nav-subtext",
      }
    ],
  },
  {
    title: "管理者",
    path: "comicManagement",
    cName: "nav-text"
    // subMenu: [
    //   {
    //     title: "帳號管理",
    //     path: "accountManagement",
    //     cName: "nav-subtext",
    //   },
    //   {
    //     title: "漫畫管理",
    //     path: "comicManagement",
    //     cName: "nav-subtext",
    //   }
    // ],
  }
];

