import React, { useState, useEffect } from "react";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom"; // 修改为 useNavigate
import { SidebarData } from "./SidebarData";
import "../App.css";
import { IconContext } from "react-icons";

const Navbar = ({ accounts, setAccounts }) => {
  const [sidebar, setSidebar] = useState(false);
  const [isMetamaskInstalled, setMetamaskInstalled] = useState(true);
  const [isConnected, setConnected] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");
  const [isMenuDisplayed, setMenuDisplayed] = useState(false);


  const navigate = useNavigate(); // 修改为 useNavigate

  const showSidebar = () => setSidebar(!sidebar);
  const changeMenuDisplay = () => setMenuDisplayed(!isMenuDisplayed);

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

        // 登入成功後進行頁面切換
        navigate("/identity"); // 切換到 identity 頁面
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



  return (
    <>
      <IconContext.Provider value={{ color: "undefined" }}>
        <div className="navbar">
          <Link to="#" className="menu-bars">
            <FaIcons.FaBars onClick={showSidebar} />
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
        <nav className={sidebar ? "nav-menu active" : "nav-menu"}>
          <ul className="nav-menu-items" onClick={showSidebar}>
            <li className="navbar-toggle">
              <Link to="#" className="menu-bars">
                <AiIcons.AiOutlineClose />
              </Link>
            </li>
            {SidebarData.map((item, index) => {
              return (
                <li key={index} className={item.cName}>
                  <Link to={item.path}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </IconContext.Provider>
    </>
  );
};

export default Navbar;
