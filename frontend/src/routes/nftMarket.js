import React, { useState, useEffect } from 'react';
import { Container, Carousel, Card, Col, Row, Tabs, Tab, Form } from 'react-bootstrap';
import './bootstrap.min.css';
import { Link } from "react-router-dom";
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function NftMarket() {
    const [comic, setComic] = useState([]);
    const [selectedGrading, setSelectedGrading] = useState('角色商品化');
    const [material, setMaterial] = useState([]);
    const [loading, setLoading] = useState(true);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const storedArray = JSON.parse(storedArrayJSON);
    const currentAccount = localStorage.getItem("currentAccount");
    const headers = {'api-key': API_KEY};
    const [grading, setGrading] = useState([
        "角色商品化",
        "改編權",
        "廣告宣傳",
        "專屬會員卡",
        "粉絲俱樂部徽章",
        "線上社區認證",
        "數位平台使用",
        "其他"
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
                const updatedRecord = {
                    ...item, // 保留原有属性
                    isFanCreation: item.forSale ? "原創" : "轉售", // 添加新属性
                    keyData
                };
                allRecord.push(updatedRecord);
                if (!comicStats[keyData]) {
                    comicStats[keyData] = { tot: 0, sale: 0 };
                }
                comicStats[keyData].tot += 1;
                if (item.forSale === 0) { // 已售出的 NFT
                    comicStats[keyData].sale += 1;
                }
            });
            const keyhMap = allRecord.map(record => ({
                ...record,
                ...(record.isFanCreation === "原創" ? {
                    totQty: comicStats[record.keyData]?.tot || 0,
                    saleQty: comicStats[record.keyData]?.sale || 0
                } : {})
            }));
            keyhMap.forEach(record => {
                const { isFanCreation, keyData } = record;
                if (isFanCreation === "原創") {
                    if (!CountComicDetails[keyData]) {
                        CountComicDetails[keyData] = true;
                        temp.push(record);
                    }
                } else {
                    temp.push(record);
                }
            });
            const fetchImageAndNames = async (data) => {
                const url = data.protoFilename === 1
                    ? `${website}/api/coverFile/${data.filename}/${data.protoFilename}`
                    : `${website}/api/comicIMG/${data.filename}`;
                const response = await axios.get(url, { responseType: 'blob', headers });
                const protoFilename = URL.createObjectURL(response.data);
                data.image = protoFilename;
                data.names = parseAuthorizations(data.description).map(auth => auth.name);
            };
            await Promise.all(temp.map(fetchImageAndNames));
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
                name: name.trim(),
            };
        });
    };

    const handleGradingChange = (event) => {
        setSelectedGrading(event.target.value);
    };

    const filteredMaterials = Object.values(material).filter(data => {
        if (selectedGrading === '其他') {
            return data.names.some(name => !grading.includes(name));
        } else {
            return data.names.includes(selectedGrading);
        }
    });

    const truncateText = (text, maxLength) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const truncateLastText = (text, maxLength) => {
        if (text.length > maxLength) {
            const end = text.slice(-maxLength); // 获取最后 maxLength 个字符
            return `...${end}`;
        }
        return text;
    };

    const truncateTextForName = (text) => {
        const isChinese = (char) => /[\u4e00-\u9fa5]/.test(char);
        const maxLength = text.split('').some(isChinese) ? 6 : 12;  // 中文6個字、英文12個字
        return truncateText(text, maxLength);
    };


    return (
        <>
        {!loading &&
            <Container className='nftMarket'>
                <Row className='pt-5'>
                    <h3 className="fw-bold">大家都在買</h3>
                </Row>
                <Row className='pt-1 pb-5'>
                    {comic.filter(data => data.isFanCreation === '原創').map((data, index) => (
                        <Col xs={6} md={3} className="pt-3">
                            <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                <Card className="effect-image-1">
                                    <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                    <div className="nftMarket-overlay-owner">{data.saleQty}/{data.totQty}</div>
                                    <div className="nftMarket-overlay">{truncateTextForName(data.names[0])}</div>
                                    <Card.Body className="simple-text">
                                        <Card.Text>{data.title}</Card.Text>
                                    </Card.Body>
                                </Card>
                            </Link>
                        </Col>
                    ))}
                </Row>
                <Row className='pt-5'>
                    <h3 className="fw-bold">推薦NFT</h3>
                </Row>
                <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example" className="mb-3">
                    <Tab eventKey="material" title="素材">
                        <Form.Group>
                            <Form.Label>IP種類</Form.Label>
                            <Form.Control as="select" value={selectedGrading} onChange={handleGradingChange}>
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
                                            <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                            <div className="nftMarket-overlay-owner">{truncateLastText(data.owner, 4)}</div>
                                            <div className="nftMarket-overlay">{truncateTextForName(data.names[0])}</div>
                                            <Card.Body className="simple-text">
                                                <Card.Text>{data.title}</Card.Text>
                                            </Card.Body>
                                        </Card>
                                    </Link>
                                </Col>
                            ))}
                        </Row>
                    </Tab>
                    <Tab eventKey="copyright" title="原創">
                        <Row className='pt-1 pb-5'>
                            {comic.filter(data => data.isFanCreation === '原創').map((data, index) => (
                                <Col key={index} xs={6} md={3} className="pt-3">
                                    <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                    <Card className="effect-image-1">
                                        <Card.Img src={data.image} alt={`image-${index + 1}`} />
                                        <div className="nftMarket-overlay-owner">{truncateLastText(data.owner, 4)}</div>
                                        <div className="nftMarket-overlay">{truncateTextForName(data.names[0])}</div>
                                        <Card.Body className="simple-text">
                                        <Card.Text>{data.title}</Card.Text>
                                        </Card.Body>
                                    </Card>
                                    </Link>
                                </Col>
                            ))}
                        </Row>
                    </Tab>
                    <Tab eventKey="resale" title="轉售">
                        <Row className='pt-1 pb-5'>
                            {comic.filter(data => data.isFanCreation === '轉售').map((data, index) => (
                                <Col key={index} xs={6} md={3} className="pt-3">
                                    <Link to={`/nftDetail/tokenId${data.tokenId}`}>
                                    <Card className="effect-image-1">
                                        <Card.Img src={data.image} alt={`image-${index + 1}`} />
                                        <div className="nftMarket-overlay-owner">{truncateLastText(data.owner, 4)}</div>
                                        <div className="nftMarket-overlay">{truncateTextForName(data.names[0])}</div>
                                        <Card.Body className="simple-text">
                                        <Card.Text>{data.title}</Card.Text>
                                        </Card.Body>
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
                <div>頁面加載中，請稍後...</div>
            </div>
        }
        </>
    );
}

export default NftMarket;
