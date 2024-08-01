import React, { useState, useEffect } from 'react';
import { Container, Carousel, Card, Col, Row, Tabs, Tab, Form } from 'react-bootstrap';
import './bootstrap.min.css';
import { Link } from "react-router-dom";
import Web3 from 'web3';
import comicData from '../contracts/ComicPlatform.json';

function NftMarket() {
    const [comic, setComic] = useState([]);
    const [selectedGrading, setSelectedGrading] = useState();
    const [material, setMaterial] = useState([]);
    const [loading, setLoading] = useState(true);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const storedArray = JSON.parse(storedArrayJSON);
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

    let records = [];
    let temp = [];
    const comicHashMap = {};
    const uniqueKeyData = new Set();  // 用于存储已处理的 keyData
    const addedOriginals = new Set();  // 使用 Set 来追蹤已经添加的原创的 comicHash
    let comicStats = {};
    let CountComicDetails = {};


    const initData = async () => {
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(comicData.abi, comicData.address);
        const totCount = await contract.methods.tokenCounter().call();
        for (let i = 0; i < totCount; i++) {
            const data = await contract.methods.nfts(i).call();
            let price = data.price.toString() / 1e18;
            let tokenId = `tokenId${data.tokenId.toString()}`;
            const keyData = `${data.comicHash}-${price}-${data.royalty}-${data.description || ""}`;
            records.push({
                tokenId: tokenId,
                comicHash: data.comicHash,
                description: data.description,
                forSale: data.forSale,
                price: price,
                keyData: keyData
            });
            const uniqueKey = `${data.comicHash}-${price}-${data.royalty}-${data.description || ""}`;
            if (!comicStats[uniqueKey]) {
                comicStats[uniqueKey] = { tot: 0, sale: 0 };
            }
            comicStats[uniqueKey].tot += 1;
            if (!data.forSale) {
                comicStats[uniqueKey].sale += 1;
            }
        }
        records.forEach(record => {
            if (!comicHashMap[record.comicHash]) {
                comicHashMap[record.comicHash] = { true: [], false: [] };
            }
            comicHashMap[record.comicHash][record.forSale].push(record);
        });

        storedArray.forEach(stored => {
            if (stored.exists === 1) {
                const image = `http://localhost:5000/api/comicIMG/${stored.filename}`;
                const protoFilename = stored.protoFilename
                    ? `http://localhost:5000/api/coverFile/${stored.filename}/${stored.protoFilename}`
                    : image;
                const comicHash = stored.comicHash;
                if (comicHashMap[comicHash]) {
                    const availableRecords = comicHashMap[comicHash];
                    availableRecords.false.forEach(record => {
                        const descTitle = parseAuthorizations(record.description);
                        const firstName = descTitle[0]?.name || '';
                        temp.push({
                            title: stored.title,
                            description: record.description,
                            firstName: firstName,
                            image: protoFilename,
                            tokenId: record.tokenId,
                            isFanCreation: "轉售",
                        });
                    });
                    availableRecords.true.forEach(record => {
                        const { keyData, comicHash, description, tokenId } = record;
                        if (!uniqueKeyData.has(keyData)) {
                            const descTitle = parseAuthorizations(record.description);
                            const firstName = descTitle[0]?.name || '';
                            temp.push({
                                title: stored.title,
                                description: description,
                                firstName: firstName,
                                image: protoFilename,
                                tokenId: tokenId,
                                comicHash: comicHash,
                                isFanCreation: "原創",
                                totQty: comicStats[keyData]?.tot || 0,
                                saleQty: comicStats[keyData]?.sale || 0
                            });
                            uniqueKeyData.add(keyData);  // 标记 keyData 已经处理
                        }
                    });
                }
            }
        });
        //console.log(temp);
        setComic(temp);

        const materialData = temp.flatMap(item => {
            if (item.comicHash) {
                const authorizations = parseAuthorizations(item.description);
                return authorizations.map(auth => ({
                    tokenId: item.tokenId,
                    image: item.image,
                    title: item.title,
                    name: auth.name,
                }));
            }
            return [];
        }).reduce((acc, curr) => {
            if (!acc[curr.tokenId]) {
                acc[curr.tokenId] = {
                    tokenId: curr.tokenId,
                    image: curr.image,
                    title: curr.title,
                    names: [],
                };
            }
            acc[curr.tokenId].names.push(curr.name);
            return acc;
        }, {});
        console.log(materialData);
        setMaterial(materialData);

        setLoading(false);
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

    const images = [
        "https://via.placeholder.com/120x60?text=Image",
        "https://via.placeholder.com/120x60?text=Image",
        "https://via.placeholder.com/120x60?text=Image",
        "https://via.placeholder.com/120x60?text=Image"
    ];


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
                            <Link to={`/nftDetail/${data.tokenId}`}>
                                <Card className="effect-image-1">
                                    <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                    <div className="nftMarket-overlay-owner">{data.saleQty}/{data.totQty}</div>
                                    <div className="nftMarket-overlay">{data.firstName}</div>
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
                    <Tab eventKey="member" title="會員">
                        <Row className='pt-1 pb-5'>
                            {images.map((src, index) => (
                            <Col xs={6} md={3} className="pt-3">
                                <Card className="effect-image-1">
                                    <Card.Img variant="top" src={src} alt={`image-${index + 1}`} />
                                    <Card.Body className="simple-text">
                                        <Card.Text>名稱名稱</Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                            ))}
                        </Row>
                    </Tab>
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
                                    <Link to={`/nftDetail/${data.tokenId}`}>
                                        <Card className="effect-image-1">
                                            <Card.Img variant="top" src={data.image} alt={`image-${index + 1}`} />
                                            <div className="nftMarket-overlay">持有者</div>
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
                                    <Link to={`/nftDetail/${data.tokenId}`}>
                                    <Card className="effect-image-1">
                                        <Card.Img src={data.image} alt={`image-${index + 1}`} />
                                        <div className="nftMarket-overlay-owner">持有者</div>
                                        <div className="nftMarket-overlay">{data.firstName}</div>
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
                                    <Link to={`/nftDetail/${data.tokenId}`}>
                                    <Card className="effect-image-1">
                                        <Card.Img src={data.image} alt={`image-${index + 1}`} />
                                        <div className="nftMarket-overlay-owner">持有者</div>
                                        <div className="nftMarket-overlay">{data.firstName}</div>
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
