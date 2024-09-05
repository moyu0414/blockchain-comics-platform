import React, { useState, useEffect, useMemo } from 'react';
import { Line, Pie, Bar } from '@ant-design/charts';
import { Container, Form, Tabs, Tab } from 'react-bootstrap';
import './bootstrap.min.css';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
import { formatDate } from '../index.js';
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const originalData = {
  year: [
    { date: '2023-Q1', sales: 10000 },
    { date: '2023-Q2', sales: 15000 },
    { date: '2023-Q3', sales: 12000 },
    { date: '2023-Q4', sales: 18000 },
  ],
  quarter: [
    { date: '2023-01', sales: 3000 },
    { date: '2023-02', sales: 3500 },
    { date: '2023-03', sales: 3200 },
    { date: '2023-04', sales: 2800 },
    { date: '2023-05', sales: 4000 },
    { date: '2023-06', sales: 3500 },
  ],
  month: [
    { date: '2023-01', sales: 5000 },
    { date: '2023-02', sales: 5500 },
    { date: '2023-03', sales: 6000 },
    { date: '2023-04', sales: 6500 },
    { date: '2023-05', sales: 7000 },
    { date: '2023-06', sales: 7500 },
    { date: '2023-07', sales: 8000 },
  ],
};

const pieData = [
  { name: '漫画A', sales: 3000 },
  { name: '漫画B', sales: 5000 },
  { name: '漫画C', sales: 2000 },
  { name: '漫画D', sales: 4000 },
];

const customerData = {
  new: [
    { date: '2023-01', count: 50 },
    { date: '2023-02', count: 60 },
    // 更多数据...
  ],
  existing: [
    { date: '2023-01', count: 150 },
    { date: '2023-02', count: 120 },
    // 更多数据...
  ],
  top10: [
    { name: '客户A', purchases: 150 },
    { name: '客户B', purchases: 120 },
    { name: '客户C', purchases: 100 },
    { name: '客户D', purchases: 90 },
    { name: '客户E', purchases: 80 },
    { name: '客户F', purchases: 70 },
    { name: '客户G', purchases: 60 },
    { name: '客户H', purchases: 50 },
    { name: '客户I', purchases: 40 },
    { name: '客户J', purchases: 30 },
  ],
};

const DataAnalysis = () => {
  const [salesArray, setSalesArray] = useState([]);
  const [dataByPeriod, setDataByPeriod] = useState({ year: {}, quarter: {}, month: {}, day: {} });
  const [filteredData, setFilteredData] = useState(originalData);
  const [timePeriod, setTimePeriod] = useState('year');
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const currentAccount = localStorage.getItem("currentAccount");
  const headers = {'api-key': API_KEY};

  const initData = async () => {
    try {
      const response = await axios.get(`${website}/api/creator/records`, {
        headers,
        params: { currentAccount }
      });

      const comicOrigin = response.data;

      const processedData = comicOrigin.reduce((acc, { purchase_date, price }) => {
        const date = new Date(purchase_date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)}`;
        const income = (parseFloat(price) * 0.9).toFixed(3);

        // Update year data
        if (!acc.year[year]) acc.year[year] = { date: `${year}`, sales: 0 };
        acc.year[year].sales = (parseFloat(acc.year[year].sales) + parseFloat(income)).toFixed(3);

        // Update quarter data
        const quarterKey = `${year}-${quarter}`;
        if (!acc.quarter[quarterKey]) acc.quarter[quarterKey] = { date: quarterKey, sales: 0 };
        acc.quarter[quarterKey].sales = (parseFloat(acc.quarter[quarterKey].sales) + parseFloat(income)).toFixed(3);

        // Update month data
        const monthKey = `${year}-${month}`;
        if (!acc.month[monthKey]) acc.month[monthKey] = { date: monthKey, sales: 0 };
        acc.month[monthKey].sales = (parseFloat(acc.month[monthKey].sales) + parseFloat(income)).toFixed(3);

        // Update day data
        const dayKey = `${year}-${month}-${day}`;
        if (!acc.day[dayKey]) acc.day[dayKey] = { date: dayKey, sales: 0 };
        acc.day[dayKey].sales = (parseFloat(acc.day[dayKey].sales) + parseFloat(income)).toFixed(3);

        return acc;
      }, { year: {}, quarter: {}, month: {}, day: {} });

      setDataByPeriod(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching records:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, [currentAccount]);

  useEffect(() => {
    setSalesArray(dataByPeriod);
  }, [dataByPeriod]);

  const salesData = useMemo(() => {
    const periodData = salesArray[timePeriod] || {};
    const dataArray = Object.values(periodData);  // Convert to array format
    return {
      data: dataArray,
      xField: 'date',
      yField: 'sales',
      xAxis: { title: { text: '时间' } },
      yAxis: { title: { text: '收益' } },
      tooltip: { formatter: (datum) => ({ name: '收益', value: datum.sales }) },
      lineStyle: { stroke: '#1890ff' },
      point: { size: 5, shape: 'circle', style: { fill: '#fff', stroke: '#1890ff' } },
    };
  }, [timePeriod, salesArray]);

  // 配置圆饼图
  const pieConfig = useMemo(() => ({
    data: pieData,
    angleField: 'sales',
    colorField: 'name',
    radius: 0.8,
    label: { visible: true, content: '{name}: {percentage}' },
    tooltip: { formatter: (datum) => ({ name: datum.name, value: datum.sales }) },
  }), []);

  // 配置条形图（客户群分析）
  const barCustomerConfig = useMemo(() => ({
    data: [
      { type: '新客', count: customerData.new.reduce((acc, cur) => acc + cur.count, 0) },
      { type: '旧客', count: customerData.existing.reduce((acc, cur) => acc + cur.count, 0) }
    ],
    xField: 'count',
    yField: 'type',
    seriesField: 'type',
    xAxis: { title: { text: '数量' } },
    yAxis: { title: { text: '客户类型' } },
    tooltip: { formatter: (datum) => ({ name: datum.type, value: datum.count }) },
  }), []);


  return (
    <>
      {!loading &&
        <Container className='dataAnalysis pt-4'>
          <Form.Select value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)} aria-label="时间区间">
            <option value="">選擇區間</option>
            <option value="year">年</option>
            <option value="quarter">季</option>
            <option value="month">月</option>
            <option value="day">日</option>
          </Form.Select>
          <Tabs defaultActiveKey="comic" id="data-analysis-tabs" className="mb-3 w-100">
            <Tab eventKey="comic" title="漫画">
              <Tabs defaultActiveKey="comicSales" className="mb-3 w-100 custom-tabs">
                <Tab eventKey="comicSales" title="銷售額">
                  <Line {...salesData} style={{ width: '100%' }} />
                </Tab>
                
                <Tab eventKey="comicCustomer" title="客户群">
                  <Pie {...pieConfig} />
                </Tab>

                <Tab eventKey="comicRank" title="銷售排行榜">



                </Tab>
              </Tabs>
            </Tab>
            <Tab eventKey="nft" title="NFT">
              {/* NFT 的相关内容 */}
            </Tab>
          </Tabs>
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

export default DataAnalysis;
