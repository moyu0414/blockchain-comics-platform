const cors = require('cors');
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
//const CryptoJS = require('crypto-js');
const app = express();
const port = 5000;
app.use(cors());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');  // 允許所有来源的請求訪問資源
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// 設置body-parser中間件來解析請求主體
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 創建MySQL連線池
const pool = mysql.createPool({
    host: '140.131.114.242',
    user: '113410',
    password: '@NTUB11341o',
    database: '113-113410',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,  // 設定連線池大小，預設為10
    connectTimeout: 10000, // 增加連接超時時間為 10 秒
});


// 檢查連線建立過程中的錯誤
pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to database: ', err);
      return;
    }
    console.log('Connected to MySQL database!');
    connection.release(); // 釋放連線
  });


// 设置multer中间件用于处理文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads'); // 上传的文件存储在 uploads 文件夹中
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now(); // 获取当前时间戳
    const randomString = crypto.randomBytes(8).toString('hex'); // 生成随机字符串
    const ext = path.extname(file.originalname); // 获取文件的扩展名
    const fileName = `${timestamp}-${randomString}${ext}`; // 将时间戳、随机字符串和扩展名组合成文件名
    cb(null, fileName); // 使用生成的文件名
  }
});
const upload = multer({ storage: storage });


// 讀取所有漫畫
app.get('/api/comics', (req, res) => {
    // 執行 COUNT(*) 查詢以確定資料庫中是否有資料
    pool.query('SELECT COUNT(*) AS count FROM comics', (error, results, fields) => {
      if (error) {
        console.error('Error checking comics data: ', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      // 取得結果中的第一筆資料的 count 欄位值
      const count = results[0].count;
      if (count === 0) {
        // 如果資料庫中沒有資料，返回空陣列
        return res.json([]);
      } else {
        // 如果資料庫中有資料，則執行原本的 SELECT * 查詢
        pool.query('SELECT * FROM comics', (error, results, fields) => {
          if (error) {
            console.error('Error fetching comics: ', error);
            return res.status(500).json({ message: 'Error fetching comics' });
          }
          res.json(results);
        });
      }
    });
  });


  // 讀取所有章節
  app.get('/api/chapters', (req, res) => {
    // 執行 COUNT(*) 查詢以確定資料庫中是否有資料
    pool.query('SELECT COUNT(*) AS count FROM chapters', (error, results, fields) => {
      if (error) {
        console.error('Error checking chapters data: ', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      // 取得結果中的第一筆資料的 count 欄位值
      const count = results[0].count;
      if (count === 0) {
        // 如果資料庫中沒有資料，返回空陣列
        return res.json([]);
      } else {
        // 如果資料庫中有資料，則執行原本的 SELECT * 查詢
        pool.query('SELECT * FROM chapters', (error, results, fields) => {
          if (error) {
            console.error('Error fetching chapters: ', error);
            return res.status(500).json({ message: 'Error fetching chapters' });
          }
          res.json(results);
        });
      }
    });
  });
  

// 新增一筆 comics 資料、添加漫画信息到数据库的路由
app.post('/api/add/comics', upload.single('comicIMG'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  const { creator, title, description, category, is_exist, comic_id } = req.body;
  const filename = req.file.filename; // 获取保存在服务器上的文件名
  // 在这里处理文件上传，并将相关信息存储到数据库中
  const fileBuffer = fs.readFileSync(req.file.path); // 读取上传的文件

  // 根据前端传递的哈希值存储 comic_id 到数据库
  pool.query(
    'INSERT INTO comics (comic_id, creator, title, description, category, is_exist, filename) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [comic_id, creator, title, description, category, is_exist, filename],
    (error, results, fields) => {
      if (error) {
        console.error('Error inserting into comics: ', error);
        return res.status(500).json({ message: 'Error inserting into comics' });
      }
      res.json({ message: 'Comic added successfully.', comic_id: comic_id, filename: req.file.filename });
    }
  );
});


// 根据 filename 获取漫画图片的路由
app.get('/api/comicIMG/:filename', (req, res) => {
  const { filename } = req.params;
  pool.query(
    'SELECT * FROM comics WHERE filename = ?',
    [filename],
    (error, results, fields) => {
      if (error) {
        console.error('Error fetching comicIMG:', error);
        return res.status(500).json({ message: 'Error fetching comicIMG' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'comicIMG not found.' });
      }
      const imagePath = path.join(__dirname, 'uploads', req.params.filename);
      const imageStream = fs.createReadStream(imagePath);
      imageStream.pipe(res);
    }
  );
});


// 新增一筆 chapters 資料、添加漫画信息到数据库的路由
app.post('/api/add/chapters', upload.single('chapterIMG'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    const { chapter_hash, comic_id, price, title} = req.body;
    const filename = req.file.filename; // 取得保存在伺服器上的檔案名
    const fileBuffer = fs.readFileSync(req.file.path);

    pool.query(
        'INSERT INTO chapters (chapter_id, comic_id, price, title, filename) VALUES (?, ?, ?, ?, ?)',
        [chapter_hash, comic_id, price, title, filename],
        (error, results, fields) => {
            if (error) {
                console.error('Error inserting into chapters: ', error);
                return res.status(500).json({ message: 'Error inserting into chapters' });
            }
            res.json({ message: 'chapter added successfully.', chapter_hash: chapter_hash, filename: req.file.filename });
        }
    );
});


// 根据 filename 获取漫画图片的路由
app.get('/api/chapterIMG/:filename', (req, res) => {
  const { filename } = req.params;
  pool.query(
    'SELECT * FROM chapters WHERE filename = ?',
    [filename],
    (error, results, fields) => {
      if (error) {
        console.error('Error fetching chapterIMG:', error);
        return res.status(500).json({ message: 'Error fetching chapterIMG' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'chapterIMG not found.' });
      }
      const imagePath = path.join(__dirname, 'uploads', req.params.filename);
      const imageStream = fs.createReadStream(imagePath);
      imageStream.pipe(res);
    }
  );
});


// 新增一筆 records 資料
app.post('/api/add/records', (req, res) => {
  const { hash, comic_id, chapter_id, address, purchase_date, price } = req.body;
  pool.query(
      'INSERT INTO records (hash, comic_id, price, chapter_id, address, purchase_date, price) VALUES (?, ?, ?, ?, ?, ?)',
      [hash, comic_id, price, chapter_id, address, purchase_date, price],
      (error, results, fields) => {
          if (error) {
              console.error('Error inserting into records: ', error);
              return res.status(500).json({ message: 'Error inserting into records' });
          }
          res.json({ message: 'chapter added successfully.', hash: hash, purchaseDate: purchase_date });
      }
  );
});


// 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器正在監聽 http://localhost:${port}`);
  });
  