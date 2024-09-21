import React, { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import { Container, Col, Row, Pagination, Image, Button } from 'react-bootstrap';
import './bootstrap.min.css';
import axios from 'axios';
import { sortByTimestamp } from '../index';
import Cover from '../image/1_春風化雨/封面.jpg';
const website = process.env.REACT_APP_Website;

function MintNFTSuccess() {
    const [comic, setComic] = useState([]);
    const [chapters, setChapters] = useState([]);
    const { comicID } = useParams();
    const [loading, setLoading] = useState(true);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    let temp = [];
    let chapterInfo = [];

    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON); // 假设 storedArrayJSON 是一个 JSON 字符串
            for (let i = 0; i < storedArray.length; i++) {
                if (storedArray[i].exists === 1) {
                    const filename = storedArray[i].filename;
                    const image = `${website}/api/comicIMG/${filename}`;
                    let protoFilename;
                    if (storedArray[i].protoFilename) {
                        protoFilename = `${website}/api/coverFile/${filename}/${storedArray[i].protoFilename}`;
                    } else {
                        protoFilename = image
                    }
                    if (storedArray[i].comicID === comicID) {
                        let author;
                        if (storedArray[i].author == currentAccount) {
                            author = '您是本作品的創作者!';
                        } else {
                            author = storedArray[i].author;
                        }
                        temp.push({
                            comicHash: storedArray[i].comicHash,
                            comicID: storedArray[i].comicID,
                            title: storedArray[i].title,
                            description: storedArray[i].description,
                            author: author,
                            category: storedArray[i].category,
                            protoFilename: protoFilename,
                        });
                    }
                }
            }
            setComic(temp);

            try {
                const response = await axios.get(`${website}/api/comicDetail`, {
                    params: {
                    comicHash: temp[0].comicHash,
                    currentAccount: currentAccount
                    }
                });
                let chapters = response.data;
                sortByTimestamp(chapters);

                for (let i = 0; i < chapters.length; i++) {
                    if (currentAccount == chapters[i].creator){
                        let id = 'Chapter' + (i+1);
                        chapterInfo.push({
                        title: chapters[i].title,
                        price: chapters[i].price,
                        chapterID: id
                        });
                    }
                }
                setChapters(chapterInfo);
                console.log(chapterInfo);
            } catch (error) {
                console.error('Error fetching records:', error);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    useEffect(() => {
        initData();
    }, [comicID, currentAccount]);

    return (
        <>
            <div>
                {!loading &&
                    <Container className='createSuccess'>
                        {/* 此處會放上該漫畫的封面+名稱供預覽 跟創作者頁面creatorPage的一樣*/}
                        <Row className="pt-4">
                            <Link to={`/comicDetail/${comic[0].comicID}`}>
                                <div className="d-block mx-auto img-fluid createSuccess-image-container">
                                    <img
                                    className="d-block mx-auto img-fluid"
                                    src={Cover}
                                    // src={comic[0].protoFilename}
                                    alt="800x400"
                                    />
                                </div>
                                <h5 className='text-center pt-2 pb-3'>{comic[0].title}</h5>
                            </Link>
                        </Row>
                        <Row className="justify-content-center text-center w-100">
                            <Col xs={12} md={8}>
                                <Image 
                                src="/Emoji.png"
                                alt="圖片" 
                                fluid 
                                rounded 
                                className="mb-4" 
                            />
                            <div className="mb-3">
                                <h3>NFT名稱</h3>
                                <h4>鑄造成功！</h4>
                            </div>
                            <Button>查看已鑄造NFT</Button>
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
        </>
    );
}

export default MintNFTSuccess;
