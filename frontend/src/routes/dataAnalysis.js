import React, { useState, useEffect, useMemo } from 'react';
import { Line, Pie } from 'react-chartjs-2';
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
  return comicOrigin.reduce((acc, { purchase_date, price, comicTitle }) => {
    const date = new Date(purchase_date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)}`;
    const income = (parseFloat(price) * 0.9).toFixed(3);
    const updateData = (type, key) => {
      if (!acc[type][key]) {
        acc[type][key] = { date: key, sales: 0, count: 0, title: [] };
      }
      const titleEntry = acc[type][key].title.find(t => t.title === comicTitle);
      if (titleEntry) {
        titleEntry.sales = (parseFloat(titleEntry.sales) + parseFloat(income)).toFixed(3);
      } else {
        acc[type][key].title.push({ title: comicTitle, sales: income });
      }
      acc[type][key].sales = (parseFloat(acc[type][key].sales) + parseFloat(income)).toFixed(3);
      acc[type][key].count += 1;
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
  const titleMap = {};
  const salesMap = {};
  const countMap = {};
  dataArray.forEach(item => {
    salesMap[item.date] = parseFloat(item.sales);
    countMap[item.date] = item.count || 0;
    if (!titleMap[item.date]) {
      titleMap[item.date] = {};
    }
    item.title.forEach(t => {
      const title = t.title;
      const sales = parseFloat(t.sales);
      if (!titleMap[item.date][title]) {
        titleMap[item.date][title] = 0;
      }
      titleMap[item.date][title] += sales;
    });
  });
  // Fill in missing dates with zero sales
  const labels = dateRange;
  const salesData = dateRange.map(date => salesMap[date] || 0);
  const countData = dateRange.map(date => countMap[date] || 0);

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
        countData: countData,
        pieData: titleMap
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

const transformPieData = (pieData, period) => {
  const dataForYear = pieData[period] || {};
  const labels = Object.keys(dataForYear);
  const data = Object.values(dataForYear);
  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: ['#8470FF', '#7FFFD4', '#FFD700', '#CDC5BF', '#F0FFFF'], // Customize colors as needed
      },
    ],
  };
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
  { "comicTitle": "comic_A1", "chapterTitle": "001-1", "purchase_date": "2024-01-18T15:12:30.000Z", "price": "0.07" },
  { "comicTitle": "comic_B2", "chapterTitle": "002-1", "purchase_date": "2023-08-20T09:33:15.000Z", "price": "0.05" },
  { "comicTitle": "comic_C3", "chapterTitle": "003-1", "purchase_date": "2024-03-05T17:05:12.000Z", "price": "0.08" },
  { "comicTitle": "comic_D4", "chapterTitle": "004-1", "purchase_date": "2023-11-12T11:59:52.000Z", "price": "0.06" },
  { "comicTitle": "comic_E5", "chapterTitle": "005-1", "purchase_date": "2024-06-28T02:14:24.000Z", "price": "0.09" },
  { "comicTitle": "comic_F6", "chapterTitle": "006-1", "purchase_date": "2023-10-30T22:51:30.000Z", "price": "0.04" },
  { "comicTitle": "comic_G7", "chapterTitle": "007-1", "purchase_date": "2024-05-21T06:45:16.000Z", "price": "0.03" },
  { "comicTitle": "comic_H8", "chapterTitle": "008-1", "purchase_date": "2023-12-15T13:30:22.000Z", "price": "0.07" },
  { "comicTitle": "comic_I9", "chapterTitle": "009-1", "purchase_date": "2024-02-08T04:12:18.000Z", "price": "0.06" },
  { "comicTitle": "comic_J10", "chapterTitle": "010-1", "purchase_date": "2023-09-05T18:22:25.000Z", "price": "0.05" },
  { "comicTitle": "comic_A1", "chapterTitle": "011-1", "purchase_date": "2024-07-13T11:36:40.000Z", "price": "0.08" },
  { "comicTitle": "comic_B2", "chapterTitle": "012-1", "purchase_date": "2023-06-11T03:17:30.000Z", "price": "0.09" },
  { "comicTitle": "comic_C3", "chapterTitle": "013-1", "purchase_date": "2024-11-25T10:22:50.000Z", "price": "0.03" },
  { "comicTitle": "comic_D4", "chapterTitle": "014-1", "purchase_date": "2023-07-22T15:50:12.000Z", "price": "0.07" },
  { "comicTitle": "comic_E5", "chapterTitle": "015-1", "purchase_date": "2024-04-09T19:03:18.000Z", "price": "0.06" },
  { "comicTitle": "comic_F6", "chapterTitle": "016-1", "purchase_date": "2023-05-16T22:48:29.000Z", "price": "0.04" },
  { "comicTitle": "comic_G7", "chapterTitle": "017-1", "purchase_date": "2024-12-03T05:36:55.000Z", "price": "0.09" },
  { "comicTitle": "comic_H8", "chapterTitle": "018-1", "purchase_date": "2023-03-27T11:25:33.000Z", "price": "0.08" },
  { "comicTitle": "comic_I9", "chapterTitle": "019-1", "purchase_date": "2024-08-14T17:00:10.000Z", "price": "0.05" },
  { "comicTitle": "comic_J10", "chapterTitle": "020-1", "purchase_date": "2023-12-22T14:30:20.000Z", "price": "0.07" },
  { "comicTitle": "comic_A1", "chapterTitle": "021-1", "purchase_date": "2024-01-08T23:11:44.000Z", "price": "0.03" },
  { "comicTitle": "comic_B2", "chapterTitle": "022-1", "purchase_date": "2023-10-13T06:48:58.000Z", "price": "0.09" },
  { "comicTitle": "comic_C3", "chapterTitle": "023-1", "purchase_date": "2024-12-03T02:17:44.000Z", "price": "0.07" },
  { "comicTitle": "comic_D4", "chapterTitle": "024-1", "purchase_date": "2023-11-10T08:28:52.000Z", "price": "0.06" },
  { "comicTitle": "comic_E5", "chapterTitle": "025-1", "purchase_date": "2024-02-05T20:03:41.000Z", "price": "0.08" },
  { "comicTitle": "comic_F6", "chapterTitle": "026-1", "purchase_date": "2023-07-08T13:12:22.000Z", "price": "0.04" },
  { "comicTitle": "comic_G7", "chapterTitle": "027-1", "purchase_date": "2024-03-21T06:43:35.000Z", "price": "0.06" },
  { "comicTitle": "comic_H8", "chapterTitle": "028-1", "purchase_date": "2023-12-30T11:56:59.000Z", "price": "0.09" },
  { "comicTitle": "comic_I9", "chapterTitle": "029-1", "purchase_date": "2024-05-15T09:34:24.000Z", "price": "0.08" },
  { "comicTitle": "comic_J10", "chapterTitle": "030-1", "purchase_date": "2023-08-01T17:05:58.000Z", "price": "0.07" },
  { "comicTitle": "comic_A1", "chapterTitle": "031-1", "purchase_date": "2024-09-21T06:56:41.000Z", "price": "0.03" },
  { "comicTitle": "comic_B2", "chapterTitle": "032-1", "purchase_date": "2023-10-20T16:47:16.000Z", "price": "0.07" },
  { "comicTitle": "comic_C3", "chapterTitle": "033-1", "purchase_date": "2024-07-04T12:33:47.000Z", "price": "0.06" },
  { "comicTitle": "comic_H8", "chapterTitle": "028-1", "purchase_date": "2024-12-30T11:56:59.000Z", "price": "0.09" },
  { "comicTitle": "comic_I9", "chapterTitle": "029-1", "purchase_date": "2023-05-15T09:34:24.000Z", "price": "0.08" },
  { "comicTitle": "comic_J10", "chapterTitle": "030-1", "purchase_date": "2024-08-01T17:05:58.000Z", "price": "0.07" },
  { "comicTitle": "comic_A1", "chapterTitle": "031-1", "purchase_date": "2023-08-21T06:56:41.000Z", "price": "0.03" },
  { "comicTitle": "comic_B2", "chapterTitle": "032-1", "purchase_date": "2024-01-20T16:47:16.000Z", "price": "0.07" },
  { "comicTitle": "comic_C3", "chapterTitle": "033-1", "purchase_date": "2023-02-04T12:33:47.000Z", "price": "0.06" }
];


const DataAnalysis = () => {
  const [dataByPeriod, setDataByPeriod] = useState({ year: {}, quarter: {}, month: {}, day: {} });
  const [salesData, setSalesData] = useState('');
  const [timePeriod, setTimePeriod] = useState('year');
  const [comics, setComics] = useState([]);
  const [pieData, setPieData] = useState(null);
  const [pieTop5, setPieTop5] = useState(null);
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
      //console.log(comicOrigin);

      //const processedData = initAllComicData(comicOrigin);
      const processedData = initAllComicData(test_data_1);
      console.log(processedData);
      setDataByPeriod(processedData);
      
      //const comics = initFilterComicData(comicOrigin);
      const comics = initFilterComicData(test_data_1);
      //console.log(comics);
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
    if (points.length === 0) return;
    const firstPoint = points[0];
    const label = chart.data.labels[firstPoint.index];
    const generateFilteredData = (period, label, dataCalculator, labelGenerator) => {
      const data = dataCalculator(comics, selectedComic, period);
      const allLabels = labelGenerator(label);
      return {
        labels: allLabels,
        datasets: [{
          label: `${selectedComic} - 銷售額`,
          data: allLabels.map(l => {
            const index = data.labels.indexOf(l);
            return index >= 0 ? data.datasets[0].data[index] : 0;
          }),
          backgroundColor: '#ff5733',
          borderColor: '#ff5733',
          borderWidth: 1,
          countData: allLabels.map(l => {
            const index = data.labels.indexOf(l);
            return index >= 0 ? data.datasets[0].countData[index] : 0;
          })
        }]
      };
    };
    if (currentPeriod === 'year') {
      const year = label;
      const filteredMonthData = generateFilteredData(
        'month',
        year,
        computeComicData,
        year => Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
      );
      setComicPeriod('month');
      const x_year = filteredMonthData.labels[0].split('-')[0];
      setX_title(prev => ({ ...prev, year: x_year }));
      setDetailData(filteredMonthData);
      setLowestDetailData(null);
    } else if (currentPeriod === 'month') {
      const month = label;
      const filteredDayData = generateFilteredData(
        'day',
        month,
        computeComicData,
        month => Array.from({ length: 31 }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)
      );
      setComicPeriod('day');
      const x_month = filteredDayData.labels[0].slice(0, 7);
      setX_title(prev => ({ ...prev, month: x_month }));
      setLowestDetailData(filteredDayData);
    }
  };

  const handlePieChartClick = (event) => {
    const chart = event.chart;
    if (!chart) return;
    const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
    if (points.length > 0) {
      const firstPoint = points[0];
      const label = chart.data.labels[firstPoint.index];
      const timePeriods = {
        year: 'year',
        quarter: 'quarter',
        month: 'month',
        day: 'day'
      };
      const timePeriodKey = timePeriods[timePeriod];
      const timePeriodData = computeSalesData(dataByPeriod, timePeriodKey);
      const pieChartData = transformPieData(timePeriodData.datasets[0].pieData, label);
      const { labels, datasets } = pieChartData;
      const data = datasets[0].data;
      const top5 = labels
        .map((label, index) => ({ label, value: data[index] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      setPieTop5({
        date: label,
        title: top5.map((item, index) => `${index + 1}. ${item.label}：${item.value}`)
      });
      setPieData(pieChartData);
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

  const pieOptions = {
    responsive: true, // 使图表在不同屏幕尺寸下自适应
    plugins: {
      legend: {
        position: 'top', // 图例位置（'top', 'bottom', 'left', 'right'）
        labels: {
          color: '#333', // 图例文本颜色
          font: {
            size: 14, // 图例文本字体大小
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            const label = tooltipItem.label || '';
            const value = tooltipItem.raw.toFixed(3); // 显示小数点后两位
            return `${label}: ${value}`;
          },
        },
        backgroundColor: '#fff', // 工具提示背景颜色
        titleColor: '#000', // 工具提示标题颜色
        bodyColor: '#000', // 工具提示主体颜色
        borderColor: '#ddd', // 工具提示边框颜色
        borderWidth: 1, // 工具提示边框宽度
      },
    },
    maintainAspectRatio: false, // 不保持图表宽高比，使其填满容器
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

  const renderLineChart = (data, options) => {
    if (data) {
      return (
        <Line
          data={data}
          options={{
            ...options,
            onClick: (e) => handlePieChartClick(e),
          }}
        />
      );
    }
  };

  const renderPieChart = (data, options) => {
    if (data) {
      return (
        <Pie data={data} options={{options}}/>
      );
    }
    <Pie data={pieData} options={pieOptions} />
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
    setPieData(null);
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
            <Form.Select className='mt-4' value={timePeriod} onChange={handlePeriodChange}>
              <option value="year">年</option>
              <option value="quarter">季</option>
              <option value="month">月</option>
              <option value="day">日</option>
            </Form.Select>
          </div>
          <Tabs defaultActiveKey="comic" id="data-analysis-tabs" className="mt-4 mb-3 w-100">
            <Tab eventKey="comic" title="漫畫">
              <Tabs defaultActiveKey="comicSales" className="mb-3 w-100 custom-tabs second-tabs">
                <Tab className='second-tab' eventKey="comicSales" title="銷售額">
                  <div style={{marginBottom: "50px"}}>
                    {salesData ? (
                      <>
                        <h1>{t('漫畫總銷售額')}</h1>
                        {renderLineChart(salesData, options)}

                        {pieData && Object.keys(pieData).length > 0 ? (
                          <>
                            <h2>{t('漫畫銷售佔比')}</h2>
                            {renderPieChart(pieData, pieOptions)}
                            
                            <center>
                              {pieTop5 && pieTop5.date ? (
                                <>
                                  <h3>{pieTop5.date} {t('TOP 5')}</h3>
                                  {pieTop5.title && pieTop5.title.map((item, index) => (
                                    <p key={index}>{item}</p>
                                  ))}
                                </>
                              ) : (
                                <p>{t('目前沒有購買紀錄')}</p>
                              )}
                            </center>
                          </>
                        ) : (
                          <p>{t('目前沒有購買紀錄')}</p>
                        )}
                      </>
                    ) : (
                      <p>Loading or no data available</p>
                    )}

                    <h3 className='mt-5'>{t('篩選漫畫')}</h3>
                    <Form.Select className='mt-4 mb-4' value={selectedComic} onChange={handleComicChange}>
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
                
                <Tab className='second-tab' eventKey="comicCustomer" title="客户群">





                </Tab>

                <Tab className='second-tab' eventKey="comicRank" title="銷售排行榜">



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
