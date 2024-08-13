import React, { useState, useEffect } from "react";
import { Container, Carousel, Card, Col, Row, Button, Dropdown, Navbar, Nav, NavDropdown, Offcanvas } from 'react-bootstrap';
import Web3 from 'web3';
import { Link, useNavigate } from "react-router-dom";
import { SidebarData } from "./SidebarData";
import { Search, Person } from 'react-bootstrap-icons';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function Navigation() {
    const [isMetamaskInstalled, setMetamaskInstalled] = useState(true);
    const [isConnected, setConnected] = useState(false);
    const [isLogged, setIsLogged] = useState(false);
    const [currentAccount, setCurrentAccount] = useState("");
    const [subMenuOpen, setSubMenuOpen] = useState(Array(SidebarData.length).fill(false));
    const [menuExpanded, setMenuExpanded] = useState(false);
    const [ethBalance, setEthBalance] = useState('');
    const [account, setAccount] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [expanded, setExpanded] = useState(false); // 状态用于控制菜单展开或折叠
    const headers = {'api-key': API_KEY};

    const navigate = useNavigate();

    useEffect(() => {
        if (accounts.length > 0) {
            //setIsLogged(true);
            loadAccountBalance(accounts[0]);
        }
    }, [accounts]);

    const loadAccountBalance = async (account) => {
        try {
            const provider = detectCurrentProvider();
            if (provider) {
                const web3 = new Web3(provider);
                const balance = await web3.eth.getBalance(account);
                setEthBalance(parseFloat(web3.utils.fromWei(balance, 'ether')).toFixed(3));
            }
        } catch (error) {
            console.error('錯誤:', error);
        }
    };

    const connectAccount = async () => {
        if (isConnected === false) {
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({
                        method: "eth_requestAccounts",
                    });
                    setAccounts(accounts);
                    setAccount(accounts[0]);
                    setCurrentAccount(accounts[0]);
                    setConnected(true);
                    setIsLogged(true);
                    try {
                        const response = await axios.post(`${website}/api/add/user`, {
                            address: accounts[0]
                        }, {
                            headers: headers
                        });
                        console.log(response.data);
                        localStorage.setItem("loggedIn", "true");
                        localStorage.setItem("currentAccount", accounts[0]);
                        alert("登入成功!");
                        navigate("/");
                        loadAccountBalance(accounts[0]);
                    } catch (error) {
                        console.error('Error fetching records:', error);
                    }
                } catch (error) {
                    console.error('錯誤:', error);
                }
            } else {
                detectCurrentProvider();
            }
        }
    };

    const showAccount = () => {
        if (isLogged && account) {
            const prefix = account.substr(0, 5);
            const suffix = account.substr(36, 40);
            return prefix + "..." + suffix;
        }
        return "尚未登入";
    };

    const handleSubMenuClick = (index, event) => {
        event.stopPropagation();
        setSubMenuOpen((prevState) => {
            const newState = Array(SidebarData.length).fill(false);
            newState[index] = true;
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
                    try {
                        const response = await axios.post(`${website}/api/add/user`, {
                            address: newAccount
                        }, {
                            headers: headers
                        });
                        setAccount(newAccount);
                        localStorage.setItem("currentAccount", newAccount);
                        const balance = await web3.eth.getBalance(newAccount);
                        setEthBalance(parseFloat(web3.utils.fromWei(balance, 'ether')).toFixed(3));
                        setIsLogged(true);
                        window.location.reload();
                    } catch (error) {
                        console.error('Error fetching records:', error);
                    }
                } else {
                    setIsLogged(false);
                }
            }
        } catch (error) {
            console.error('錯誤:', error);
        }
    };

    useEffect(() => {
        const checkLoginStatus = async () => {
          let loggedIn = localStorage.getItem("loggedIn");
          const currentAccount = localStorage.getItem("currentAccount");
          if (window.ethereum) {
            const web3 = new Web3(window.ethereum);
            const accounts = await web3.eth.getAccounts();
            const account = accounts[0];
            if (!account) {
                loggedIn = "false";
                localStorage.setItem("loggedIn", "false");
                localStorage.removeItem("currentAccount");
            }
          }
          if (loggedIn === "true" && currentAccount) {
            setIsLogged(true);
            setAccount(currentAccount);
            setCurrentAccount(currentAccount);
            setConnected(true);
            loadAccountBalance(currentAccount);
          }
        };
        checkLoginStatus();
    }, []);

    const detectCurrentProvider = () => {
        let provider;
        if (window.ethereum) {
            provider = window.ethereum;
        } else if (window.web3) {
            provider = window.web3.currentProvider;
        } else {
            console.log("偵測到非以太坊瀏覽器。請安裝 MetaMask 或其他支援的錢包");
            alert("偵測到非以太坊瀏覽器。請安裝 MetaMask 或其他支援的錢包");
        }
        return provider;
    };

    return (
        <>
        {['xxl'].map((expand) => (
            <Container fluid className="navigation">
                <Row key={expand} className="d-flex justify-content-center align-items-center">
                    <Navbar expand={expand}>
                        <Navbar.Toggle onClick={() => setExpanded(!expanded)} aria-controls="offcanvas-navbar" />
                        <Navbar.Brand href="#">
                            <img
                                className="d-inline-block align-top"
                                src="/icon.png"
                                alt="icon"
                            />
                        </Navbar.Brand>
                        
                        <Navbar.Offcanvas
                            id={`offcanvasNavbar-expand-${expand}`}
                            aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
                            placement="start"
                            className="d-flex flex-column"
                        >
                            <Offcanvas.Header closeButton>
                                <Offcanvas.Title id={`offcanvasNavbarLabel-expand-${expand}`}>
                                    <img
                                        className="d-inline-block align-top"
                                        src="/icon.png"
                                        alt="icon"
                                    />
                                </Offcanvas.Title>
                            </Offcanvas.Header>
                            <div className="d-flex flex-grow-1">
                                <Offcanvas.Body className="flex-grow-1">
                                    <Nav className="me-auto">
                                        <Nav.Link href="/creatorPage">創作者專區</Nav.Link>
                                        <Nav.Link href="/readerPage">讀者專區</Nav.Link>
                                    </Nav>
                                    {/* 登入區塊 */}
                                    <div className={`log-in-area ${expanded ? 'vertical-layout' : 'horizontal-layout'}`}>
                                        {!isLogged && isMetamaskInstalled && (
                                            <Button className="log-in-btn" onClick={connectAccount}>
                                                <Person className="me-2" size={28} />
                                                登入
                                            </Button>
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
                                            <div className="d-flex align-items-center justify-content-end login">
                                                <div className="show-account">{showAccount()}</div>
                                                <div className="eth-balance">餘額: {ethBalance} SepoliaETH</div>
                                                <Button className="reload-btn" onClick={reloadAccount}>
                                                    切換帳號
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {/* 登入區塊結束 */}
                                </Offcanvas.Body>
                                
                            </div>
                        </Navbar.Offcanvas>
                        <Link to={"/searchPage"}>
                            <Search className="search-icon ms-3" size={30} />
                        </Link>
                    </Navbar>
                </Row>
            </Container>
        ))}
        </>
    );
}

export default Navigation;
