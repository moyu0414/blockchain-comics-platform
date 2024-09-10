import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Col, Row, Button, Figure } from 'react-bootstrap';
import './bootstrap.min.css';
import { Funnel, Book, Heart, FileEarmarkText, Envelope, CardImage, VectorPen } from 'react-bootstrap-icons';
import { initializeWeb3 } from '../index';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const CustomToggle = React.forwardRef(({ onClick }, ref) => (
    <div
        ref={ref}
        onClick={(e) => {
            e.preventDefault();
            onClick(e);
        }}
        style={{ cursor: 'pointer' }}
    >
        <Funnel size={36} />
    </div>
));


function ReaderPage() {
    const { t } = useTranslation();
    const [isButtonEnabled, setIsButtonEnabled] = useState(false);
    const [isCreator, setIsCreator] = useState(false);
    const [currentAccount, setCurrentAccount] = useState(false);
    const [ethBalance, setEthBalance] = useState('');
    const headers = {'api-key': API_KEY};

    useEffect(() => {
        const checkAccount = async () => {
            const web3 = await initializeWeb3(t);
            if (web3) {
                const accounts = await web3.eth.getAccounts();
                if (accounts[0]) {
                    let account = accounts[0].toLowerCase();
                    try {
                        const response = await axios.get(`${website}/api/isCreator`, {
                            headers: headers,
                            params: {
                                currentAccount: account
                            }
                        });
                        if (response.data[0].is_creator === 1) {
                            setIsCreator(true);
                        }
                        const balance = await web3.eth.getBalance(account);
                        setEthBalance(parseFloat(web3.utils.fromWei(balance, 'ether')).toFixed(3));
                        setCurrentAccount(account);
                        setIsButtonEnabled(true);
                    } catch (error) {
                        console.error('Error fetching isCreator:', error);
                    }
                } else {
                    alert(t('請先登入以太坊錢包，才開放讀者專區'));
                }
            }
        };
        checkAccount();
    }, []);

    const buttonData = [
        { label: t('我的書櫃'), icon: <Book /> },
        { label: t('我的購買'), icon: <FileEarmarkText /> },
        { label: t('漫畫收藏'), icon: <Heart /> },
        { label: t('NFT收藏'), icon: <CardImage /> },
        { label: t('我的訊息'), icon: <Envelope /> },
        { label: t('成為作家'), icon: <VectorPen /> }
    ];

    const pathMap = {
        [t('我的書櫃')]: '/bookcase',
        [t('我的購買')]: '/purchaseHistory',
        [t('漫畫收藏')]: '/collectionPage',
        [t('NFT收藏')]: '/collectionNft',
        [t('我的訊息')]: '/messagePage',
    };
    
    const becomeWriter = {
        pathMap: '/becomeWriter'
    };

    return (
        <Container className='readerPage'>
            <Row className="pt-5">
                <Figure>
                    <Figure.Image
                        className="d-block mx-auto img-fluid rounded-circle"
                        alt="400x400"
                        src="https://via.placeholder.com/200x200?text=Banner Image"
                    />
                </Figure>
            </Row>
            <h3><center>{t('讀者專區')}</center></h3>

            {isButtonEnabled && (
                <div><center>
                    <h4 className="display-account">{currentAccount}</h4>
                    <h5 className="display-ethBalance">{ethBalance} SepoliaETH</h5>
                </center></div>
            )}
            <Row className="pt-4 pb-3 btn-container justify-content-center">
                {buttonData.map((item, idx) => (
                    <Col key={idx} xs={6} sm={6} md={2} lg={1} className="pb-3 btn-section">
                        <Link
                            to={
                                item.label === t('成為作家')
                                    ? (!isCreator && isButtonEnabled ? becomeWriter.pathMap : '#')
                                    : (isButtonEnabled ? pathMap[item.label] : '#')
                            }
                            className="d-flex justify-content-center"
                        >
                            <Button
                                variant={
                                    item.label === t('成為作家')
                                        ? (isButtonEnabled
                                            ? (isCreator ? "outline-secondary" : "outline-dark")
                                            : "outline-secondary")
                                        : (isButtonEnabled ? "outline-dark" : "outline-secondary")
                                }
                                className="custom-button"
                                disabled={
                                    item.label === t('成為作家')
                                        ? (isButtonEnabled ? isCreator : true)
                                        : !isButtonEnabled
                                }
                            >
                                <div className="icon-label">
                                    {item.icon}
                                    <span>{item.label}</span>
                                </div>
                            </Button>
                        </Link>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}

export default ReaderPage;
