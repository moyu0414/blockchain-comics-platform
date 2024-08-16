import React, { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import { Container, Carousel, Card, Col, Row, ListGroup, Button } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import { initializeWeb3, disableAllButtons, enableAllButtons } from '../index';
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function NftDetail() {
    const [NFT, setNFT] = useState([]);
    const [IP, setIP] = useState([]);
    const { tokenId } = useParams();
    const [loading, setLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState('');
    const { t } = useTranslation();
    const language = localStorage.getItem('language') || i18n.language;
    const currentAccount = localStorage.getItem("currentAccount");
    const headers = {'api-key': API_KEY};
    const buttonData = [
        `$ ${NFT[0]?.price}`, t('收藏')
    ];
    let records = [];
    let temp = [];

    const initData = async () => {
        const response = await axios.get(`${website}/api/nftDetail/records`, {
            headers: headers,
            params: {
                tokenId: tokenId.replace("tokenId", "")
            }
        });
        let nftData = response.data;

        const { minter: initialMinter, owner: initialOwner, price, forSale, protoFilename, filename } = nftData[0];
        const currentState = forSale === 0 ? t('二次轉售') : t('原創授權');
        const currentOwner = initialOwner === currentAccount ? t('您擁有此NFT') : initialOwner;
        const currentMinter = initialMinter === currentAccount ? t('您是本作品的創作者') : initialMinter;
        const url = protoFilename === 1
            ? `${website}/api/coverFile/${filename}/${protoFilename}`
            : `${website}/api/comicIMG/${filename}`;
        const imageResponse = await axios.get(url, { responseType: 'blob', headers });
        const image = URL.createObjectURL(imageResponse.data);
        const newData = nftData.map(data => ({
            ...data,
            minter: currentMinter,
            owner: currentOwner,
            state: currentState,
            image
        }));
        console.log(newData);
        setNFT(newData);
        const authorizations = parseAuthorizations(newData[0].description);
        setIP(authorizations);

        try {
            const response = await axios.get(`${website}/api/nftDetail/isFavorited`, {
                headers: headers,
                params: {
                    currentAccount: currentAccount,
                    comicHash: nftData[0].comicHash
                }
            });
            if (Array.isArray(response.data.value) && response.data.value.includes(tokenId)) {
                setIsFavorited(response.data.isFavorited);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        initData();
    }, [currentAccount]);

    const handleFavoriteClick = async () => {
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
            //console.log(response.data);
        } catch (error) {
            console.error('Error handleFavoriteClick', error);
        }
    };

    const parseAuthorizations = (text) => {
        text = text.trim();
        const lines = text.includes('\n') ? text.split('\n') : [text];
        return lines.map(line => {
            const [name, ...descriptionParts] = line.split(':');
            const description = descriptionParts.join(':').trim();
            return {
                name: name.trim(),
                description,
            };
        });
    };

    const handlePurchase = async () => {
        if (NFT[0].owner !== t('您擁有此NFT') && NFT[0].minter !== t('您是本作品的創作者')) {
            try {
                disableAllButtons();
                const web3 = await initializeWeb3(t);
                if (!web3) {
                    return;
                }
                const web3Instance = new web3.eth.Contract(comicData.abi, comicData.address);
                const accounts = await web3.eth.getAccounts();
                const account = accounts[0];
                if (account) {
                    let balance = await web3.eth.getBalance(currentAccount);
                    balance = balance.toString() / 1e18;
                    let price = NFT[0].price;
                    if (balance > price) {
                        let id = tokenId.replace("tokenId", "");
                        price = web3.utils.toWei(price, 'ether');
                        await web3Instance.methods.purchaseNFT(id).send({from: currentAccount, value: price,});
                
                        try {
                            const response = await axios.put(`${website}/api/update/nftDetail/owner`, {
                            tokenId: id,
                            currentAccount: currentAccount
                            }, {
                            headers: headers
                            });
                            alert(t('NFT購買成功'));
                            const updatedNFT = [...NFT];
                            updatedNFT[0].owner = t('您擁有此NFT'); // 更新購買狀態
                            updatedNFT[0].state = t('二次轉售');
                            setNFT(updatedNFT);
                        } catch (error) {
                            console.error('Error updating NFT:', error);
                        }
                    } else {
                        console.log('餘額不足');
                        alert(t('餘額不足'));
                    }
                } else {
                    alert(t('請先登入以太坊錢包，再進行購買'));
                    return;
                }
            } catch (error) {
                if (error.message.includes('User denied transaction signature')) {
                    alert(t('拒绝交易'));
                } else {
                    console.error('購買NFT發生錯誤：', error);
                    alert(error);
                }
            } finally {
                enableAllButtons();
            }
        } else {
            alert(t('您已經擁有此NFT了，不須再購買'));
        }
    };


    return (
         <div>
            {!loading &&
                <Container className='comicDetail'>
                    <Row className="pt-5">
                        <div className="d-block mx-auto img-fluid carousel-image-container">
                            <img
                            className="d-block mx-auto img-fluid"
                            src={NFT[0].image}
                            alt="800x400"
                            />
                        </div>
                    </Row>
                    <Row className="pt-2 pb-3 btn-container justify-content-center">
                        {buttonData.map((label, idx) => (
                            <Col key={idx} xs={2} md={2} lg={2} className="pb-3 btn-section d-flex justify-content-center">
                                <Button variant="outline-dark" className="custom-button" onClick={label === t('收藏') ? handleFavoriteClick : handlePurchase} data-backgroundcolor="#fff">
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
                                    <h3 className="fw-bold">{data.title}</h3>
                                    <h4 className="fw-bold">{data.state}</h4>
                                    <p className="text-secondary">{t('作者')}:<br />{data.minter}</p>
                                    <p className="text-secondary">{t('持有者')}:<br />{data.owner}</p>
                                    <p className="text-secondary">{data.comicDesc}</p>
                                </React.Fragment>
                            ))}
                        </Col>
                    </Row>
                    <Row className="pt-1">
                        <Col className="text-section">
                            <h3 className="fw-bold">{t('授權範圍')}</h3>
                            <ul>
                                {IP.map((item, index) => (
                                    <li key={index}>
                                    <strong>{item.name}</strong>
                                    </li>
                                ))}
                            </ul>
                        </Col>
                    </Row>
                    <Row className="pt-1">
                        <Col className="text-section">
                            <h3 className="fw-bold">{t('授權說明')}</h3>
                                {IP.map((item, index) => (
                                    <li key={index}>
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
