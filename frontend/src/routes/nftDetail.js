import React, { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import { Container, Carousel, Card, Col, Row, ListGroup, Button } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import Web3 from 'web3';
import axios from 'axios';
import comicData from '../contracts/ComicPlatform.json';

function NftDetail() {
    const [web3, setWeb3] = useState(null);
    const [web3Instance, setWeb3Instance] = useState('');
    const [NFT, setNFT] = useState([]);
    const [IP, setIP] = useState([]);
    const { tokenId } = useParams();
    const [loading, setLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState('');
    const currentAccount = localStorage.getItem("currentAccount");
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const storedArray = JSON.parse(storedArrayJSON);
    const buttonData = [
        `$ ${NFT[0]?.price}`, '收藏'
    ];
    let records = [];
    let temp = [];

    const initData = async () => {
        const web3 = new Web3(window.ethereum);
        setWeb3(web3);
        const contract = new web3.eth.Contract(comicData.abi, comicData.address);
        setWeb3Instance(contract);
        let id = tokenId.replace("tokenId", "");
        const data = await contract.methods.nfts(id).call();

        let state = '原創授權';
        let author = data.minter.toLowerCase();
        let owner = data.minter.toLowerCase();
        if (data.forSale === false) {
            state = '二次轉售';
            owner = await contract.methods.ownerOf(id).call();
            owner = owner.toLowerCase();
        }
        if (owner == currentAccount) {
            owner = '您擁有此NFT!';
        }
        if (author == currentAccount) {
            author = '您是本作品創作者!';
        }
        let price = data.price.toString() / 1e18;
        records.push({
            comicHash: data.comicHash,
            description: data.description,
            author: author,
            owner: owner,
            state: state,
            price: price,
        });
        //console.log(records);

        for (let i = 0; i < storedArray.length; i++) {
            if (storedArray[i].exists === 1) {
                const image = `http://localhost:5000/api/comicIMG/${storedArray[i].filename}`;
                let protoFilename = storedArray[i].protoFilename 
                    ? `http://localhost:5000/api/coverFile/${storedArray[i].filename}/${storedArray[i].protoFilename}` 
                    : image;
                const comicHash = storedArray[i].comicHash;
                const matchedRecord = records.find(record => record.comicHash === comicHash);
                if (matchedRecord) {
                    temp.push({
                        comicHash: comicHash,
                        title: storedArray[i].title,
                        image: protoFilename,
                        comicDesc: storedArray[i].description,
                        nftDesc: matchedRecord.description,
                        owner: matchedRecord.owner,
                        state: matchedRecord.state,
                        price: matchedRecord.price,
                        author: matchedRecord.author,
                        owner: matchedRecord.owner
                    });
                }
            }
        }
        console.log(temp);
        setNFT(temp);
        const authorizations = parseAuthorizations(temp[0].nftDesc);
        setIP(authorizations);

        try {
            const response = await axios.get('http://localhost:5000/api/nftDetail/isFavorited', {
                params: {
                    currentAccount: currentAccount,
                    comicHash: temp[0].comicHash
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
            const response = await axios.put('http://localhost:5000/api/update/nftDetail/favorite', null, {
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
        if (NFT[0].owner !== '您擁有此NFT!' && NFT[0].author !== '您是本作品創作者!') {
            try {
                let balance = await web3.eth.getBalance(currentAccount);
                balance = balance.toString() / 1e18;
                let price = NFT[0].price;
                if (balance > price) {
                    let id = tokenId.replace("tokenId", "");
                    price = web3.utils.toWei(price, 'ether');
                    await web3Instance.methods.purchaseNFT(id).send({from: currentAccount, value: price,});
            
                    alert('NFT 購買成功！');
                    const updatedNFT = [...NFT];
                    updatedNFT[0].owner = '您擁有此NFT!'; // 更新購買狀態
                    setNFT(updatedNFT);
                } else {
                    console.log('餘額不足');
                    alert('餘額不足');
                }
            } catch (error) {
                console.error('購買NFT發生錯誤：', error);
                alert(error);
            }
        } else {
            alert('您已經擁有此NFT了，不須再購買!');
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
                                <Button variant="outline-dark" className="custom-button" onClick={label === '收藏' ? handleFavoriteClick : handlePurchase}>
                                    {label === '收藏' && (
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
                                    <p className="text-secondary">作者:<br />{data.author}</p>
                                    <p className="text-secondary">持有者:<br />{data.owner}</p>
                                    <p className="text-secondary">{data.comicDesc}</p>
                                </React.Fragment>
                            ))}
                        </Col>
                    </Row>
                    <Row className="pt-1">
                        <Col className="text-section">
                            <h3 className="fw-bold">授權範圍</h3>
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
                            <h3 className="fw-bold">授權說明</h3>
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
                     <div>頁面加載中，請稍後...</div>
                 </div>
             }
        </div>
    );
}

export default NftDetail;
