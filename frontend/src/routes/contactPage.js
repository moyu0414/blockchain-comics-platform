import React, { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import emailjs from "@emailjs/browser";

// service_sdi9f5t
// template_yce9ndk
// pwycS0OXgkSVqAHAy

const SERVICE_ID = "service_sdi9f5t";
const TEMPLATE_ID = "template_yce9ndk";
const PUBLIC_KEY = "pwycS0OXgkSVqAHAy";

const ContactPage = () => {
  const [form, setForm] = useState({
    title: "",
    name: "",
    email: "",
    message: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 傳送郵件
    emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      from_title: form.title,
      from_name: form.name,
      from_email: form.email,
      message: form.message,
    }, PUBLIC_KEY)
    .then((result) => {
      console.log('成功:', result.text);
      alert('郵件已成功發送');
    }, (error) => {
      console.log('錯誤:', error.text);
      alert('郵件發送失敗，請稍後再試');
    });
  };

  return (
    <Container className="py-5">
      <div className="text-center mb-5">
        <h2 className="font-weight-bold">聯絡我們</h2>
        <p className="text-muted">若有任何問題要聯絡我們請填寫以下欄位。</p>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col>
            <Form.Group controlId="formCompany">
              <Form.Label>標題</Form.Label><span className='required-text'>*</span>
              <Form.Control type="text" name="title" placeholder="請輸入標題" value={form.title} onChange={handleChange} required />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col xs={12} sm={6} className="mb-3"> 
            <Form.Group controlId="formFirstName">
              <Form.Label>名字</Form.Label><span className='required-text'>*</span>
              <Form.Control type="text" name="name" placeholder="請輸入你的名字" value={form.name} onChange={handleChange} required />
            </Form.Group>
          </Col>
          <Col xs={12} sm={6} className="mb-3"> 
            <Form.Group controlId="formLastName">
              <Form.Label>Email</Form.Label><span className='required-text'>*</span>
              <Form.Control type="email" name="email" placeholder="請輸入你的email" value={form.email} onChange={handleChange} required />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <Form.Group controlId="file-upload">
              <Form.Label>上傳檔案（若為檢舉請提供相關附件舉證）</Form.Label>
              <Form.Control type="file" name="file-upload" />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <Form.Group controlId="formMessage">
              <Form.Label>內容</Form.Label><span className='required-text'>*</span>
              <Form.Control as="textarea" name="message" rows={4} placeholder="請輸入內容" value={form.message} onChange={handleChange} required />
            </Form.Group>
          </Col>
        </Row>

        <Row className='d-flex justify-content-end'>
          <Col xs="auto">
            <Button variant="primary" type="submit" >
              送出
            </Button>
          </Col>
        </Row>
          
      </Form>
    </Container>
  );
}

export default ContactPage;
