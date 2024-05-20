import React, { useState, useEffect } from "react";
import Web3 from 'web3';
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
  const [ethBalance, setEthBalance] = useState('');
  const [account, setAccount] = useState('');

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
        setAccount(accounts[0]);
        setCurrentAccount(accounts[0]);
        setConnected(true);
        setIsLogged(true);
        // 存储登录信息到本地存储
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("currentAccount", accounts[0]);
        alert("登入成功!");
        navigate("/");
      }
    }
  };

  const showAccount = () => {
    if (isLogged && account) { // 確保已登入並有帳戶資訊
      const prefix = account.substr(0, 5);
      const suffix = account.substr(36, 40);
      return prefix + "..." + suffix;
    }
    return "No account";
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

  const reloadAccount = async () => {
    try {
      const provider = detectCurrentProvider();
      if (provider) {
        await provider.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          const web3 = new Web3(provider);
          const newAccount = accounts[0];
          console.log('切換後的帳戶: ' + newAccount);
          setAccount(newAccount);
          const balance = await web3.eth.getBalance(newAccount);
          setEthBalance(web3.utils.fromWei(balance, 'ether'));
          setIsLogged(true);
          // 刷新页面
          window.location.reload();
        } else {
          setIsLogged(false);
        }
      }
    } catch (error) {
      console.error('錯誤:', error);
    }
  };
  

  useEffect(() => {
    // 检查本地存储中是否存在登录信息
    const loggedIn = localStorage.getItem("loggedIn");
    const currentAccount = localStorage.getItem("currentAccount");
    if (loggedIn === "true" && currentAccount) {
      setIsLogged(true);
      setAccount(currentAccount);
      setCurrentAccount(currentAccount);
      setConnected(true);
    }
  }, []);

  const detectCurrentProvider = () => {
    let provider;
    if (window.ethereum) {
      provider = window.ethereum;
    } else if (window.web3) {
      provider = window.web3.currentProvider;
    } else {
      console.log("偵測到非以太坊瀏覽器。請安裝 MetaMask 或其他支援的錢包");
    }
    return provider;
  };

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
                  登入
                </button>
              )}
              {!isMetamaskInstalled && (
                <a
                  className="install-link"
                  target="_blank"
                  rel="noreferrer"
                  href="https://metamask.io/download"
                >
                  請安裝Metamask
                </a>
              )}
              {isLogged && (
                <div className="log-in-area">
                  <div className="show-account">{showAccount()}</div>
                  <button className="reload-btn" onClick={reloadAccount}>
                    切換帳號
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </IconContext.Provider>
    </>
  );
};

export default Navbar;
