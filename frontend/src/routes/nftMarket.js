import React, { useState, useEffect } from 'react';
import { Container, Carousel, Card, Col, Row, Tabs, Tab, Form, Button, OverlayTrigger, Tooltip, Modal,Table, Dropdown } from 'react-bootstrap';
import './bootstrap.min.css';
import { Search, Cart, Trash, Funnel, SortNumericDown, SortNumericUp  } from 'react-bootstrap-icons';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function NftMarket() {
    const [comic, setComic] = useState([]);
    const [material, setMaterial] = useState([]);
    const [show, setShow] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
    const [selectedGrading, setSelectedGrading] = useState(t('角色商品化'));
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const storedArray = JSON.parse(storedArrayJSON);
    const currentAccount = localStorage.getItem("currentAccount");
    const headers = {'api-key': API_KEY};
    const [quantity, setQuantity] = useState(2); 
    const [isAscending, setIsAscending] = useState(true);
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
                if (item.forSale === 1) {
                    const keyData = `${item.comicHash}-${item.price}-${item.royalty}-${item.description || ""}`;
                    const lastPriceValue = Object.values(item.price).pop();
                    const updatedRecord = {
                        ...item, // 保留原有属性
                        isFanCreation: item.minter === item.owner ? t('原創') : t('轉售'), // 添加新属性
                        keyData,
                        price: lastPriceValue
                    };
                    allRecord.push(updatedRecord);
                    if (!comicStats[keyData]) {
                        comicStats[keyData] = { tot: 0, sale: 0 };
                    }
                    comicStats[keyData].tot += 1;
                    if (item.forSale === 0) { // 已售出的 NFT
                        comicStats[keyData].sale += 1;
                    }
                }
            });
            const keyhMap = allRecord.map(record => ({
                ...record,
                ...(record.isFanCreation === t('原創') ? {
                    totQty: comicStats[record.keyData]?.tot || 0,
                    saleQty: comicStats[record.keyData]?.sale || 0
                } : {
                    totQty: 1,
                    saleQty: 0
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

            console.log(temp);
            setComic(temp);
            setMaterial(temp);
            setLoading(false);
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    useEffect(() => {
        initData();
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

    const truncateLastText = (text, maxLength) => {
        if (text.length > maxLength) {
            const end = text.slice(-maxLength); // 获取最后 maxLength 个字符
            return `...${end}`;
        }
        return text;
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

    const renderTooltip = (title, names) => (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {title}
            <hr />
            {names.map((name, index) => (
                <div key={index}>{name}</div>
            ))}
        </Tooltip>
    );

    const handleClick = (label) => {
        setShow(true);
    };

    const handleSort = () => {
        setIsAscending(!isAscending);
    };

    const handleClose = () => setShow(false);

    const handleQuantityChange = (e) => {
        setQuantity(e.target.value); // 更新 quantity 狀態
    };


    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim() === '') {
            setSearchResults([]);
            setShow(false);
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
          setShow(false);
    };

    
    return (
        <>
        {!loading &&
            <Container className='nftMarket'>
                <h2 className='text-center fw-bold' style={{backgroundColor: "green"}}>NFT市場</h2>
                <Row>
                    <div className='d-flex justify-content-between align-items-center'>
                        <div className='d-flex'>
                            <Search onClick={handleClick} className="nftMarket-search" />
                            <h3 className="fw-bold pt-3">{t('大家都在買')}</h3>
                        </div>
                        <Cart 
                            size={36} 
                            className='d-flex align-items-center' 
                            onClick={() => setShow(true)} 
                        />
                    </div>
                    <Modal
                        show={show}
                        onHide={handleClose}
                        size="xl"
                        centered
                        aria-labelledby="exampleModalLabel"
                        className='nftMarket-modal'
                    >
                        <Modal.Header closeButton className="border-bottom-0">
                        <Modal.Title id="exampleModalLabel">
                            購物車
                        </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                        <Table className="table-image">
                            <thead>
                            <tr>
                                <th onClick={handleSort}>{isAscending ? <SortNumericUp size={24} color='black' /> : <SortNumericDown size={24} color='black' />}</th>
                                <th>產品描述</th>
                                <th>價格</th>
                                <th>數量</th>
                                <th>總額</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td className="modal-img">
                                    <img
                                        src="https://images.pexels.com/photos/7809122/pexels-photo-7809122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                                        className="img-fluid img-thumbnail"
                                        alt="Sheep"
                                    />
                                </td>
                                <td>漫畫名稱</td>
                                <td>89$</td>
                                <td className="qty">
                                <Form.Control
                                    type="number"
                                    value={quantity}
                                    onChange={handleQuantityChange} 

                                />
                                </td>
                                <td>178$</td>
                                <td>
                                <Trash size={24}/>
                                </td>
                            </tr>
                            </tbody>
                        </Table>
                        <div className="d-flex justify-content-end">
                            <h5>總額: <span className="price text-success">89$</span></h5>
                        </div>
                        </Modal.Body>
                        <Modal.Footer className="border-top-0 d-flex justify-content-end">
                        <Button variant="success">
                            確認
                        </Button>
                        </Modal.Footer>
                    </Modal>


                </Row>
                <Row className='pt-1 pb-5'>
                    {searchResults.length === 0 && (
                        comic.filter(data => data.isFanCreation === t('原創')).map((data, index) => (
                            <Col xs={6} md={3} className="pt-3" key={index}>
                                <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                    <Card className="effect-image-1">
                                        <OverlayTrigger placement="top" overlay={renderTooltip(data.title, data.names)}>
                                            <div>
                                                <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                                <div className="nftMarket-overlay">
                                                    <span>已售：{data.saleQty} 總數：{data.totQty}</span>
                                                </div>
                                                <Card.Body className="simple-text">
                                                    <Card.Text className="nftMarket-text">
                                                        {data.tokenTitle}<br />
                                                        $ {data.price} ...購物車
                                                    </Card.Text>
                                                </Card.Body>
                                            </div>
                                        </OverlayTrigger>
                                    </Card>
                                </Link>
                            </Col>
                        ))                 
                    )}
                    {searchResults.length > 0 && searchResults.map((data, index) => (
                        <Col xs={6} md={3} className="pt-3" key={index}>
                            <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                <Card className="effect-image-1">
                                    <OverlayTrigger placement="top" overlay={renderTooltip(data.title, data.names)}>
                                        <div>
                                            <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                            <div className="nftMarket-overlay">
                                                <span>已售：{data.saleQty} 總數：{data.totQty}</span>
                                            </div>
                                            <Card.Body className="simple-text">
                                                <Card.Text className="nftMarket-text">
                                                    {data.tokenTitle}<br />
                                                    $ {data.price} ...購物車
                                                </Card.Text>
                                            </Card.Body>
                                        </div>
                                    </OverlayTrigger>
                                </Card>
                            </Link>
                        </Col>
                    ))}
                </Row>
                <Row className='pt-5'>
                    <h3 className="fw-bold">{t('推薦NFT')}</h3>
                </Row>
                <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example" className="mb-3">
                    <Tab 
                        eventKey="material" 
                        title={
                            <TooltipWrapper text={tooltips.material}>
                                <div>{t('素材')}</div>
                            </TooltipWrapper>
                        }
                    >
                        <Form.Group>
                            <Form.Label>{t('IP種類')}</Form.Label>
                            <Form.Control as="select" value={t(selectedGrading)} onChange={handleGradingChange}>
                                {grading.map((option, index) => (
                                    <option key={index} value={option}>{option}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                        <Row className='pt-1 pb-5'>
                            {filteredMaterials.map((data, index) => (
                                <Col xs={6} md={3} className="pt-3" key={index}>
                                    <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                        <Card className="effect-image-1">
                                            <OverlayTrigger placement="top" overlay={renderTooltip(data.title, data.names)}>
                                                <div>
                                                    <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                                    <div className="nftMarket-overlay">
                                                        <span>已售：{data.saleQty} 總數：{data.totQty}</span>
                                                    </div>
                                                    <Card.Body className="simple-text">
                                                        <Card.Text className="nftMarket-text">
                                                            {data.tokenTitle}<br />
                                                            $ {data.price} ...購物車
                                                        </Card.Text>
                                                    </Card.Body>
                                                </div>
                                            </OverlayTrigger>
                                        </Card>
                                    </Link>
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
                        <div onClick={handleSort} className='d-flex justify-content-end'>
                            {isAscending ? <SortNumericUp size={36} /> : <SortNumericDown size={36} />}
                        </div>
                        <Row className='pt-1 pb-5'>
                            {comic.filter(data => data.isFanCreation === t('原創')).map((data, index) => (
                                <Col key={index} xs={6} md={3} className="pt-3">
                                    <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                        <Card className="effect-image-1">
                                            <OverlayTrigger placement="top" overlay={renderTooltip(data.title, data.names)}>
                                                <div>
                                                    <Card.Img src={data.image} alt={`image-${index + 1}`} />
                                                    <div className="nftMarket-overlay">
                                                        <span>已售：{data.saleQty} 總數：{data.totQty}</span>
                                                    </div>
                                                    <Card.Body className="simple-text">
                                                    <Card.Text className="nftMarket-text">
                                                        {data.tokenTitle}<br />
                                                        $ {data.price} ...購物車
                                                    </Card.Text>
                                                    </Card.Body>
                                                </div>
                                            </OverlayTrigger>     
                                        </Card>
                                    </Link>
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
                        <div onClick={handleSort} className='d-flex justify-content-end'>
                            {isAscending ? <SortNumericUp size={36} /> : <SortNumericDown size={36} />}
                        </div>
                        <Row className='pt-1 pb-5'>
                            {comic
                                .filter(data => data.isFanCreation === t('轉售'))
                                .map((data, index) => (
                                    <Col key={index} xs={6} md={3} className="pt-3">
                                        <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                            <Card className="effect-image-1">
                                                <OverlayTrigger placement="top" overlay={renderTooltip(data.title, data.names)}>
                                                    <div>
                                                        <Card.Img src={data.image} alt={`image-${index + 1}`} />
                                                        <div className="nftMarket-overlay">
                                                            <span>已售：{data.saleQty} 總數：{data.totQty}</span>
                                                        </div>
                                                        <Card.Body className="simple-text">
                                                        <Card.Text className="nftMarket-text">
                                                            {data.tokenTitle}<br />
                                                            $ {data.price} ...購物車
                                                        </Card.Text>
                                                        </Card.Body>
                                                    </div>
                                                </OverlayTrigger>   
                                            </Card>
                                        </Link>
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
