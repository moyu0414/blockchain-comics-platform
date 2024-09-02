import React, { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import { Container, Col, Row, Button, Modal, Form } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import { initializeWeb3, disableAllButtons, enableAllButtons } from '../index';
import comicData from '../contracts/ComicPlatform.json';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function NftOwner() {
    const [NFT, setNFT] = useState([]);
    const [IP, setIP] = useState([]);
    const { tokenId } = useParams();
    const [loading, setLoading] = useState(true);
    const [beingNFT, setBeingNFT] = useState(false);
    const [isFavorited, setIsFavorited] = useState('');
    const [show, setShow] = useState(false);
    const [price, setPrice] = useState('');
    const [updatePrice, setUpdatePrice] = useState('');
    const [isInputVisible, setIsInputVisible] = useState(false);
    const { t } = useTranslation();
    const currentAccount = localStorage.getItem("currentAccount");
    const headers = {'api-key': API_KEY};
    const buttonData = [
        `${NFT[0]?.state}`, t('收藏')
    ];
    let records = [];

    const initData = async () => {
        const response = await axios.get(`${website}/api/nftOwner/records`, {
            headers: headers,
            params: {
                tokenId: tokenId.replace("tokenId", ""),
                currentAccount: currentAccount
            }
        });
        let nftData = response.data;
        setUpdatePrice(nftData[0].price);

        if (nftData.length !== 0) {
            const { minter: initialMinter, price, forSale, protoFilename, filename } = nftData[0];
            const currentState = forSale === 0 ? t('轉售') : t('已出售');
            const currentMinter = initialMinter === currentAccount ? t('您是本作品的創作者') : initialMinter;
            const url = protoFilename === 1
                ? `${website}/api/coverFile/${filename}/${protoFilename}`
                : `${website}/api/comicIMG/${filename}`;
            const imageResponse = await axios.get(url, { responseType: 'blob', headers });
            const image = URL.createObjectURL(imageResponse.data);
            const newData = nftData.map(data => ({
                ...data,
                minter: currentMinter,
                owner: t('您擁有此NFT'),
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
            setBeingNFT(true);
            setLoading(false);
        } else {
            setLoading(false);
        }
    };

    useEffect(() => {
        initData();
    }, [currentAccount]);

    const handleButtonClick = (label) => {
        if (label === t('收藏')) {
            handleFavoriteClick();
        } else if (NFT[0].state !== t('已出售')) {
            setShow(true);
            setIsInputVisible(false);
        } else {
            alert('此NFT已上架');
        }
    };

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
                name: t(name.trim()),
                description,
            };
        });
    };

    const handleUpdateNFT = async (price) => {
        try {
            disableAllButtons();
            const web3 = await initializeWeb3(t);
            if (!web3) {
                return;
            }
            const web3Instance = new web3.eth.Contract(comicData.abi, comicData.address);
            let id = NFT[0].tokenId;
            let temp_price = web3.utils.toWei(price, 'ether');
            await web3Instance.methods.updateNFT(id, temp_price, true).send({from: currentAccount});
    
            const nextKey = Math.max(...Object.keys(updatePrice).map(Number), -1) + 1;
            const newPriceData = { ...updatePrice, [nextKey]: price };
            try {
                const response = await axios.put(`${website}/api/update/nftDetail/owner`, {
                    tokenId: id,
                    currentAccount: currentAccount,
                    price: JSON.stringify(newPriceData),
                    forSale: 1,
                }, {
                    headers: headers
                });
                alert(t('NFT上架成功'));
                const updatedNFT = [...NFT];
                updatedNFT[0].state = t('已出售');
                setNFT(updatedNFT);
            } catch (error) {
                console.error('Error updating NFT:', error);
            }
        } catch (error) {
            if (error.message.includes('User denied transaction signature')) {
                alert(t('拒绝交易'));
            } else {
                console.error('上架NFT發生錯誤：', error);
                alert(error);
            }
        } finally {
            enableAllButtons();
        }
    };

    const handleConfirm = () => {
        setIsInputVisible(true);
    };

    const handlePriceConfirm = () => {
        if (price) {
            handleUpdateNFT(price);
            setShow(false);
            setPrice('');
        } else {
            alert(t('請輸入有效的價格'));
        }
    };


    return (
         <div>
            {!loading ? (
                <Container className='comicDetail'>
                    {!beingNFT ? (
                        <div className="loading-container">
                            <div>{t('您並未持有此NFT，請重新刷新')}</div>
                        </div>
                    ) : (
                        <div>
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
                                        <Button variant="outline-dark" className="custom-button" onClick={() => handleButtonClick(label)} data-backgroundcolor="#fff">
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
                            <Modal
                                show={show}
                                onHide={() => setShow(false)}
                                dialogClassName="custom-modal-content"
                            >
                                <Modal.Body>
                                    {isInputVisible ? (
                                        <Form.Group>
                                            <Form.Label>{t('NFT價格')}</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={price}
                                                step="0.01"
                                                min="0.01"
                                                onChange={(e) => setPrice(e.target.value)}
                                                placeholder={t('至少 0.01 ETH')}
                                            />
                                        </Form.Group>
                                    ) : (
                                        <Form.Label className="custom-modal-text">{t('確定轉售NFT')}</Form.Label>
                                    )}
                                </Modal.Body>
                                <Modal.Footer className="custom-modal-footer">
                                    {isInputVisible ? (
                                        <>
                                            <Button
                                                className="custom-modal-button"
                                                onClick={handlePriceConfirm}
                                            >
                                                {t('確定')}
                                            </Button>
                                            <Button
                                                className="custom-modal-button"
                                                onClick={() => setShow(false)}
                                            >
                                                {t('取消')}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                className="custom-modal-button"
                                                onClick={handleConfirm}
                                            >
                                                {t('確定')}
                                            </Button>
                                            <Button
                                                className="custom-modal-button"
                                                onClick={() => setShow(false)}
                                            >
                                                {t('取消')}
                                            </Button>
                                        </>
                                    )}
                                </Modal.Footer>
                            </Modal>
                            <Row className="d-flex justify-content-between align-items-center">
                                <Col xs={8} className="text-section ">
                                    {NFT.map((data, index) => (
                                        <React.Fragment key={index}>
                                            <h3 className="fw-bold">{data.tokenTitle}</h3>
                                            <h4 className="fw-bold">{data.title}</h4>
                                            <p className="nftDetail-text-secondary">{t('作者')}：
                                                <Link to={`/authorProfile/${data.minter}`}>
                                                    <span className="comicDetail-penName" style={{ marginRight: "10px"}}>{data.penName}</span> 
                                                    <span style={{color: "#722bd4", marginLeft: "0"}}>({data.minter})</span>
                                                </Link>
                                            </p>
                                            <p className="nftDetail-text-secondary">{t('持有者')}：{data.owner}</p>
                                            <p className="nftDetail-text-secondary">{data.comicDesc}</p>
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
                        </div>
                    )}
                </Container>
            ) : (
                <div className="loading-container">
                    <div>{t('頁面加載中')}</div>
                </div>
            )}
        </div>
    );
}

export default NftOwner;
