export const SidebarData = [
  {
    title: "首頁",
    path: "/",
    cName: "nav-text",
  },
  {
    title: "身分選擇",
    path: "/identity",
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
        path: "/transactionHistory",
        cName: "nav-subtext",
      },
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
        path: "/purchaseHistory",
        cName: "nav-subtext",
      },
    ],
  },
  {
    title: "廠商",
    path: "#",
    cName: "nav-text",
    subMenu: [
      {
        title: "NFT購買",
        path: "/nftPurchase",
        cName: "nav-subtext",
      },
      {
        title: "廠商書櫃",
        path: "/vendorBookshelf",
        cName: "nav-subtext",
      },
    ],
  }
];
