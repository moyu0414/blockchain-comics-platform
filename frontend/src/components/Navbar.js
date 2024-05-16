import React, { useState, useEffect } from "react";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import { SidebarData } from "./SidebarData";
import { IconContext } from "react-icons";
import '../App.css';

const Navbar = ({ accounts, setAccounts }) => {
  const [isMetamaskInstalled, setMetamaskInstalled] = useState(true);
  const [isConnected, setConnected] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");
  const [subMenuOpen, setSubMenuOpen] = useState(Array(SidebarData.length).fill(false));
  const [menuExpanded, setMenuExpanded] = useState(false);

  const navigate = useNavigate();

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

        navigate("/");
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
      const newState = Array(SidebarData.length).fill(false); // 先将所有子菜单关闭
      newState[index] = true; // 再打开指定的子菜单
      return newState;
    });
  };

  const handleMenuItemClick = (index, event) => {
    event.stopPropagation();
    if (SidebarData[index].subMenu) {
      event.preventDefault();
      setSubMenuOpen((prevState) => {
        const newState = [...prevState];
        newState[index] = !newState[index];
        return newState;
      });
    } else {
      navigate(SidebarData[index].path);
    }
  };

  const handleDownMenuItemClick = (index, event) =>{
    event.stopPropagation();
    navigate(SidebarData[index].path);
  }

  return (
    <>
      <IconContext.Provider value={{ color: "undefined" }}>
        <div className={`navbar ${menuExpanded ? "menu-expanded" : ""}`}>
          <nav className={menuExpanded ? "nav-menu expanded" : "nav-menu"}>
            <ul className="nav-menu-items">
            {SidebarData.map((item, index) => (
              <li key={index}
                className={`nav-item ${item.cName} ${subMenuOpen[index] ? "show-sub-menu" : ""}`}
                onMouseEnter={(event) => handleSubMenuClick(index, event)} // 修改为 onMouseEnter
                onMouseLeave={() => setSubMenuOpen((prevState) => {
                  const newState = [...prevState];
                  newState[index] = false;
                  return newState;
                })} // 添加 onMouseLeave
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
            ))}
            </ul>
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
          </nav>
        </div>
      </IconContext.Provider>
    </>
  );
};

export default Navbar;
