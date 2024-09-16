import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button, Modal } from 'react-bootstrap';
import { CardImage } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import { initializeWeb3, disableAllButtons, enableAllButtons } from '../index';
import comicData from '../contracts/ComicPlatform.json';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const VerifyPage = () => {
    const [formData, setFormData] = useState({name: '', penName: '', email: '', account: ''});
    const [account, setAccount] = useState('');
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [file, setFile] = useState([]);
    const [previewImg, setPreviewImg] = useState('');
    const [ipAddress, setIpAddress] = useState('');
    //const [checked, setChecked] = useState(false);
    const [info, setInfo] = useState({ version: '', ip: '', deviceInfo: '', timestamp: '' });
    const [showModal, setShowModal] = useState(false);
    const inputRefs = useRef([]);
    const { t } = useTranslation();
    const headers = {'api-key': API_KEY};

    useEffect(() => {
        const fetchIPAddress = async () => {
            const web3 = await initializeWeb3(t);
            if (!web3) {
                return;
            }
            const web3Instance = new web3.eth.Contract(comicData.abi, comicData.address);
            const accounts = await web3.eth.getAccounts();
            if (accounts[0]) {
                const isCreator = await web3Instance.methods.creators(accounts[0]).call();
                if (isCreator) {
                    alert(t('您已經是創作者了!'));
                    window.location.replace('/readerPage');
                };
                setAccount(accounts[0].toLowerCase());
                try {
                    const response = await axios.get(`${website}/api/getIP`, { headers });
                    const getDeviceInfo = () => ({
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                    });
                    setInfo({
                        version: '1.0',
                        ip: response.data.ip,
                        deviceInfo: JSON.stringify(getDeviceInfo()),
                        timestamp: new Date().toISOString(),
                    });
                    setShowModal(true);
                } catch (error) {
                    alert('Error fetching IP address: ' + error);
                }
            } else {
                alert(t('請先登入以太坊錢包，才開放創作者認證'));
                return;
            }
        };

        fetchIPAddress();
    }, [account]);

    const TermsModal = ({ onAccept }) => {
        const [checked, setChecked] = useState(false);
        const navigate = useNavigate();
        const handleAccept = () => {
            if (checked) {
                onAccept();
                setShowModal(false);
            } else {
                alert(t('請同意平台的使用條款，才能進行帳號驗證!'));
            }
        };
        const handleReject = () => {
            setShowModal(false);
            navigate('/readerPage');
        };
        return (
            <Modal show={showModal} onHide={handleReject} centered dialogClassName="verify-custom-modal">
                <Modal.Header closeButton>
                    <Modal.Title>
                    <b>web3toon</b> {t('使用條款')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{t('歡迎使用')} <b>web3toon</b> {t('前言')}</p>
                    <p>1. **{t('服務內容')}**</p>
                    <p>{t('服務內容_條款')}</p>
                    <p>2. **{t('用戶責任')}**</p>
                    <p>{t('用戶責任_條款')}</p>
                    <p>3. **{t('知識產權')}**</p>
                    <p>{t('知識產權_條款')}</p>
                    <p>4. **{t('隱私政策')}**</p>
                    <p>{t('隱私政策_條款')}</p>
                    <p>5. **{t('盜版及非法作品處理')}**</p>
                    <p>{t('盜版及非法作品處理_條款')}</p>
                    <p>6. **{t('責任免除')}**</p>
                    <p>{t('責任免除_條款')}</p>
                    <p>7. **{t('條款變更')}**</p>
                    <p>{t('條款變更_條款')}</p>
                    <p>8. **{t('爭議解決')}**</p>
                    <p>{t('爭議解決_條款')}</p>
                    <p>9. **{t('其他')}**</p>
                    <p>{t('其他_條款')}</p>

                    <Form.Group className="mb-3">
                    <Form.Check
                        type="checkbox"
                        label={t('我同意上述的使用條款')}
                        checked={checked}
                        onChange={() => setChecked(!checked)}
                    />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleReject}>
                    {t('拒絕')}
                    </Button>
                    <Button variant="primary" onClick={handleAccept}>
                    {t('接受')}
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const isFormComplete = () => {
        return formData.name && formData.penName && formData.email && file.length !== 0;
    };

    const isComplete = () => {
        const verificationCode = inputRefs.current.map(input => input.value).join('');
        return formData.name && formData.penName && formData.email && file.length !== 0 && verificationCode.length === 6;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.penName.length > 30) {
            alert(t('筆名不可超過30字！'));
            return;
        };
        try {
            const updatedFormData = { ...formData, account: account };
            const response = await axios.post(`${website}/api/send-verification-email`, updatedFormData, { headers });
            if (response.data.state) {
                alert(t('驗證碼15分鐘內有效!'))
                startCountdown();
            } else {
                alert(t('email發送錯誤，請重新再試!'))
            }
        } catch (error) {
            console.error('Mailbox verification error:', error);
        }
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

    const handleInputChange = (e, index) => {
        // 確保每個輸入框的參考數組都有對應的值
        const inputs = inputRefs.current;

        // 移動到下一個輸入框
        if (e.target.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
        }

        // 防止用戶刪除輸入內容時焦點不會回到前一個輸入框
        if (e.target.value.length === 0 && index > 0) {
        inputs[index - 1].focus();
        }
    };

    const handleClick = async () => {
        try {
            const verificationCode = inputRefs.current.map(input => input.value).join('');

            const formData = new FormData();
            formData.append('creatorIMG', file);
            formData.append('token', verificationCode);
            formData.append('account', account);
            formData.append('terms', JSON.stringify(info));
            const response = await axios.post(`${website}/api/verify-email`, formData, { headers });
            
            let state = response.data.state;
            if (state) {
                disableAllButtons();
                window.location.replace("/verifySuccess");
            } else {
                alert(t('驗證失敗，請重新再試！'));
            }
            enableAllButtons();
        } catch (error) {
            console.error('Verify email error:', error);
        }
    };

    const previewPromoCover = (file) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            setPreviewImg(reader.result);
        };
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) {
            setPreviewImg('');
            return;
        }
        if (validateFileType(file)) {
            setFile(file);
            previewPromoCover(file);
        } else {
            alert(t('文件類型不支持，請上傳...格式的圖片'));
            return -1;
        }
    };

    const validateFileType = (file) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        return allowedTypes.includes(file.type);
    };
    
    
    return (
        <Container className='verifyPage'>
            <Row className="justify-content-center">
                <Col xs={12} md={8}>
                    <Form.Group controlId="file-upload" className='pt-4 pb-3'>
                        {showModal && <TermsModal onAccept={() => setShowModal(false)} />}
                        <div style={{ display: 'flex' }}>
                            <Form.Label className='label-style col-form-label' style={{ marginRight: '1rem'}}>
                                {t('個人封面')}
                            </Form.Label>
                            <Form.Control
                                type="file"
                                style={{ flex: 1, marginBottom: '1rem' }}
                                onChange={handleFileChange}
                            />
                        </div>
                        <div className='file-upload'>
                            {previewImg ? (
                                <div className='profile-section'>
                                    <img
                                        src={previewImg}
                                        alt="Cover Preview"
                                    />
                                </div>
                                
                            ) : (
                                <>
                                    <CardImage size={48} />
                                    <div id="notimage2" className="hidden">{t('上傳個人封面')}</div>
                                </>
                            )}
                        </div>
                    </Form.Group>

                    <Form.Group controlId="formRealName" className="mb-3">
                        <Form.Label>{t('真實姓名')}</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder={t('請輸入真實姓名')}
                        />
                    </Form.Group>

                    <Form.Group controlId="formPenName" className="mb-3">
                        <Form.Label>{t('筆名（30字以內）')}</Form.Label>
                        <Form.Control
                            type="text"
                            name="penName"
                            value={formData.penName}
                            onChange={handleChange}
                            placeholder={t('請輸入創作者筆名')}
                        />
                    </Form.Group>

                    <Form.Group controlId="formEmail" className="mb-3">
                        <Form.Label>{t('電子郵件')}</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={t('請輸入電子郵件')}
                        />
                    </Form.Group>

                    <Button
                        onClick={handleSubmit}
                        className="mb-5 float-end"
                        variant={isFormComplete() ? 'success' : 'secondary'}
                        disabled={!isFormComplete()  || isButtonDisabled}
                    >
                        {t('信箱驗證')}
                    </Button>

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
                </Col>
            </Row>
        </Container>
    );
};

export default VerifyPage;
