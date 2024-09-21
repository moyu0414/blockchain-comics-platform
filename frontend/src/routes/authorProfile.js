import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Image } from 'react-bootstrap';
import { useParams } from "react-router-dom";
import { message } from 'antd';
import { formatDate, disableAllButtons, enableAllButtons } from '../index';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
import './bootstrap.min.css';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const AuthorProfile = () => {
    const [info , setInfo] = useState([])
    const [msg , setMsg] = useState([])
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editableInfo, setEditableInfo] = useState([]);
    const [addMsgInfo, setAddMsgInfo] = useState({date: '', msg: ''});
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [isEditEmail, setIsEditEmail] = useState(false);
    const [isBeing, setIsBeing] = useState(false);
    const [loading, setLoading] = useState(true);
    const { account } = useParams();
    const inputRefs = useRef([]);
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
                //console.log('Account:', account);
                let infoData = response.data;
                if (infoData.length !== 0) {
                    const imageResponse = await axios.get(`${website}/api/creatorIMG/${account}`, { responseType: 'blob', headers });
                    const image = URL.createObjectURL(imageResponse.data);

                    const updateInfo = infoData.map(data => ({
                        penName: data.penName,
                        email: data.info.editEamil ? data.info.editEamil : data.info.email,
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
                    setMsg(reversedEntries);
                    //console.log(updateInfo[0]);
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
            disableAllButtons();
            if (editableInfo.email === '') {
                message.info(t('email不可為空!'));
                enableAllButtons();
                return;
            } else if (editableInfo.penName === '') {
                message.info(t('筆名不可為空!'));
                enableAllButtons();
                return;
            } else if (editableInfo.penName === info.penName && editableInfo.email === info.email && editableInfo.intro === info.intro) {
                message.info(t('目前您未編輯任何東西'));
                enableAllButtons();
                return;
            } else if (editableInfo.email !== info.email) {
                try {
                    const editEamil = { editEamil: editableInfo.email, account: currentAccount, penName: editableInfo.penName };
                    const response = await axios.post(`${website}/api/authorProfile-send-verification-email`, editEamil, { headers });
                    if (response.data.state) {
                        message.info(t('驗證碼15分鐘內有效!'));
                        setIsEditEmail(true);
                        startCountdown();
                    } else {
                        message.info(t('email發送錯誤，請重新再試!'));
                    }
                } catch (error) {
                    console.error('Mailbox verification error:', error);
                }
            } else {
                try {
                    const updatedFormData = { ...editableInfo, account: currentAccount };
                    const response = await axios.put(`${website}/api/update/EditProfile`, updatedFormData, { headers });
                    if (response.data.state) {
                        window.location.reload();
                    } else {
                        message.info(t('資料更新失敗!'));
                    }
                } catch (error) {
                    console.error('Mailbox verification error:', error);
                }
                setIsEditing(false);
            }
            enableAllButtons();
        } catch (error) {
            console.error('Mailbox verification error:', error);
        }
        setIsEditing(false);
    };

    const handleAdd = async () => {
        if (addMsgInfo.msg == '') {
            message.info(t('目前您未編輯任何東西'));
            return;
        }
        disableAllButtons();
        const date = new Date().toISOString().replace('T', ' ').split('.')[0];
        const updateMsgInfo = {
            ...addMsgInfo,
            date: date,
            account: currentAccount
        };
        try {
            const response = await axios.put(`${website}/api/update/AddProfile`, updateMsgInfo, { headers });
            //console.log(response.data);
            if (response.data.state) {
                window.location.reload();
            } else {
                message.info(t('訊息新增失敗!'));
            }
            enableAllButtons();
        } catch (error) {
            console.error('Mailbox verification error:', error);
        }
        setIsAdding(false);
    };

    const startCountdown = () => {
        setIsButtonDisabled(true);
        setSecondsLeft(60);
        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsButtonDisabled(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleClick = async () => {
        try {
          const verificationCode = inputRefs.current.map(input => input.value).join('');
          if (!verificationCode || !currentAccount) {
            alert('Verification code and account are required.');
            return;
          }
          const formData = { token: verificationCode, account: currentAccount };
          const response = await axios.post(`${website}/api/authorProfile-verify-email`, formData, { headers });
      
          const { state, message } = response.data;
          if (state) {
            try {
                const updatedFormData = { ...editableInfo, account: currentAccount };
                const response = await axios.put(`${website}/api/update/EditProfile`, updatedFormData, { headers });
                if (response.data.state) {
                    window.location.reload();
                } else {
                    message.info(t('資料更新失敗!'));
                }
            } catch (error) {
                console.error('Mailbox verification error:', error);
            }
          } else {
            alert(`${t('驗證錯誤')}: ${message}`);
          }
        } catch (error) {
          console.error('Verify email error:', error);
          message.info(t('電子郵件驗證錯誤，請重新在試!'));
        }
      };
      

    const handleInputChange = (e, index) => {
        const inputs = inputRefs.current;
        if (e.target.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
        if (e.target.value.length === 0 && index > 0) {
            inputs[index - 1].focus();
        }
    };

    const isComplete = () => {
        const verificationCode = inputRefs.current.map(input => input.value).join('');
        return verificationCode.length === 6;
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
                                    {t('作者筆名')}：
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
                                <Card.Text>{t('作者帳號')}： {account}</Card.Text>
                                <Card.Text>
                                    {t('作者 Email')}：
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
                                    {t('作者簡介')}：
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
                                                __html: (info.intro || '').replace(/\n/g, '<br/>') || t('這是一段簡短的作者介紹。')
                                            }}
                                            style={{ marginLeft: "20px" }}
                                        />
                                    )}
                                </Card.Text>
                                {currentAccount === account && (
                                    <div className="authorProfile-btn">
                                        {isEditing ? (
                                            <>
                                                <Button className='profile-send' variant="primary" onClick={handleEdit}>{t('提交')}</Button>
                                                <Button className='profile-cancel' variant="secondary" onClick={handleEditToggle}>{t("取消")}</Button>
                                                <br />
                                            </>
                                        ) : (
                                                <Button className='profile-edit' variant="primary" onClick={handleEditToggle} disabled={isButtonDisabled}>{t('個資編輯')}</Button>
                                        )}
                                        {isAdding ? (
                                            <>
                                                <br />
                                                <Button className='profile-send' variant="primary" onClick={handleAdd}>{t('提交')}</Button>
                                                <Button className='profile-cancel' variant="secondary" onClick={handleAddToggle}>{t('取消')}</Button>
                                            </>
                                        ) : (
                                                <Button className='profile-add' variant="primary" onClick={handleAddToggle} disabled={isButtonDisabled}>{t('新增訊息')}</Button>
                                        )}
                                        {isEditEmail && (
                                            <>
                                            <Form.Group controlId="formVerificationCode" className=" mb-3">
                                                {isButtonDisabled && (
                                                    <p className="mt-4 " style={{ marginBottom: "-10px" }}>{t('60秒後再啟動按鈕-幾秒', { secondsLeft: secondsLeft })}</p>
                                                 )}
                                                <Form.Label className="verification">{t('信箱驗證碼')}</Form.Label>
                                                <div className="verification-code-inputs w-100">
                                                    {[...Array(6)].map((_, index) => (
                                                        <Form.Control
                                                        key={index}
                                                        type="text"
                                                        maxLength="1"
                                                        className="verification-code-input"
                                                        ref={(el) => (inputRefs.current[index] = el)}
                                                        onChange={(e) => handleInputChange(e, index)}
                                                    />
                                                    ))}
                                                </div>
                                            </Form.Group>
                                            <div className="verification-btn-section mt-4 w-100">
                                                <Button 
                                                    onClick={handleClick}
                                                    variant={isComplete() ? 'success' : 'secondary'}
                                                    disabled={!isComplete()}
                                                    className="verify-btn"
                                                >{t('驗證')}</Button>
                                            </div>
                                            </>
                                        )}
                                    </div>
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
                                <h4><center>{t('訊息公告')}</center></h4>
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