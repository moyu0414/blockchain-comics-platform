import React, { useState, useEffect } from "react";
import { Container, Carousel, Card, Col, Row, Button, Dropdown, Navbar, Nav, Offcanvas } from 'react-bootstrap';
import Web3 from 'web3';
import { Link, useNavigate } from "react-router-dom";
import { SidebarData } from "./SidebarData";
import { Search, Person, Translate } from 'react-bootstrap-icons';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import '../i18n';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const CustomToggle = React.forwardRef(({ onClick }, ref) => (
    <div
        ref={ref}
        onClick={(e) => {
            e.preventDefault();
            onClick(e);
        }}
        style={{ cursor: 'pointer', color: 'green' }}
        className="translate-icon"
    >
        <Translate size={32} />
    </div>
));

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
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const { t, i18n } = useTranslation();
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
                        alert(t('登入成功'));
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
            alert(t('非以太坊瀏覽器'));
            setMetamaskInstalled(false);
        }
        return provider;
    };

    const handleAdminClick = async () => {
        try {
            const response = await axios.get(`${website}/api/comicManagement/isAdmin`, {
                headers: headers,
                params: {
                    currentAccount: currentAccount
                }
            });
            if (response.data.exists === true) {
                navigate('/comicManagement');
            } else {
                alert(t('您並非管理者'));
                return;
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const storedLang = localStorage.getItem('language');
        if (storedLang) {
            i18n.changeLanguage(storedLang);
        }
    }, [i18n]);

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('language', lang);
    };


    return (
        <>
        {['xxl'].map((expand, index) => (
            <Container fluid key={index} className="navigation">
                <Row key={expand}>
                    <Navbar expand={expand}>
                        <Navbar.Toggle onClick={() => setExpanded(!expanded)} aria-controls="offcanvas-navbar" />
                        <Link to="/">
                            <img
                                className="d-inline-block align-top nav-icon"
                                src="/icon.png"
                                alt="icon"
                            />
                        </Link>
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
                                    <Nav className="me-auto nav-link-section">
                                        <Nav.Link href="/rankingList">{t('排行榜')}</Nav.Link>
                                        <Nav.Link href="/creatorPage">{t('創作者專區')}</Nav.Link>
                                        <Nav.Link href="/readerPage">{t('讀者專區')}</Nav.Link>
                                        <Nav.Link onClick={handleAdminClick}>{t('管理者專區')}</Nav.Link>
                                    </Nav>
                                    {/* 登入區塊 */}
                                    <div className={`log-in-area ${expanded ? 'vertical-layout' : 'horizontal-layout'}`}>
                                        {!isLogged && isMetamaskInstalled && (
                                            <Button className="log-in-btn" onClick={connectAccount}>
                                                <Person className="me-2" size={28} />
                                                {t('登入')}
                                            </Button>
                                        )}
                                        {!isMetamaskInstalled && (
                                            <a
                                                className="install-link"
                                                target="_blank"
                                                rel="noreferrer"
                                                href="https://metamask.io/download"
                                            >
                                                {t('請安裝MetaMask')}
                                            </a>
                                        )}
                                        {isLogged && (
                                            <div className="d-flex align-items-center justify-content-end login">
                                                <div className="show-account">{showAccount()}</div>
                                                <div className="eth-balance">{t('餘額')}: {ethBalance} SepoliaETH</div>
                                                <Button className="reload-btn" onClick={reloadAccount}>
                                                    {t('切換帳號')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {/* 登入區塊結束 */}
                                </Offcanvas.Body>
                                
                            </div>
                        </Navbar.Offcanvas>

                        <Link to={"/searchPage"}>
                            <Search className="search-icon" size={30} />
                        </Link>

                        <Dropdown drop="start">
                            <Dropdown.Toggle as={CustomToggle} />
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => changeLanguage('zh')}>繁體中文</Dropdown.Item>
                                <Dropdown.Item onClick={() => changeLanguage('en')}>English</Dropdown.Item>
                                <Dropdown.Item onClick={() => changeLanguage('ja')}>日語</Dropdown.Item>
                                <Dropdown.Item onClick={() => changeLanguage('ko')}>한국어</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Navbar>
                </Row>
            </Container>
        ))}
        </>
    );
}

export default Navigation;
