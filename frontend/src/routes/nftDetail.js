import React, { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import { Container, Carousel, Card, Col, Row, ListGroup, Button } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import { message } from 'antd';
import { initializeWeb3, disableAllButtons, enableAllButtons } from '../index';
import comicData from '../contracts/ComicPlatform.json';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function NftDetail() {
    const [NFT, setNFT] = useState([]);
    const [IP, setIP] = useState([]);
    const [initPrice, setInitPrice] = useState('');
    const { tokenId } = useParams();
    const [loading, setLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState('');
    const { t } = useTranslation();
    const currentAccount = localStorage.getItem("currentAccount");
    const headers = {'api-key': API_KEY};
    const buttonData = [
        `${NFT[0]?.price}`, t('收藏')
    ];
    let records = [];
    let temp = [];
    let imageUrl = '';

    const initData = async () => {
        const response = await axios.get(`${website}/api/nftDetail/records`, {
            headers: headers,
            params: {
                tokenId: tokenId.replace("tokenId", "")
            }
        });
        let nftData = response.data;
        setInitPrice(nftData[0].price);

        if (nftData.length !== 0 && nftData[0].is_exist === 0) {
            const { minter: initialMinter, owner: initialOwner, price, forSale, protoFilename, comicHash, tokenId: token } = nftData[0];
            const currentState = initialMinter === initialOwner ? t('原創授權') : t('二次轉售');
            const currentOwner = initialOwner === currentAccount ? t('您擁有此NFT') : initialOwner;
            const currentMinter = initialMinter === currentAccount ? t('您是本作品的創作者') : initialMinter;
            try {
            const nftImgResponse = await axios.get(`${website}/api/nftIMG/${comicHash}/${token}`, {
                responseType: 'blob',
                headers,
            });
            if (nftImgResponse.data.type === 'image/jpeg') {
                imageUrl = URL.createObjectURL(nftImgResponse.data);
            } else {
                const imageUrlPath = protoFilename === 1
                ? `${website}/api/coverFile/${comicHash}`
                : `${website}/api/comicIMG/${comicHash}`;
                const coverImgResponse = await axios.get(imageUrlPath, { responseType: 'blob', headers });
                imageUrl = URL.createObjectURL(coverImgResponse.data);
            }
            } catch (error) {
            console.error('Error fetching image:', error);
            }
            const lastPriceValue = Object.values(price).pop();
            const newData = nftData.map(data => ({
            ...data,
            price: lastPriceValue,
            minter: currentMinter,
            owner: currentOwner,
            state: currentState,
            image: imageUrl
            }));
            setNFT(newData);
            const authorizations = parseAuthorizations(newData[0].description);
            setIP(authorizations);

            try {
                const response = await axios.get(`${website}/api/nftDetail/isFavorited`, {
                    headers: headers,
                    params: {
                        currentAccount: currentAccount,
                        comicHash: comicHash
                    }
                });
                if (Array.isArray(response.data.value) && response.data.value.includes(tokenId)) {
                    setIsFavorited(response.data.isFavorited);
                }
            } catch (error) {
                console.error('Error fetching records:', error);
            }
            setLoading(false);
        } else {
            const newData = nftData.map(data => ({
                ...data,
                price: t('禁售'),
                minter: data.minter === currentAccount ? t('您是本作品的創作者') : data.minter,
                owner: data.owner === currentAccount ? t('您擁有此NFT') : data.owner,
                tips: data.is_exist === 2 ? t('此為盜版漫畫所衍生的NFT，不予販售、使用') : t('此NFT的漫畫查核中，暫不開放，敬請見諒')
            }));
            setNFT(newData);
            const authorizations = parseAuthorizations(newData[0].description);
            setIP(authorizations);
            setLoading(false);
        }
    };

    useEffect(() => {
        initData();
    }, [currentAccount]);

    const handleFavoriteClick = async () => {
        const web3 = await initializeWeb3(t);
        if (!web3) {
            return;
        }
        const web3Instance = new web3.eth.Contract(comicData.abi, comicData.address);
        const accounts = await web3.eth.getAccounts();
        if (accounts[0]) {
            setIsFavorited(!isFavorited); // 切換收藏狀態
            let bool = !isFavorited;
            let data = tokenId;
            try {
                const response = await axios.put(`${website}/api/update/nftDetail/favorite`, null, {
                    headers: headers,
                    params: {
                        currentAccount: currentAccount,
                        comicHash: NFT[0].comicHash,
                        bool: bool,
                        data: data
                    },
                });
            } catch (error) {
                console.error('Error handleFavoriteClick', error);
            }
        } else {
            message.info(t('請先登入以太坊錢包，才可以收藏'));
            return;
        }
    };

    const parseAuthorizations = (text) => {
        text = text.trim();
        const lines = text.includes('\n') ? text.split('\n') : [text];
        return lines.map(line => {
            const [name, ...descriptionParts] = line.split(':');
            const description = descriptionParts.join(':').trim();
            return {
                name: t(name.trim()),
                description,
            };
        });
    };

    const handlePurchase = async () => {
        if (NFT[0].owner !== t('您擁有此NFT') && NFT[0].minter !== t('您是本作品的創作者')) {
            if (buttonData[0] === t('已售完')) {
                message.info(t('此NFT已售完'));
                return;
            }
            try {
                disableAllButtons();
                const web3 = await initializeWeb3(t);
                if (!web3) {
                    return;
                }
                const accounts = await web3.eth.getAccounts();
                const account = accounts[0];
                if (account) {
                    if (NFT[0].verify === 1) {
                        const res = await axios.get(`${website}/api/isCreator`, {
                            headers: headers,
                            params: {
                                currentAccount: account
                            }
                        });
                        const isCreator = res.data[0].is_creator;
                        if (isCreator === 3) {
                            message.info(`${t('購買此NFT需要進行身分驗證')}，${t('但您已被本平台禁用驗證權限！')}`);
                            return;
                        } else if (isCreator === 2) {
                            message.info(`${t('購買此NFT需要進行身分驗證')}，${t('本平台管理者尚未審核您的身分，請稍後在試！')}`);
                            return;
                        } else if (isCreator === 0) {
                            message.info(`${t('購買此NFT需要進行身分驗證')}，${t('您尚未在本平台進行身分驗證，請先到"個人資訊"進行身分驗證！')}`);
                            return;
                        }
                    }
                    let balance = await web3.eth.getBalance(currentAccount);
                    balance = balance.toString() / 1e18;
                    let price = NFT[0].price;
                    if (balance > price) {
                        let id = tokenId.replace("tokenId", "");
                        price = web3.utils.toWei(price, 'ether');
                        const web3Instance = new web3.eth.Contract(comicData.abi, comicData.address);
                        await web3Instance.methods.purchaseNFT([id]).send({from: currentAccount, value: price});

                        try {
                            const response = await axios.put(`${website}/api/update/nftDetail/owner`, {
                                tokenId: id,
                                currentAccount: currentAccount,
                                price: JSON.stringify(initPrice),
                                forSale: 0
                            }, {
                                headers: headers
                            });
                            message.info(t('NFT購買成功'));
                            const updatedNFT = [...NFT];
                            updatedNFT[0].owner = t('您擁有此NFT'); // 更新購買狀態
                            updatedNFT[0].state = t('二次轉售');
                            updatedNFT[0].forSale = 0;
                            setNFT(updatedNFT);
                        } catch (error) {
                            console.error('Error updating DB NFT:', error);
                        }
                    } else {
                        message.info(t('餘額不足'));
                    }
                } else {
                    message.info(t('請先登入以太坊錢包，再進行購買'));
                    return;
                }
            } catch (error) {
                if (error.message.includes('User denied transaction signature')) {
                    message.info(t('拒绝交易'));
                } else {
                    alert(t('購買NFT發生錯誤：') + error);
                }
            } finally {
                enableAllButtons();
            }
        } else {
            message.info(t('您已經擁有此NFT了，不須再購買'));
        }
    };


    return (
         <div>
            {!loading &&
                <Container className='comicDetail'>
                    <Row className="pt-5">
                        <div className="d-block mx-auto img-fluid carousel-image-container">
                            {NFT[0].tips ? (
                                <div className='remove-section' style={{ display: 'flex', flexDirection: 'column' }}>
                                    <img src='/piratyPromo.jpg' />
                                    <div id="notimage" className="hidden">{t(NFT[0].tips)}</div>
                                </div>
                            ) : (
                                <img
                                    className="d-block mx-auto img-fluid"
                                    src={NFT[0].image}
                                    alt="800x400"
                                />
                            )}
                        </div>
                    </Row>
                    <Row className="pt-2 pb-3 btn-container justify-content-center">
                        {buttonData.map((label, idx) => (
                            <Col key={idx} xs={2} md={2} lg={2} className="pb-3 btn-section d-flex justify-content-center">
                                <Button 
                                    variant="outline-dark"
                                    className="custom-button"
                                    onClick={label === t('收藏') ? handleFavoriteClick : handlePurchase}
                                    data-backgroundcolor="#fff"
                                    disabled={NFT[0].tips ? true : false}
                                >
                                    {label === t('收藏') && (
                                        <>
                                            {isFavorited ? (
                                                <HeartFill
                                                    className="me-2"
                                                    style={{ color: '#F6B93B', cursor: 'pointer' }}
                                                    size={20}
                                                />
                                            ) : (
                                                <Heart
                                                    className="me-2"
                                                    style={{ color: 'black', cursor: 'pointer' }}
                                                    size={20}
                                                />
                                            )}
                                        </>
                                    )}
                                    {label}
                                </Button>
                            </Col>
                        ))}
                    </Row>
                    <Row className="d-flex justify-content-between align-items-center">
                        <Col xs={8} className="text-section ">
                            {NFT.map((data, index) => (
                                <React.Fragment key={index}>
                                    <h3 className={`fw-bold ${data.tips && 'delete-line'}`}>{data.tokenTitle}</h3>
                                    <h4 className={`fw-bold ${data.tips && 'delete-line'}`}>{data.title}－{data.state}</h4>
                                    {data.tips ? (
                                        <p className="nftDetail-text-secondary">{t('作者')}：
                                            <span className="comicDetail-penName delete-line" style={{ marginRight: "10px"}}>{data.penName}</span> 
                                            <span style={{color: "#722bd4", marginLeft: "0"}} className="delete-line">({data.minter})</span>
                                        </p>
                                    ) : (
                                        <p className="nftDetail-text-secondary">{t('作者')}：
                                        <Link to={`/authorProfile/${data.minter === t('您是本作品的創作者') ? currentAccount : data.minter}`}>
                                            <span className="comicDetail-penName" style={{ marginRight: "10px"}}>{data.penName}</span> 
                                            <span style={{color: "#722bd4", marginLeft: "0"}}>({data.minter})</span>
                                        </Link>
                                        </p>
                                    )}

                                    <p className="nftDetail-text-secondary">{t('持有者')}：
                                        <span className={`${data.tips && 'delete-line'}`} style={{ marginLeft: "0"}}>{data.owner}</span>
                                    </p>
                                    <p className={`nftDetail-text-secondary ${data.tips && 'delete-line'}`}>{data.comicDesc}</p>
                                </React.Fragment>
                            ))}
                        </Col>
                    </Row>
                    <Row className="pt-4">
                        <Col className="text-section">
                            <h3 className="fw-bold">{t('授權範圍')}</h3>
                            <ul>
                                {IP.map((item, index) => (
                                    <li key={index} className={NFT[0].tips && 'delete-line'}>
                                        <strong>{item.name}</strong>
                                    </li>
                                ))}
                            </ul>
                        </Col>
                    </Row>
                    <Row className="pt-4">
                        <Col className="text-section">
                            <h3 className="fw-bold">{t('授權說明')}</h3>
                                {IP.map((item, index) => (
                                    <li key={index} className={NFT[0].tips && 'delete-line'}>
                                        <strong>{item.name}：</strong>{item.description}
                                    </li>
                                ))}
                            <br />
                        </Col>
                    </Row>
                </Container>
             }
             {loading &&  
                 <div className="loading-container">
                     <div>{t('頁面加載中')}</div>
                 </div>
             }
        </div>
    );
}

export default NftDetail;
