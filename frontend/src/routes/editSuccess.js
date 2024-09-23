import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { Container, Col, Row, Image, Button } from 'react-bootstrap';
import './bootstrap.min.css';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

function EditSuccess() {
    const [comic, setComic] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
    const editComicData = localStorage.getItem("editComicData");
    const editArray = JSON.parse(editComicData);
    const currentAccount = localStorage.getItem("currentAccount");
    const headers = {'api-key': API_KEY};
    let temp = [];

    const initData = async () => {
        try {
            //console.log(editArray);
            const comicHash = editArray.comicHash;
            const editFile = editArray.editFile;
            const editTitle = editArray.editTitle;
            const editChapter = editArray.editChapter;
            let found = false;
            while (!found) {
                const storedArrayJSON = localStorage.getItem('comicDatas');
                const storedArray = JSON.parse(storedArrayJSON);
                for (let i = 0; i < storedArray.length; i++) {
                    if ((!editFile || editFile !== storedArray[i].filename) && comicHash === storedArray[i].comic_id) {
                        const imageResponse = await axios.get(`${website}/api/comicIMG/${storedArray[i].filename}`, { responseType: 'blob', headers });
                        const image = URL.createObjectURL(imageResponse.data);
                        temp.push({
                            comicID: storedArray[i].comicID,
                            title: editTitle,
                            image: image,
                            editChapter: editChapter
                        });
                        found = true; // 找到匹配的条件或者不需要等待，可以退出循环
                        break;
                    }
                }
                if (!found) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒钟再尝试
                }
            }
            //console.log(temp);
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
                                <h5 className='text-center pb-3'>{comic[0].editChapter}</h5>
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
                                <h4>{t('漫畫編輯成功')}</h4>
                            </div>
                            <Button onClick={handleCreator} style={{marginRight: "15px"}}>{t('創作者專區')}</Button>
                            <Button onClick={handleMGMT}>{t('管理漫畫')}</Button>
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
        </>
    );
}

export default EditSuccess;
