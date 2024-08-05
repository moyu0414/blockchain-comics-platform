import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { Container, Col, Row, Image, Button } from 'react-bootstrap';
import './bootstrap.min.css';
import EmojiImage from '../image/Emoji.png';
const website = process.env.REACT_APP_Website;

function CreateSuccess() {
    const [comic, setComic] = useState([]);
    const [loading, setLoading] = useState(true);
    const uploadComicData = localStorage.getItem("uploadComicData");
    const uploadArray = JSON.parse(uploadComicData);
    const currentAccount = localStorage.getItem("currentAccount");
    let temp = [];

    const initData = async () => {
        try {
            const comicHash = Object.keys(uploadArray)[0];
            const chapterTitle = uploadArray[comicHash];
            let found = false;
            while (!found) {
                const storedArrayJSON = localStorage.getItem('comicDatas');
                const storedArray = JSON.parse(storedArrayJSON);
                for (let i = 0; i < storedArray.length; i++) {
                    if (comicHash === storedArray[i].comicHash) {
                        const image = `${website}/api/comicIMG/${storedArray[i].filename}`;
                        temp.push({
                            comicID: storedArray[i].comicID,
                            title: storedArray[i].title,
                            image: image,
                            chapter: chapterTitle
                        });
                        found = true; // 找到匹配的 comicHash，可以退出循环
                        break;
                    }
                }
                if (!found) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒钟再尝试
                }
            }
            console.log(temp);
            setComic(temp);
            setLoading(false);
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    };

    useEffect(() => {
        initData();
    }, [currentAccount]);

    const handleCreator = () => {
        window.location.replace("/creatorPage");
    };

    const handleMGMT = () => {
        window.location.replace("/manageComic");
    };


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
                                    src={comic[0].image}
                                    alt="800x400"
                                    />
                                </div>
                                <h5 className='text-center pt-2 pb-1'>{comic[0].title}</h5>
                                <h5 className='text-center pb-3'>{comic[0].chapter}</h5>
                            </Link>
                        </Row>
                        <Row className="justify-content-center text-center w-100">
                            <Col xs={12} md={8}>
                                <Image 
                                    src={EmojiImage} 
                                    alt="圖片" 
                                    fluid 
                                    rounded 
                                    className="mb-4" 
                                />
                            <div className="mb-3">
                                <h4>漫畫上傳成功！</h4>
                            </div>
                            <Button onClick={handleCreator} style={{marginRight: "15px"}}>創作者專區</Button>
                            <Button onClick={handleMGMT}>漫畫管理</Button>
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

export default CreateSuccess;
