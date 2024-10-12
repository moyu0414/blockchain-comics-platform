import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import emailjs from "@emailjs/browser";
import { message } from 'antd';
import { Search } from 'react-bootstrap-icons';
import { initializeWeb3 } from '../index';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;
const SERVICE_ID = process.env.REACT_APP_SERVICE_ID;
const TEMPLATE_ID = process.env.REACT_APP_TEMPLATE_ID;
const PUBLIC_KEY = process.env.REACT_APP_PUBLIC_KEY;

const ContactPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({name: "", title: "", message: "",  email: "", file: ''});
  const [currentAccount, setCurrentAccount] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const headers = {'api-key': API_KEY};

  useEffect(() => {
    const checkAccount = async () => {
      const web3 = await initializeWeb3(t);
      if (web3) {
        const accounts = await web3.eth.getAccounts();
        if (accounts[0]) {
          let account = accounts[0].toLowerCase();
          setCurrentAccount(account);
          setEnabled(true);
          const response = await axios.get(`${website}/api/contactPage/isAdmin`, {
            headers: headers,
            params: {
              currentAccount: account
            }
          });
          if (response.data.isAdmin === 1) {
            setIsAdmin(true);
          };
        } else {
          message.info(t('請先登入以太坊錢包，才開放聯絡我們'));
        }
      }
    };
    checkAccount();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('evidence', form.file);
      const response = await axios.post(`${website}/api/contactPage/uploadFile`, formData, { 
        headers: {
          'Content-Type': 'multipart/form-data',
          'api-key': API_KEY
        }
       });
      try {
        console.log(response.data.fileName);
        emailjs.send(SERVICE_ID, TEMPLATE_ID, {
          name: form.name,
          account: currentAccount,
          title: form.title,
          msg: form.message,
          fileName: response.data.fileName,
          from_email: form.email
        }, PUBLIC_KEY)
        message.info(t('郵件已成功發送!'));
        setForm({name: "", title: "", message: "",  email: "", file: ''});
      } catch (error) {
        console.log('錯誤:', error);
        message.info(t('郵件發送失敗，請稍後再試!'));
      }
    } catch (error) {
      console.log('錯誤:', error);
      message.info(t('檔案上傳錯誤!'));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    setForm((prev) => ({ ...prev, file: file }));
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    try {
      const fileResponse = await axios.get(`${website}/api/evidence/${searchValue}`, { headers });
      console.log(fileResponse.data);
      if (fileResponse.data.state) {
        window.open(fileResponse.data.filePath, '_blank');
      } else {
        message.info(t('檔案不存在!'));
      }
    } catch (error) {
      console.error('發生錯誤:', error);
    }
  };


  return (
    <Container className="contactPage pb-5">
      <div className="text-center mb-5">
        <h2 className='text-center fw-bold'>{t('聯絡我們')}</h2>
        <p className="text-muted">若有任何問題要聯絡我們請填寫以下欄位。</p>
        {isAdmin &&  
          <Row>
            <Form.Label>查詢檔案</Form.Label>
            <Col xs={9}>
              <Form.Control
                type="text"
                name="search"
                placeholder="請輸入檔名"
                onChange={(e) => setSearchValue(e.target.value)}
                disabled={!enabled}
              />
            </Col>
            <Col xs={3}>
              <Button onClick={handleSearchSubmit}>
                <Search title="Search" size={24}/>
              </Button>
            </Col>
          </Row>
        }
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col>
            <Form.Group controlId="formCompany">
              <Form.Label>標題</Form.Label><span className='required-text'>*</span>
              <Form.Control type="text" name="title" placeholder="請輸入標題" value={form.title} onChange={handleChange} disabled={!enabled} required />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col xs={12} sm={6} className="mb-3"> 
            <Form.Group controlId="formFirstName">
              <Form.Label>名字</Form.Label><span className='required-text'>*</span>
              <Form.Control type="text" name="name" placeholder="請輸入你的名字" value={form.name} onChange={handleChange} disabled={!enabled} required />
            </Form.Group>
          </Col>
          <Col xs={12} sm={6} className="mb-3"> 
            <Form.Group controlId="formLastName">
              <Form.Label>Email</Form.Label><span className='required-text'>*</span>
              <Form.Control type="email" name="email" placeholder="請輸入你的email" value={form.email} onChange={handleChange} disabled={!enabled} required />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <Form.Group controlId="file-upload">
              <Form.Label>上傳檔案（若為檢舉請提供相關附件舉證）</Form.Label>
              <Form.Control type="file" name="file-upload" onChange={handleFileUpload} disabled={!enabled}/>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <Form.Group controlId="formMessage">
              <Form.Label>內容</Form.Label><span className='required-text'>*</span>
              <Form.Control as="textarea" name="message" rows={4} placeholder="請輸入內容" value={form.message} onChange={handleChange} disabled={!enabled} required />
            </Form.Group>
          </Col>
        </Row>

        <Row className='d-flex justify-content-end'>
          <Col xs="auto">
            <Button variant="primary" type="submit" disabled={!enabled}>
              送出
            </Button>
          </Col>
        </Row>
          
      </Form>
    </Container>
  );
}

export default ContactPage;
