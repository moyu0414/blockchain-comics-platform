import React, { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import { Container, Carousel, Card, Col, Row, ListGroup } from 'react-bootstrap';
import './bootstrap.min.css';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import BootstrapTable from 'react-bootstrap-table-next';
import axios from 'axios';
import { sortByTimestamp } from '../index';

function NftDetail() {
    const [comic, setComic] = useState([]);
    const [similComic, setSimilComic] = useState([]);
    const [chapters, setChapters] = useState([]);
    const { comicID } = useParams();
    const [loading, setLoading] = useState(true);
    const storedArrayJSON = localStorage.getItem('comicDatas');
    const currentAccount = localStorage.getItem("currentAccount");
    const fetchedData = [];
    let temp = [];
    let chapterInfo = [];

    const initData = async () => {
        try {
            const storedArray = JSON.parse(storedArrayJSON); // 假设 storedArrayJSON 是一个 JSON 字符串
            for (let i = 0; i < storedArray.length; i++) {
                if (storedArray[i].exists === 1) {
                    const filename = storedArray[i].filename;
                    const image = `http://localhost:5000/api/comicIMG/${filename}`;
                    let protoFilename;
                    if (storedArray[i].protoFilename) {
                        protoFilename = `http://localhost:5000/api/coverFile/${filename}/${storedArray[i].protoFilename}`;
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

            for (let i = 0; i < storedArray.length; i++) {
                // 類似漫畫 依據類型跟同作者取前4本
                if ((storedArray[i].category == temp[0].category || storedArray[i].author == temp[0].author) && storedArray[i].comicID != comicID) {
                    const image = `http://localhost:5000/api/comicIMG/${storedArray[i].filename}`;
                    fetchedData.push({
                        comicID: storedArray[i].comicID,
                        title: storedArray[i].title,
                        description: storedArray[i].description,
                        author: storedArray[i].author,
                        category: storedArray[i].category,
                        image: image,
                    });
                }
                if (fetchedData.length == 4) {
                    break;
                }
            }
            setSimilComic(fetchedData);

            // 章節購買者
            try {
                const response = await axios.get('http://localhost:5000/api/comicDetail', {
                    params: {
                    comicHash: temp[0].comicHash,
                    currentAccount: currentAccount
                    }
                });
                let chapters = response.data;
                sortByTimestamp(chapters);

                for (let i = 0; i < chapters.length; i++) {
                    if (chapters[i].creator == currentAccount) {
                        chapters[i].isBuying = '閱讀';
                    } else if (chapters[i].isBuying !== null) {
                        chapters[i].isBuying = '閱讀';
                    } else {
                        chapters[i].isBuying = '購買';
                    }
                }
                //console.log(chapters);
                setChapters(chapters);

                let lastChapterInfo = chapters[chapters.length - 1];
                let updatedComic = temp.map(comic => {
                    return {...comic, chapter: lastChapterInfo.title};
                });
                setComic(updatedComic);
                //console.log(updatedComic);
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
    }, [comicID]);

    const buttonData = [
        '開始閱讀', '收藏'
    ];

    
    const [isFavorited, setIsFavorited] = useState(false); // 初始狀態為為收藏

    const handleFavoriteClick = () => {
        setIsFavorited(!isFavorited); // 切換收藏狀態
    };


    return (
        // <div>
        //     {!loading &&
                <Container className='comicDetail'>
                    <Row className="pt-5">
                        <div className="d-block mx-auto img-fluid carousel-image-container">
                            <img
                            className="d-block mx-auto img-fluid"
                            // src={comic[0].protoFilename}
                            src='https://via.placeholder.com/120x60?text=Image'
                            alt="800x400"
                            />
                        </div>
                    </Row>
                    <Row>
                        <Col className="text-section">
                            {comic.map((comic, index) => (
                                <React.Fragment >
                                    <h3 className="fw-bold">{comic.title}</h3>
                                    <p className="text-secondary">{comic.author}</p>
                                    <p className="text-secondary">{comic.description}</p>
                                </React.Fragment>
                            ))}
                        </Col>
                    </Row>
                    <Row className="pt-5">
                        <Col className="text-section">
                            <h3 className="fw-bold">授權範圍</h3>
                            <ul>
                                <li>授權的敘述</li>
                                <li>授權的敘述</li>
                                <li>授權的敘述</li>
                                <li>授權的敘述</li>
                            </ul>
                        </Col>
                    </Row>
                </Container>
        //     }
        //     {loading &&  
        //         <div className="loading-container">
        //             <div>頁面加載中，請稍後...</div>
        //         </div>
        //     }
        // </div>
    );
}

export default NftDetail;
