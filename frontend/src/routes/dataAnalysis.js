import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Container, Form, Tabs, Tab } from 'react-bootstrap';
import './bootstrap.min.css';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import axios from 'axios';
import { formatDate } from '../index.js';
ChartJS.register( CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend );
const website = process.env.REACT_APP_Website;
const API_KEY = process.env.REACT_APP_API_KEY;

const initAllComicData = (comicOrigin) => {
  return comicOrigin.reduce((acc, { purchase_date, price }) => {
    const date = new Date(purchase_date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)}`;
    const income = (parseFloat(price) * 0.9).toFixed(3);
    const updateData = (type, key) => {
      if (!acc[type][key]) {
        acc[type][key] = { date: key, sales: 0, count: 0 };
      }
      acc[type][key].sales = (parseFloat(acc[type][key].sales) + parseFloat(income)).toFixed(3);
      acc[type][key].count += 1; // Increment count
    };
    updateData('year', `${year}`);
    const quarterKey = `${year}-${quarter}`;
    updateData('quarter', quarterKey);
    const monthKey = `${year}-${month}`;
    updateData('month', monthKey);
    const dayKey = `${year}-${month}-${day}`;
    updateData('day', dayKey);
    return acc;
  }, { year: {}, quarter: {}, month: {}, day: {} });
};











const computeSalesData = (salesArray, timePeriod) => {
  if (!salesArray || !salesArray[timePeriod]) {
    return null;
  }
  const periodData = salesArray[timePeriod] || {};
  const dataArray = Object.values(periodData);
  // Determine the date range
  const allDates = Object.keys(periodData);
  const earliestDate = new Date(Math.min(...allDates.map(date => parseDate(date, timePeriod))));
  const latestDate = new Date(Math.max(...allDates.map(date => parseDate(date, timePeriod))));
  const dateRange = generateDateRangeAll(earliestDate, latestDate, timePeriod);
  // Create a map of dates to sales data
  const salesMap = {};
  const countMap = {};
  dataArray.forEach(item => {
    salesMap[item.date] = parseFloat(item.sales);
    countMap[item.date] = item.count || 0;
  });
  //console.log(dataArray);
  // Fill in missing dates with zero sales
  const labels = dateRange;
  const salesData = dateRange.map(date => salesMap[date] || 0);
  const countData = dateRange.map(date => countMap[date] || 0);
  //console.log(countData);
  // Chart.js 数据配置
  return {
    labels,
    datasets: [
      {
        label: '漫畫銷售額',
        data: salesData,
        fill: false,
        borderColor: '#1890ff',
        backgroundColor: '#1890ff',
        pointStyle: 'diamond',
        pointRadius: 5,
        countData: countData
      },
    ],
  };
};

const generateDateRangeAll = (startDate, endDate, step) => {
  const dates = [];
  let currentDate = new Date(startDate);
  const formatDate = (date, step) => {
    const year = date.getFullYear();
    if (step === 'month') {
      return `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    } else if (step === 'day') {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (step === 'quarter') {
      const quarter = Math.floor(date.getMonth() / 3) + 1; // Determine the quarter (1-4)
      return `${year}-Q${quarter}`; // YYYY-Q1, YYYY-Q2, etc.
    } else if (step === 'year') {
      return year.toString(); // YYYY
    }
    return ''; // Default case
  };
  while (currentDate <= endDate) {
    dates.push(formatDate(currentDate, step));
    // Move to the next date based on the step
    if (step === 'month') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (step === 'day') {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (step === 'year') {
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    } else if (step === 'quarter') {
      currentDate.setMonth(currentDate.getMonth() + 3);
    }
  }
  return dates;
};

const initFilterComicData = (comicOrigin) => {
  const processedData = comicOrigin.reduce((acc, { purchase_date, price, comicTitle }) => {
    const date = new Date(purchase_date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const income = (parseFloat(price) * 0.9);
    if (!acc[comicTitle]) {
      acc[comicTitle] = { year: {}, quarter: {}, month: {}, day: {} };
    }
    const updateData = (type, key) => {
      if (!acc[comicTitle][type][key]) {
        acc[comicTitle][type][key] = { date: key, sales: 0, count: 0 };
      }
      acc[comicTitle][type][key].sales += income;
      acc[comicTitle][type][key].count += 1; // Increment count for each entry
    };
    updateData('year', `${year}`);
    updateData('quarter', `${year}-${month}`);
    updateData('month', `${year}-${month}`);
    updateData('day', `${year}-${month}-${day}`);
    return acc;
  }, {});
  return processedData;
};

const computeComicData = (comics, selectedComic, selectedPeriod) => {
  if (!comics[selectedComic] || !comics[selectedComic][selectedPeriod]) return null;
  const comicData = comics[selectedComic][selectedPeriod];
  const aggregatedData = Object.values(comicData).reduce((acc, { date, sales, count }) => {
    if (!acc[date]) {
      acc[date] = { sales: 0, count: 0 };
    }
    acc[date].sales += parseFloat(sales);
    acc[date].count += count;
    return acc;
  }, {});
  const step = selectedPeriod === 'month' ? 'month' : selectedPeriod === 'day' ? 'day' : 'year';
  const { startDate, endDate, allMonths } = getDateRange(aggregatedData, step);
  const dateRange = generateDateRange(startDate, endDate, step, allMonths);
  dateRange.forEach(date => {
    if (!aggregatedData[date]) {
      aggregatedData[date] = { sales: 0, count: 0 };
    }
  });
  return {
    labels: dateRange,
    datasets: [{
      label: `${selectedComic} - 漫畫銷售額`,
      data: dateRange.map(date => aggregatedData[date].sales.toFixed(3)),
      backgroundColor: '#ff5733',
      borderColor: '#ff5733',
      borderWidth: 1,
      countData: dateRange.map(date => aggregatedData[date].count)
    }],
  };
};

const getDateRange = (data, step) => {
  const allDates = Object.keys(data);
  const dateToNum = (date) => {
    if (step === 'month') return new Date(date + '-01').getTime(); // YYYY-MM-01
    if (step === 'day') return new Date(date).getTime(); // YYYY-MM-DD
    return new Date(date).getTime(); // YYYY
  };
  const earliestDate = new Date(Math.min(...allDates.map(date => dateToNum(date))));
  const latestDate = new Date(Math.max(...allDates.map(date => dateToNum(date))));
  if (step === 'month') {
    const months = [];
    for (let year = earliestDate.getFullYear(); year <= latestDate.getFullYear(); year++) {
      for (let month = 1; month <= 12; month++) {
        months.push(`${year}-${String(month).padStart(2, '0')}`);
      }
    }
    return { startDate: earliestDate, endDate: latestDate, allMonths: months };
  }
  return { startDate: earliestDate, endDate: latestDate };
};

const generateDateRange = (startDate, endDate, step, allMonths = []) => {
  const dates = new Set();
  let currentDate = new Date(startDate);
  if (step === 'month') {
    const monthsSet = new Set(allMonths);
    while (currentDate <= endDate) {
      dates.add(currentDate.toISOString().slice(0, 7)); // YYYY-MM
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return Array.from(monthsSet);
  }
  if (step === 'day') {
    while (currentDate <= endDate) {
      dates.add(currentDate.toISOString().split('T')[0]); // YYYY-MM-DD
      currentDate.setDate(currentDate.getDate() + 1); // Increment by 1 day
    }
  } else if (step === 'year') {
    while (currentDate <= endDate) {
      dates.add(currentDate.getFullYear().toString()); // YYYY
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    }
  }
  return Array.from(dates);
};

// 日期解析函数
const parseDate = (dateStr, timePeriod) => {
  let date;
  switch (timePeriod) {
    case 'day':
      date = new Date(dateStr);
      break;
    case 'month':
      date = new Date(dateStr + '-01'); // 假设为该月的第一天
      break;
    case 'quarter':
      const [year, quarter] = dateStr.split('-Q');
      const month = (parseInt(quarter, 10) - 1) * 3 + 1; // 计算季度开始的月份
      date = new Date(`${year}-${month.toString().padStart(2, '0')}-01`);
      break;
    case 'year':
      date = new Date(dateStr + '-01-01'); // 假设为该年的第一天
      break;
    default:
      date = new Date(); // 默认当前日期
  }
  return date.getTime(); // 返回时间戳
};


// 測試數據
const test_data_1 = [
  { comicTitle: 'test_1', chapterTitle: '001-3', purchase_date: '2023-12-29T13:48:24.000Z', price: '0.05' },
  { comicTitle: 'test_1', chapterTitle: '001-3', purchase_date: '2023-08-05T13:47:36.000Z', price: '0.05' },
  { comicTitle: 'test_1', chapterTitle: '001-2', purchase_date: '2023-08-05T06:15:24.000Z', price: '0.05' },
  { comicTitle: 'test_1', chapterTitle: '001-2', purchase_date: '2024-01-23T14:22:12.000Z', price: '0.05' },
  { comicTitle: 'test_4', chapterTitle: '004-1', purchase_date: '2024-08-21T03:17:48.000Z', price: '0.06' },
  { comicTitle: 'test_4', chapterTitle: '004-1', purchase_date: '2024-03-10T13:07:36.000Z', price: '0.06' },
  { comicTitle: 'test_2', chapterTitle: '002-1', purchase_date: '2023-10-07T06:00:00.000Z', price: '0.03' },
  { comicTitle: 'test_2', chapterTitle: '002-1', purchase_date: '2024-06-02T13:15:36.000Z', price: '0.03' }
];


const DataAnalysis = () => {
  const [dataByPeriod, setDataByPeriod] = useState({ year: {}, quarter: {}, month: {}, day: {} });
  const [salesData, setSalesData] = useState('');
  const [timePeriod, setTimePeriod] = useState('year');
  const [comics, setComics] = useState([]);
  const [selectedComic, setSelectedComic] = useState('');
  const [chartData, setChartData] = useState({});
  const [detailData, setDetailData] = useState(null);
  const [lowestDetailData, setLowestDetailData] = useState(null);
  const [comicPeriod, setComicPeriod] = useState('year');
  const [x_title, setX_title] = useState({year: '', month: ''});
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
      console.log(comicOrigin);

      //const processedData = initAllComicData(comicOrigin);
      const processedData = initAllComicData(test_data_1);
      //console.log(processedData);
      setDataByPeriod(processedData);
      
      //const comics = initFilterComicData(comicOrigin);
      const comics = initFilterComicData(test_data_1);
      console.log(comics);
      setComics(comics);
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
    setSalesData(computeSalesData(dataByPeriod, timePeriod));
  }, [dataByPeriod, timePeriod]);

  useEffect(() => {
    if (selectedComic === t('請選擇漫畫') || timePeriod === 'quarter') {
      return;
    }
    const data = computeComicData(comics, selectedComic, timePeriod);
    setChartData(data);
  }, [selectedComic, timePeriod]);

  const handleChartClick = (event, currentPeriod) => {
    const chart = event.chart;
    if (!chart) return;
    const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
    if (points.length > 0) {
      const firstPoint = points[0];
      const label = chart.data.labels[firstPoint.index];
      if (currentPeriod === 'year') {
        const year = label;
        const monthData = computeComicData(comics, selectedComic, 'month');
        const allMonths = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
        const filteredMonthData = {
          labels: allMonths,
          datasets: [{
            label: `${selectedComic} - 銷售額`,
            data: allMonths.map(month => {
              const monthIndex = monthData.labels.indexOf(month);
              return monthIndex >= 0 ? monthData.datasets[0].data[monthIndex] : 0;
            }),
            backgroundColor: '#ff5733',
            borderColor: '#ff5733',
            borderWidth: 1,
            countData: allMonths.map(month => {
              const monthIndex = monthData.labels.indexOf(month);
              return monthIndex >= 0 ? monthData.datasets[0].countData[monthIndex] : 0;
            })
          }]
        };
        setComicPeriod('month');
        const getYear = dateStr => dateStr.split('-')[0];
        const x_year = getYear(filteredMonthData.labels[0]);
        setX_title(prev => ({ ...prev, year: x_year }));
        setDetailData(filteredMonthData);
        setLowestDetailData(null); // 清除最低层数据
      } else if (currentPeriod === 'month') {
        const month = label;
        const dayData = computeComicData(comics, selectedComic, 'day');
        const allDays = Array.from({ length: 31 }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
        const filteredDayData = {
          labels: allDays,
          datasets: [{
            label: `${selectedComic} - 銷售額`,
            data: allDays.map(day => {
              const dayIndex = dayData.labels.indexOf(day);
              return dayIndex >= 0 ? dayData.datasets[0].data[dayIndex] : 0;
            }),
            backgroundColor: '#ff5733',
            borderColor: '#ff5733',
            borderWidth: 1,
            countData: allDays.map(day => {
              const dayIndex = dayData.labels.indexOf(day);
              return dayIndex >= 0 ? dayData.datasets[0].countData[dayIndex] : 0;
            })
          }]
        };
        setComicPeriod('day');
        const getYearMonth = dateStr => dateStr.slice(0, 7);
        const x_month = getYearMonth(filteredDayData.labels[0]);
        setX_title(prev => ({ ...prev, month: x_month }));
        setLowestDetailData(filteredDayData);
      }
    }
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const sales = context.dataset.data[index];
            const count = context.dataset.countData[index];
            return [`${t('銷售額')}：${sales}`, `${t('數量')}：${count}`];
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '日期',
        },
      },
      y: {
        title: {
          display: true,
          text: '銷售額',
        },
      },
    },
  };

  const filterOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const sales = context.dataset.data[index];
            const count = context.dataset.countData[index];
            return [`${t('銷售額')}：${sales}`, `${t('數量')}：${count}`];
          },
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: '銷售額',
        },
      },
    },
  };

  const renderChart = (data, options, period) => {
    if (data) {
      return (
        <Line
          data={data}
          options={{
            ...options,
            onClick: (e) => handleChartClick(e, period),
          }}
        />
      );
    }
  };

  const handlePeriodChange = (e) => {
    const period = e.target.value;
    if (period === 'quarter') {
      setChartData({});
    }
    setTimePeriod(period);
    setComicPeriod(period);
    setDetailData(null);
    setLowestDetailData(null);
    setX_title({});
  };

  const handleComicChange = (e) => {
    setSelectedComic(e.target.value);
    setDetailData(null);
    setLowestDetailData(null);
    setX_title({});
  };


  return (
    <>
      {!loading &&
        <Container className='dataAnalysis'>
          <div className='dataAnalysis-title'>
            <h2 className='text-center fw-bold' style={{backgroundColor: "green"}}>{t('數據分析')}</h2>
            <Form.Select value={timePeriod} onChange={handlePeriodChange}>
              <option value="year">年</option>
              <option value="quarter">季</option>
              <option value="month">月</option>
              <option value="day">日</option>
            </Form.Select>
          </div>
          <Tabs defaultActiveKey="comic" id="data-analysis-tabs" className="mb-3 w-100">
            <Tab eventKey="comic" title="漫畫">
              <Tabs defaultActiveKey="comicSales" className="mb-3 w-100 custom-tabs">
                <Tab eventKey="comicSales" title="銷售額">
                  <div style={{marginBottom: "50px"}}>
                    {salesData ? (
                      <>
                        <h1>{t('漫畫總銷售額')}</h1>
                        <Line data={salesData} options={options} />
                      </>
                    ) : (
                      <p>Loading or no data available</p>
                    )}

                    <h3>{t('篩選漫畫')}</h3>
                    <Form.Select value={selectedComic} onChange={handleComicChange}>
                      <option value="">{t('請選擇漫畫')}</option>
                      {Object.keys(comics).map((comic, index) => (
                        <option key={index} value={comic}>{comic}</option>
                      ))}
                    </Form.Select>

                    {chartData && Object.keys(chartData).length > 0 ? (
                      <>
                        {renderChart(chartData, options, timePeriod)}
                        {renderChart(detailData, filterOptions, timePeriod === 'year' ? 'month' : comicPeriod)}

                        {timePeriod === 'year' && (comicPeriod === 'month' || comicPeriod === 'day') && (
                          <center><p>{x_title.year}</p></center>
                        )}

                        {renderChart(lowestDetailData, filterOptions, timePeriod === 'month' ? 'day' : comicPeriod)}

                        {(timePeriod === 'year' && comicPeriod === 'day') ? (
                          <center><p>{x_title.month}</p></center>
                        ) : timePeriod === 'month' ? (
                          <center><p>{x_title.month}</p></center>
                        ) : (
                          null
                        )}
                      </>
                    ) : (
                      <p>{t('目前沒有購買紀錄')}</p>
                    )}
                  </div>
                </Tab>
                
                <Tab eventKey="comicCustomer" title="客户群">





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
