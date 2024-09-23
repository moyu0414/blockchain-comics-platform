import React, { useState, useEffect } from 'react';
import { Container, Carousel, Card, Col, Row, Tabs, Tab, Form, Button, OverlayTrigger, Tooltip, Modal, Table } from 'react-bootstrap';
import './bootstrap.min.css';
import { Search, Cart, CartPlusFill, Trash, Funnel, SortNumericDown, SortNumericUp  } from 'react-bootstrap-icons';
import { Link } from "react-router-dom";
import { message } from 'antd';
import comicData from '../contracts/ComicPlatform.json';
import { initializeWeb3, disableAllButtons, enableAllButtons } from '../index';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;


const QuantityControl = ({ value, onChange }) => {
    const handleIncrease = () => {
      onChange(value + 1);
    };
  
    const handleDecrease = () => {
      if (value > 1) {
        onChange(value - 1);
      }
    };
  
    return (
      <div className="d-flex align-items-center">
        <Button variant="outline-secondary" onClick={handleDecrease}>-</Button>
        <Form.Control
          type="text"
          value={value}
          className="mx-2 text-center"
          readOnly
        />
        <Button variant="outline-secondary" onClick={handleIncrease}>+</Button>
      </div>
    );
  };

function NftMarket() {
    const [comic, setComic] = useState([]);
    const [material, setMaterial] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [show, setShow] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [web3, setWeb3] = useState('');
    const [currentAccount, setCurrentAccount] = useState(false);
    const [isAscending, setIsAscending] = useState(true);
    const [chunkSize, setChunkSize] = useState(4);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
    const [selectedGrading, setSelectedGrading] = useState(t('角色商品化'));
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const storedArray = JSON.parse(storedArrayJSON);
    const headers = {'api-key': API_KEY};
    const [grading, setGrading] = useState([
        t('角色商品化'),
        t('改編權'),
        t('廣告宣傳'),
        t('專屬會員卡'),
        t('粉絲俱樂部徽章'),
        t('線上社區認證'),
        t('數位平台使用'),
        t('其他')
    ]);

    let allRecord = [];
    let comicStats = {};
    let CountComicDetails = {};
    let temp = [];

    const initData = async () => {
        try {
            const response = await axios.get(`${website}/api/nftMarket/records`, { headers });
            let nftData = response.data;
            nftData.forEach(item => {
                    const keyData = `${item.comicHash}-${item.price}-${item.royalty}-${item.description || ""}`;
                    const lastPriceValue = Object.values(item.price).pop();
                    const updatedRecord = {
                        ...item, // 保留原有属性
                        isFanCreation: item.minter === item.owner ? t('原創') : t('轉售'), // 添加新属性
                        keyData,
                        price: lastPriceValue
                    };
                    if (item.forSale === 1) {
                        allRecord.push(updatedRecord);
                    }
                    if (!comicStats[keyData]) {
                        comicStats[keyData] = { tot: 0, sale: 0 };
                    }
                    comicStats[keyData].tot += 1;
                    if (item.minter !== item.owner) {
                        comicStats[keyData].sale += 1;
                    }
            });
            const keyhMap = allRecord.map(record => ({
                ...record,
                ...(record.isFanCreation === t('原創') ? {
                    totQty: comicStats[record.keyData]?.tot || 0,
                    saleQty: comicStats[record.keyData]?.sale || 0,
                    totSale: (comicStats[record.keyData]?.tot || 0) - (comicStats[record.keyData]?.sale || 0)
                } : {
                    totQty: 1,
                    saleQty: 0,
                    totSale: 1
                })
            }));
            keyhMap.forEach(record => {
                const { isFanCreation, keyData } = record;
                if (isFanCreation === t('原創')) {
                    if (!CountComicDetails[keyData]) {
                        CountComicDetails[keyData] = true;
                        temp.push(record);
                    }
                } else {
                    temp.push(record);
                }
            });
            const fetchImage = async (data) => {
                const nftImgResponse = await axios.get(`${website}/api/nftIMG/${data.comicHash}/${data.tokenId}`, {
                    responseType: 'blob',
                    headers,
                  });
                  if (nftImgResponse.data.type === 'image/jpeg') {
                    data.image = URL.createObjectURL(nftImgResponse.data);
                  } else {
                    const url = data.protoFilename === 1
                      ? `${website}/api/coverFile/${data.filename}/${data.protoFilename}`
                      : `${website}/api/comicIMG/${data.filename}`;
                    const coverImgResponse = await axios.get(url, { responseType: 'blob', headers });
                    data.image = URL.createObjectURL(coverImgResponse.data);
                }
                data.names = parseAuthorizations(data.description).map(auth => auth.name);
            };
            await Promise.all(temp.map(fetchImage));

            //console.log(temp);
            setComic(temp);
            setMaterial(temp);
            setLoading(false);
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    useEffect(() => {
        initData();
        updateChunkSize();
        window.addEventListener('resize', updateChunkSize);
        return () => window.removeEventListener('resize', updateChunkSize);
    }, []);

    const parseAuthorizations = (text) => {
        text = text.trim();
        const lines = text.includes('\n') ? text.split('\n') : [text];
        return lines.map(line => {
            const [name] = line.split(':');
            return {
                name: t(name.trim()),
            };
        });
    };

    const handleGradingChange = (event) => {
        setSelectedGrading(event.target.value);
    };

    const filteredMaterials = Object.values(material).filter(data => {
        if (selectedGrading === t('其他')) {
            return data.names.some(name => !grading.includes(name));
        } else {
            return data.names.includes(selectedGrading);
        }
    });

    const handleSearchClick = (label) => {
        setShowSearch(true);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim() === '') {
            setSearchResults([]);
            setShowSearch(false);
            return;
        }
        const results = material.filter(item => 
            item.title.includes(searchTerm) ||
            item.minter.includes(searchTerm) ||
            item.penName.includes(searchTerm) ||
            item.price.includes(searchTerm) ||
            item.names.some(name => name.includes(searchTerm)) ||
            item.tokenTitle.includes(searchTerm) ||
            item.isFanCreation.includes(searchTerm)
          );
          setSearchResults(results);
          setShowSearch(false);
    };

    const handleSort = () => {
        setIsAscending(!isAscending);
        const sortedComic = [...comic].sort((a, b) => {
            return !isAscending ? a.price - b.price : b.price - a.price;
        });
        setComic(sortedComic);
        if (searchResults.length !== 0) {
            const sortedResults = [...searchResults].sort((a, b) => {
                return !isAscending ? a.price - b.price : b.price - a.price;
            });
            setSearchResults(sortedResults);
        }
        if (material.length !== 0) {
            const sortedMaterial = [...material].sort((a, b) => {
                return !isAscending ? a.price - b.price : b.price - a.price;
            });
            setMaterial(sortedMaterial);
        }
    };

    const handleAddToCart = async (data) => {
        const web3 = await initializeWeb3(t);
        if (web3) {
            setWeb3(web3);
            const accounts = await web3.eth.getAccounts();
            if (accounts[0]) {
                let account = accounts[0].toLowerCase();
                setCurrentAccount(account);
                const { tokenId, title, image, price, verify } = data;
                if (account === data.minter || account === data.owner) {
                    message.info(t('您擁有此NFT'));
                } else {
                    if (data.verify === 1) {
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
                    message.info(t('購物車添加成功'));
                    setCartItems(prevItems => {
                        const updatedItems = prevItems.map(item => {
                            if (item.tokenId === tokenId) {
                                const newSaleQty = item.saleQty + 1;
                                return {
                                    ...item,
                                    saleQty: Math.min(newSaleQty, item.totSale) 
                                };
                            }
                            return item;
                        });
                        if (prevItems.some(item => item.tokenId === tokenId)) {
                            return updatedItems;
                        }
                        return [
                            ...prevItems,
                            { tokenId, title, image, price, saleQty: 1, totSale: data.totSale, tokenTitle: data.tokenTitle }
                        ];
                    });
                }
            } else {
                message.info(t('請先登入以太坊錢包，才開放購物車功能'));
            }
        }
    };

    const handleQuantityChange = (tokenId, newQuantity) => {
        setCartItems(prevItems =>
          prevItems.map(item => {
            if (item.tokenId === tokenId) {
              const updatedQuantity = newQuantity <= item.totSale ? newQuantity : item.saleQty;
              return { ...item, saleQty: updatedQuantity };
            }
            return item;
          })
        );
      };

    const handleRemove = (tokenId) => {
        setCartItems(prevItems => prevItems.filter(item => item.tokenId !== tokenId));
    };

    const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.saleQty), 0).toFixed(2);

    const handlePurchase = async () => {
        try {
            if (cartItems.length === 0) {
                return;
            }
            disableAllButtons();
            let balance = await web3.eth.getBalance(currentAccount);
            balance = balance.toString() / 1e18;
            let price = totalAmount;
            if (balance > price) {
                const tokenIds = cartItems.flatMap(({ tokenId, saleQty }) =>
                    Array.from({ length: saleQty }, (_, j) => tokenId + j)
                );
                price = web3.utils.toWei(price, 'ether');
                //console.log(totalAmount);
                //console.log('tokenIds', tokenIds);  // 所有的tokenId
                const web3Instance = new web3.eth.Contract(comicData.abi, comicData.address);
                await web3Instance.methods.purchaseNFT(tokenIds).send({from: currentAccount, value: price});
 
                try {
                    const response = await axios.put(`${website}/api/update/nftMarket/owner`, {
                        tokenId: tokenIds,
                        currentAccount: currentAccount,
                        forSale: 0
                    }, {
                        headers: headers
                    });
                    message.info(t('NFT購買成功'));
                    window.location.replace("/bookcase");
                } catch (error) {
                    console.error('Error updating DB NFT:', error);
                }
            } else {
                message.info(t('餘額不足'));
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
    };

    const TooltipWrapper = ({ text, children }) => (
        <OverlayTrigger 
            placement="top" 
            overlay={<Tooltip id="tooltip">{text}</Tooltip>}
        >
            {children}
        </OverlayTrigger>
    );

    const tooltips = {
        material: t('IP種類篩選'),
        copyright: t('作者原創授權NFT'),
        resale: t('持有者轉售NFT'),
    };

    const renderTooltip = (title, penName, names) => (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {title}<br />
            {penName}
            <hr />
            {names.map((name, index) => (
                <div key={index}>{name}</div>
            ))}
        </Tooltip>
    );

    const updateChunkSize = () => {
        if (window.innerWidth <= 768) {
            setChunkSize(4); // 屏幕宽度 768px 或以下时，每页显示 4 个项目
        } else {
            setChunkSize(8); // 屏幕宽度大于 768px 时，每页显示 8 个项目
        }
    };

    const chunkArray = (arr, size) => {
        const result = [];
        for (let i = 0; i < arr.length; i += size) {
            result.push(arr.slice(i, i + size));
        }
        return result;
    };

    const groupedResults = chunkArray(comic.filter(data => data.isFanCreation === t('原創')), chunkSize);
    const searchgroupedResults = chunkArray(searchResults, chunkSize);

    
    return (
        <>
        {!loading &&
            <Container className='nftMarket'>
                <h2 className='text-center fw-bold' style={{backgroundColor: "green"}}>{t('NFT市場')}</h2>
                <Row>
                    <div className='d-flex justify-content-between align-items-center'>
                        <div className='d-flex'>
                            <Search onClick={handleSearchClick} className="nftMarket-search" />
                            <h3 className="fw-bold pt-3">{t('大家都在買')}</h3>
                        </div>
                        <div onClick={handleSort} className='d-flex justify-content-end'>
                            {isAscending ? <SortNumericUp size={36} /> : <SortNumericDown size={36} />}
                            <Cart 
                                size={36} 
                                className='d-flex align-items-center' 
                                onClick={() => setShow(true)} 
                            />
                        </div>
                        
                    </div>
                    <Modal
                        show={showSearch}
                        onHide={() => setShowSearch(false)}
                        dialogClassName="custom-modal-content"
                    >
                        <Modal.Body>
                            <Form.Group>
                                <Form.Label style={{fontSize: "20px"}}>{t('搜尋NFT')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('請輸入')}
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer className="custom-modal-footer">
                            <Button
                                className="mt-3"
                                onClick={handleSearch}
                            >
                                {t('確定')}
                            </Button>
                            <Button
                                className="mt-3"
                                onClick={() => setShowSearch(false)}
                            >
                                {t('取消')}
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    <Modal
                        show={show}
                        onHide={() => setShow(false)}
                        size="xl"
                        centered
                        aria-labelledby="exampleModalLabel"
                        className='nftMarket-modal'
                    >
                        <Modal.Header closeButton className="border-bottom-0">
                        <Modal.Title id="exampleModalLabel">
                            {t('購物車')}
                        </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                        <Table className="table-xs">
                            <thead>
                            <tr>
                                <th>NFT</th>
                                <th className="text-right">{t('價格')}</th>
                                <th className="text-right">{t('數量')}</th>
                                <th className="text-right">{t('總額')}</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {cartItems.map((item, index) => (
                                <tr key={index} className={`item-row ${index === cartItems.length - 1 ? 'item-row-last' : ''}`}>
                                <td className="modal-img nft-position-relative">
                                    <div className="img-container">
                                        <img src={item.image} alt={item.title} className="img-fluid img-thumbnail" />
                                        <div className="overlay">
                                            <span className="overlay-title">{item.title}</span><br />
                                            <span className="overlay-subtitle">{item.tokenTitle}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="text-right" title={t('價格')}>
                                    {item.price}
                                </td>
                                <td className="text-right qty" title={t('數量')}>
                                    {/* <Form.Control
                                        type="number"
                                        value={item.saleQty}
                                        min="1"
                                        onChange={(e) => handleQuantityChange(item.tokenId, parseInt(e.target.value, 10))}
                                    /> */}
                                    <QuantityControl
                                        value={item.saleQty}
                                        onChange={(newQuantity) => handleQuantityChange(item.tokenId, newQuantity)}
                                    />
                                </td>
                                <td className="text-right" title={t('總額')}>
                                    {(item.price * item.saleQty).toFixed(2)}
                                </td>
                                <td className="modal-del">
                                    <Trash
                                        size={24}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleRemove(item.tokenId)}
                                    />
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                        <div className="d-flex justify-content-end">
                            <h5>{t('總額')}：<span className="price text-success">${totalAmount}</span></h5>
                        </div>
                        </Modal.Body>
                        <Modal.Footer className="border-top-0 d-flex justify-content-end">
                            <Button onClick={handlePurchase} variant="success">
                                {t('確認')}
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </Row>
                <Row className='pt-1 pb-5'>
                    {searchResults.length === 0 && (
                        <Carousel interval={3500} pause="hover" wrap={true} indicators={true} className="nftMarket-carousel">
                            {groupedResults.map((group, groupIndex) => (
                                <Carousel.Item key={groupIndex}>
                                    <Row className="nftMarket-carousel-row">
                                        {group.map((data, index) => (
                                            <Col xs={6} md={3} key={index}>
                                                <Card className="effect-image-1">
                                                    <OverlayTrigger placement="top" overlay={renderTooltip(data.title, data.penName, data.names)}>
                                                        <div>
                                                            <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                                                <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                                                <div className="nftMarket-overlay">
                                                                    <span>{t('已售')}：{data.saleQty} {t('總數')}：{data.totQty}</span>
                                                                </div>
                                                                </Link>
                                                            <Card.Body className="simple-text">
                                                                <Card.Text className="nftMarket-text">
                                                                    {data.tokenTitle}<br />
                                                                    $ {data.price}
                                                                    <CartPlusFill size={25} style={{marginLeft: "8px"}} onClick={() => handleAddToCart(data)} />
                                                                </Card.Text>
                                                            </Card.Body>
                                                        </div>
                                                    </OverlayTrigger>
                                                </Card>
                                            </Col>
                                        ))}               
                                    </Row>
                                </Carousel.Item>
                            ))}
                        </Carousel>
                    )}
                    {searchResults.length > 0 && (
                        <Carousel interval={null} pause={false} wrap={true} indicators={true} className="nftMarket-carousel">
                            {searchgroupedResults.map((group, groupIndex) => (
                                <Carousel.Item key={groupIndex}>
                                    <Row className="nftMarket-carousel-row">
                                        {group.map((data, index) => (
                                            <Col xs={6} md={3} key={index}>
                                                <Card className="effect-image-1">
                                                    <OverlayTrigger placement="top" overlay={renderTooltip(data.title, data.penName, data.names)}>
                                                        <div>
                                                            <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                                                <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                                                <div className="nftMarket-overlay">
                                                                    <span>{t('已售')}：{data.saleQty} {t('總數')}：{data.totQty}</span>
                                                                </div>
                                                            </Link>
                                                            <Card.Body className="simple-text">
                                                                <Card.Text className="nftMarket-text">
                                                                    {data.tokenTitle}<br />
                                                                    $ {data.price}
                                                                    <CartPlusFill size={25} style={{marginLeft: "8px"}} onClick={() => handleAddToCart(data)} />
                                                                </Card.Text>
                                                            </Card.Body>
                                                        </div>
                                                    </OverlayTrigger>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </Carousel.Item>
                            ))}
                        </Carousel>
                    )}
                </Row>
                <Row className='pt-3'>
                    <h3 className="fw-bold">{t('推薦NFT')}</h3>
                </Row>
                <Tabs defaultActiveKey="copyright" id="uncontrolled-tab-example">
                    <Tab 
                        eventKey="material" 
                        title={
                            <TooltipWrapper text={tooltips.material}>
                                <div>{t('素材')}</div>
                            </TooltipWrapper>
                        }
                    >
                        <Form.Group>
                            <Form.Label className='pt-1'>{t('IP種類')}</Form.Label>
                            <Form.Control as="select" value={t(selectedGrading)} onChange={handleGradingChange}>
                                {grading.map((option, index) => (
                                    <option key={index} value={option}>{option}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                        <Row className='pt-1 pb-5'>
                            {filteredMaterials.map((data, index) => (
                                <Col xs={6} md={3} className="pt-3" key={index}>
                                    <Card className="effect-image-1">
                                        <OverlayTrigger placement="top" overlay={renderTooltip(data.title, data.penName, data.names)}>
                                            <div>
                                                <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                                    <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                                    <div className="nftMarket-overlay">
                                                        <span>{t('已售')}：{data.saleQty} {t('總數')}：{data.totQty}</span>
                                                    </div>
                                                </Link>
                                                <Card.Body className="simple-text">
                                                    <Card.Text className="nftMarket-text">
                                                        {data.tokenTitle}<br />
                                                        $ {data.price}
                                                        <CartPlusFill size={25} style={{marginLeft: "8px"}} onClick={() => handleAddToCart(data)} />
                                                    </Card.Text>
                                                </Card.Body>
                                            </div>
                                        </OverlayTrigger>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Tab>
                    <Tab
                        eventKey="copyright"
                        title={
                            <TooltipWrapper text={tooltips.copyright}>
                                <div>{t('原創')}</div>
                            </TooltipWrapper>
                        }
                    >
                        <Row className="pt-1 pb-5">
                            {comic
                                .filter((data) => data.isFanCreation === t('原創'))
                                .map((data, index) => (
                                    <Col key={index} xs={6} md={3} className="pt-3">
                                        <Card className="effect-image-1">
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={renderTooltip(
                                                    data.title,
                                                    data.penName,
                                                    data.names
                                                )}
                                            >
                                                <div>
                                                    <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                                        <Card.Img
                                                            src={data.image}
                                                            alt={`image-${index + 1}`}
                                                        />
                                                        <div className="nftMarket-overlay">
                                                            <span>{t('已售')}：{data.saleQty} {t('總數')}：{data.totQty}</span>
                                                        </div>
                                                    </Link>
                                                    <Card.Body className="simple-text">
                                                        <Card.Text className="nftMarket-text">
                                                            {data.tokenTitle}
                                                            <br />
                                                            $ {data.price}
                                                            <CartPlusFill
                                                                size={25}
                                                                style={{ marginLeft: '8px' }}
                                                                onClick={() => handleAddToCart(data)}
                                                            />
                                                        </Card.Text>
                                                    </Card.Body>
                                                </div>
                                            </OverlayTrigger>
                                        </Card>
                                    </Col>
                                ))}
                        </Row>
                    </Tab>
                    <Tab
                        eventKey="resale"
                        title={
                            <TooltipWrapper text={tooltips.resale}>
                                <div>{t('轉售')}</div>
                            </TooltipWrapper>
                        }
                    >
                        <Row className="pt-1 pb-5">
                            {comic
                                .filter((data) => data.isFanCreation === t('轉售'))
                                .map((data, index) => (
                                    <Col key={index} xs={6} md={3} className="pt-3">
                                        <Card className="effect-image-1">
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={renderTooltip(
                                                    data.title,
                                                    data.penName,
                                                    data.names
                                                )}
                                            >
                                                <div>
                                                    <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                                        <Card.Img
                                                            src={data.image}
                                                            alt={`image-${index + 1}`}
                                                        />
                                                        <div className="nftMarket-overlay">
                                                            <span>{t('已售')}：{data.saleQty} {t('總數')}：{data.totQty}</span>
                                                        </div>
                                                    </Link>
                                                    <Card.Body className="simple-text">
                                                        <Card.Text className="nftMarket-text">
                                                            {data.tokenTitle}
                                                            <br />
                                                            $ {data.price}
                                                            <CartPlusFill
                                                                size={25}
                                                                style={{ marginLeft: '8px' }}
                                                                onClick={() => handleAddToCart(data)}
                                                            />
                                                        </Card.Text>
                                                    </Card.Body>
                                                </div>
                                            </OverlayTrigger>
                                        </Card>
                                    </Col>
                                ))}
                        </Row>
                    </Tab>
                </Tabs>
            </Container>
        }
        {loading &&  
            <div className="loading-container">
                <div>{t('頁面加載中')}</div>
            </div>
        }
        </>
    );
}

export default NftMarket;
