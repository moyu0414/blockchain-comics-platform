import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Image } from 'react-bootstrap';
import { useParams } from "react-router-dom";
import { formatDate } from '../index';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const AuthorProfile = () => {
    const [info , setInfo] = useState([])
    const [msg , setMsg] = useState([])
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editableInfo, setEditableInfo] = useState([]);
    const [addMsgInfo, setAddMsgInfo] = useState({date: '', msg: ''});
    const [isBeing, setIsBeing] = useState(false);
    const [loading, setLoading] = useState(true);
    const { account } = useParams();
    const currentAccount = localStorage.getItem("currentAccount");
    const { t } = useTranslation();
    const headers = {'api-key': API_KEY};

    const initData = async () => {
        try {
            try {
                const response = await axios.get(`${website}/api/authorProfile`, {
                    headers: headers,
                    params: {
                        currentAccount: account
                    }
                });
                let infoData = response.data;
                if (infoData.length !== 0) {
                    const imageResponse = await axios.get(`${website}/api/creatorIMG/${account}`, { responseType: 'blob', headers });
                    const image = URL.createObjectURL(imageResponse.data);

                    const updateInfo = infoData.map(data => ({
                        penName: data.penName,
                        email: data.info.email,
                        intro: data.info.intro,
                        image: image
                    }));
                    setEditableInfo({
                        penName: updateInfo[0].penName,
                        email: updateInfo[0].email,
                        intro: updateInfo[0].intro ? updateInfo[0].intro : '',
                    });
                    const reversedEntries = (infoData[0].info.BBS ? 
                        Object.entries(infoData[0].info.BBS) : []
                    ).reverse() // 反转数组
                      .map(([date, msg]) => ({
                          date,
                          msg,
                      }));
                    console.log(reversedEntries);
                    setMsg(reversedEntries);
                    console.log(updateInfo[0]);
                    setInfo(updateInfo[0]);
                    setIsBeing(true);
                    setLoading(false);
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching records:', error);
            }
        } catch (error) {
            console.error('Error initializing data:', error);
        }
    };

    useEffect(() => {
        initData();
    }, [account]);

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleAddToggle = () => {
        setIsAdding(!isAdding);
    };
    

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditableInfo(prevInfo => ({
            ...prevInfo,
            [name]: value
        }));
    };

    const handleAddMsg = (e) => {
        const { name, value } = e.target;
        setAddMsgInfo(prevInfo => ({
            ...prevInfo,
            [name]: value
        }));
    };

    const handleEdit = async () => {
        try {
            const updatedFormData = { ...editableInfo, account: currentAccount };
            const response = await axios.put(`${website}/api/update/EditProfile`, updatedFormData, { headers });
            if (response.data.state) {
                alert(t('資料更新成功!'));
                window.location.reload();
            } else {
                alert(t('資料更新失敗!'));
            }
        } catch (error) {
            console.error('Mailbox verification error:', error);
        }
        setIsEditing(false);
    };

    const handleAdd = async () => {
        if (addMsgInfo.msg == '') {
            alert(t('目前您未編輯任何東西'));
            return;
        }
        const date = new Date().toISOString().replace('T', ' ').split('.')[0];
        const updateMsgInfo = {
            ...addMsgInfo,
            date: date,
            account: currentAccount
        };
        try {
            const response = await axios.put(`${website}/api/update/AddProfile`, updateMsgInfo, { headers });
            console.log(response.data);
            if (response.data.state) {
                alert(t('訊息新增成功!'));
                window.location.reload();
            } else {
                alert(t('訊息新增失敗!'));
            }
        } catch (error) {
            console.error('Mailbox verification error:', error);
        }
        setIsAdding(false);
    };


    return (
        <>
        {!loading &&
            <Container className='authorProfile pt-4'>
                {!isBeing && (
                    <Row className='pt-5 justify-content-center'>
                        <h1 className="fw-bold text-center">{t('這個創作者不存在，請稍後再試!')}</h1>
                    </Row>
                )}
                {isBeing &&  (
                    <>
                    <Row className="profile my-4 pb-4">
                        <Col xs={12} md={4} className="text-center profile-section">
                            <img 
                                src={info.image} 
                                className="rounded-circle" 
                                fluid="true" 
                                alt="Author"
                            />
                        </Col>
                        <Col xs={12} md={8} className='profile-text-section'>
                        <Card>
                            <Card.Body>
                                <Card.Title>
                                    作者筆名：
                                    {isEditing ? (
                                        <Form.Control
                                            type="text"
                                            name="penName"
                                            value={editableInfo.penName}
                                            onChange={handleChange}
                                        />
                                    ) : (
                                        info.penName
                                    )}
                                </Card.Title>
                                <Card.Text>作者帳號： {account}</Card.Text>
                                <Card.Text>
                                    作者 Email：
                                    {isEditing ? (
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={editableInfo.email}
                                            onChange={handleChange}
                                        />
                                    ) : (
                                        info.email
                                    )}
                                </Card.Text>
                                <Card.Text>
                                    作者簡介：
                                    {isEditing ? (
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="intro"
                                            value={editableInfo.intro || ''}
                                            onChange={handleChange}
                                        />
                                    ) : (
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: (info.intro || '').replace(/\n/g, '<br/>') || '這是一段簡短的作者介紹。'
                                            }}
                                            style={{ marginLeft: "20px" }}
                                        />
                                    )}
                                </Card.Text>
                                {currentAccount === account && (
                                    <>
                                        {isEditing ? (
                                            <>
                                                <Button variant="primary" onClick={handleEdit}>提交</Button>
                                                <Button variant="secondary" onClick={handleEditToggle}>取消</Button>
                                            </>
                                        ) : (
                                                <Button variant="primary" onClick={handleEditToggle}>個資編輯</Button>
                                        )}
                                        {isAdding ? (
                                            <>
                                                <Button variant="primary" onClick={handleAdd}>提交</Button>
                                                <Button variant="secondary" onClick={handleAddToggle}>取消</Button>
                                            </>
                                        ) : (
                                                <Button variant="primary" onClick={handleAddToggle}>新增訊息</Button>
                                        )}
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                        </Col>
                    </Row>
                    <Row className="my-4">
                        <Col xs={12}>
                            <Card>
                                {isAdding && (
                                    <Card.Body className='post-section'>
                                        <Card.Text>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    name="msg"
                                                    value={addMsgInfo.msg}
                                                    onChange={handleAddMsg}
                                                />
                                        </Card.Text>
                                    </Card.Body>
                                )}
                                <h4><center>訊息公告</center></h4>
                                {msg.map((date, index) => (
                                    <div key={date.date}>
                                        <Card.Header>
                                            <Row className="align-items-center">
                                                <Col xs={2} className='post-author'>
                                                    <img 
                                                        src={info.image} 
                                                        className="rounded-circle" 
                                                        fluid="true" 
                                                        alt="Author"
                                                    />
                                                </Col>
                                                <Col xs={10}>
                                                    <strong>{info.penName}</strong>
                                                    <p className="mb-0 text-muted">
                                                        <strong>{date.date}</strong>
                                                    </p>
                                                </Col>
                                            </Row>
                                        </Card.Header>
                                        <Card.Body className='post-section'>
                                            <Card.Text>
                                                <div>{date.msg.split('\n').map((line, index) => <div key={index}>{line}</div>)}</div>
                                            </Card.Text>
                                        </Card.Body>
                                    </div>
                                ))}
                            </Card>
                        </Col>
                    </Row>
                    </>
                )}
            </Container>
        }
        {loading &&  
            <div className="loading-container">
                <div>{t('頁面加載中')}</div>
            </div>
        }
        </>
    );
};

export default AuthorProfile;