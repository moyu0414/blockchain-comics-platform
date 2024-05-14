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
      }
    ],
  }
];

