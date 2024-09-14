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
    const [showModal, setShowModal] = useState(true);
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
        const [showModal, setShowModal] = useState(true);
        const [checked, setChecked] = useState(false);
        const navigate = useNavigate();
        const handleAccept = () => {
            if (checked) {
                onAccept();
                setShowModal(false);
            } else {
                alert('請同意平台的使用條款，才能進行帳號驗證!');
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
                    <b>web3toon</b> 使用條款
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>歡迎使用 <b>web3toon</b> 漫畫平台（以下稱「本平台」）。為了保護您的權益，請在使用本平台之前仔細閱讀本使用條款（以下稱「條款」）。使用本平台即表示您同意遵守這些條款。如果您不同意這些條款，您將無法使用本平台的某些功能。</p>
                    <p>1. **服務內容**</p>
                    <p>本平台提供漫畫購買、閱讀、鑄造NFT，轉售NFT、收藏等功能。本平台保留修改、更新或取消服務內容的權利，並將及時通知用戶。</p>
                    <p>2. **用戶責任**</p>
                    <p>帳號與密碼安全：用戶應妥善保管錢包帳號和密碼，不得將帳號和密碼轉讓給第三方。若發現帳號或密碼被盜用，應立即通知本平台。</p>
                    <p>3. **知識產權**</p>
                    <p>本平台上的所有內容（包括但不限於漫畫、NFT、圖片、文字、標誌、商標等）均為本平台或其授權方的知識產權，未經授權，不得以任何形式使用。</p>
                    <p>4. **隱私政策**</p>
                    <p>本平台將根據隱私政策收集、使用和保護用戶的個人信息。請詳細閱讀我們的 [隱私政策]，了解我們如何處理您的信息。</p>
                    <p>5. **盜版及非法作品處理**</p>
                    <p>本平台管理者有權對盜版或非法作品進行審核、下架等處理，並取締該創作者在本平台的創作權利及其相關作品。</p>
                    <p>6. **責任免除**</p>
                    <p>本平台對於因不可抗力或其他非本平台控制範圍內的因素導致的服務中斷或資料丟失，概不負責。</p>
                    <p>7. **條款變更**</p>
                    <p>本平台有權隨時修改這些條款，並將修改後的條款在本平台上公告，公告即為有效。</p>
                    <p>8. **爭議解決**</p>
                    <p>本條款受 [國家/地區] 法律管轄。</p>
                    <p>9. **其他**</p>
                    <p>若本條款中的任何條款被認定為無效或不可執行，不影響其他條款的有效性和可執行性。</p>

                    <Form.Group className="mb-3">
                    <Form.Check
                        type="checkbox"
                        label="我同意上述的使用條款"
                        checked={checked}
                        onChange={() => setChecked(!checked)}
                    />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleReject}>
                    拒絕
                    </Button>
                    <Button variant="primary" onClick={handleAccept}>
                    接受
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
            console.log(t('文件類型不支持，請上傳...格式的圖片'));
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
