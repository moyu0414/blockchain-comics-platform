import React, { useState, useEffect } from "react";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom"; // 確保導入了 Link 和 useNavigate
import { SidebarData } from "./SidebarData";
import { IconContext } from "react-icons";
import '../App.css';

const Navbar = ({ accounts, setAccounts }) => {
  const [sidebar, setSidebar] = useState(false); // 確保導入了 useState
  const [isMetamaskInstalled, setMetamaskInstalled] = useState(true);
  const [isConnected, setConnected] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");
  const [subMenuOpen, setSubMenuOpen] = useState(Array(SidebarData.length).fill(false));
  const [menuExpanded, setMenuExpanded] = useState(false);

  const navigate = useNavigate(); // 確保導入了 useNavigate

  const showSidebar = () => {
    console.log("Sidebar status before:", sidebar); // 輸出點擊「Close」圖示前的側邊欄狀態
    setSidebar(!sidebar);
  };
  

  useEffect(() => {
    if (accounts.length > 0) {
      setIsLogged(true);
    }
  }, [accounts]);

  const connectAccount = async () => {
    if (isConnected === false) {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccounts(accounts);
        setCurrentAccount(accounts[0]);
        setConnected(true);
        setIsLogged(true);
        alert("登入成功!");

        navigate("/identity");
      }
    }
  };

  const showAccount = () => {
    const prefix = accounts[0].substr(0, 5);
    const suffix = accounts[0].substr(36, 40);
    return prefix + "..." + suffix;
  };

  setTimeout(() => {
    if (accounts && accounts.length > 0 && accounts[0] !== currentAccount) {
      setCurrentAccount(accounts[0]);
      console.log(accounts[0]);
    }
  }, 100);

  const handleSubMenuClick = (index, event) => {
    event.stopPropagation();
    setSubMenuOpen((prevState) => {
      const newState = [...prevState];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const handleMenuItemClick = (index, event) => {
    event.stopPropagation();
    if (SidebarData[index].subMenu) {
      // 如果有子菜單，展開子菜單，但不觸發頁面跳轉
      event.preventDefault(); // 阻止默認的頁面跳轉行為
      setSubMenuOpen((prevState) => {
        const newState = [...prevState];
        newState[index] = !newState[index];
        return newState;
      });
      setSidebar(true); // 展開側邊欄
    } else {
      // 如果沒有子菜單，關閉側邊欄並跳轉頁面
      setSidebar(false);
      navigate(SidebarData[index].path);
    }
  };

  const handleDownMenuItemClick = (index, event) =>{
    event.stopPropagation();
    setSidebar(false);
    navigate(SidebarData[index].path);
  }

  return (
    <>
      <IconContext.Provider value={{ color: "undefined" }}>
        <div className={`navbar ${menuExpanded ? "menu-expanded" : ""}`}>
          <Link to="#" className="menu-bars" onClick={() => setSidebar(true)}>
            <FaIcons.FaBars />
          </Link>
          <div className="log-in-area">
            {!isLogged && isMetamaskInstalled && (
              <button className="log-in-btn" onClick={connectAccount}>
                Log In Metamask
              </button>
            )}
            {!isMetamaskInstalled && (
              <a
                className="install-link"
                target="_blank"
                rel="noreferrer"
                href="https://metamask.io/download"
              >
                Please Install Metamask
              </a>
            )}
            {isLogged && <div className="login-account">{showAccount()}</div>}
          </div>
        </div>
        <nav className={sidebar ? "nav-menu show-sidebar" : "nav-menu hide-sidebar"}>
          <ul className="nav-menu-items" onClick={showSidebar}>
            <li className="navbar-toggle">
              <Link to="#" className="menu-bars" onClick={() => setSidebar(false)}>
                <AiIcons.AiOutlineClose />
              </Link>
            </li>
            {SidebarData.map((item, index) => (
              <div key={index}>
                <li
                  className={`sidenav ${item.cName} ${subMenuOpen[index] ? "show-sub-menu" : ""}`}
                  onClick={(event) => handleMenuItemClick(index, event)}
                >
                  <Link to={item.path}>
                    {item.icon}
                    <span>{item.title}</span>
                    {item.subMenu && <AiIcons.AiOutlineDown style={{ marginLeft: "auto", marginRight: "5px" }} />}
                  </Link>
                  {item.subMenu && subMenuOpen[index] && (
                    <ul className="dropdown-container">
                      {item.subMenu.map((subItem, subIndex) => (
                        <li key={subIndex} onClick={(event) => handleDownMenuItemClick(index, event)}>
                          <Link to={subItem.path}>{subItem.title}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              </div>
            ))}
          </ul>
        </nav>
      </IconContext.Provider>
    </>
  );
};

export default Navbar;