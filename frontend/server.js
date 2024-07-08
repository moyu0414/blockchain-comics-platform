const cors = require('cors');
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // 保持文件名不变，或者根据需要修改
  }
});
const upload = multer({ storage: storage });
//const upload = multer({ dest: 'uploads/' });  // 圖片存到跟目錄下的 uploads 資料夾，檔名隨機生成

// 計算圖檔hash值
function calculateHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(filePath);
    input.on('error', err => reject(err));
    input.on('data', chunk => hash.update(chunk));
    input.on('end', () => resolve(hash.digest('hex')));
  });
}

// 获取文件扩展名的函数
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}


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
app.post('/api/add/comics', upload.single('comicIMG'),async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const timestamp = Date.now().toString();
    const hashValue = await calculateHash(file.path);
    const filename = `${timestamp}_${hashValue}.${getFileExtension(file.originalname)}`;
    const filePath = `uploads/${filename}`;
    fs.renameSync(file.path, filePath);  // 移动文件到上传目录，并重命名
    const { creator, title, description, category, is_exist, comic_id } = req.body;
    pool.query(
      'INSERT INTO comics (comic_id, creator, title, description, category, is_exist, filename) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [comic_id, creator, title, description, category, is_exist, filename],
      (error, results, fields) => {
        if (error) {
          console.error('Error inserting into comics: ', error);
          return res.status(500).json({ message: 'Error inserting into comics' });
        }
        res.json({ message: 'Comic added successfully.', comic_id: comic_id, filename: filename });
      }
    );
  } catch (error) {
    console.error('Error processing comics upload:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 新增一筆 chapters 資料、添加漫画信息到数据库的路由
app.post('/api/add/chapters', upload.single('chapterIMG'),async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const timestamp = Date.now().toString();
    const hashValue = await calculateHash(file.path);
    const filename = `${timestamp}_${hashValue}.${getFileExtension(file.originalname)}`;
    const filePath = `uploads/${filename}`;
    fs.renameSync(file.path, filePath);  // 移动文件到上传目录，并重命名
    const { chapter_hash, comic_id, price, title} = req.body;
    pool.query(
      'INSERT INTO chapters (chapter_id, comic_id, price, title, filename) VALUES (?, ?, ?, ?, ?)',
      [chapter_hash, comic_id, price, title, filename],
      (error, results, fields) => {
          if (error) {
              console.error('Error inserting into chapters: ', error);
              return res.status(500).json({ message: 'Error inserting into chapters' });
          }
          res.json({ message: 'chapter added successfully.', chapter_hash: chapter_hash, filename: filename });
      }
    );
  } catch (error) {
    console.error('Error processing chapters upload:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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


// 根据 filename 获取章節图片的路由
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


// 編輯漫畫資料的請求、添加漫畫信息到數據庫的路由
app.put('/api/update/comicData', upload.single('comicIMG'), (req, res) => {
  const { id, hash, title, description, category, fileName } = req.body;
  let filename = ''; // 初始化 filename 变量
  if (fileName) {
    filename = fileName; // 如果请求中有 fileName 属性，则使用该属性值
  } else if (req.file) {
    filename = req.file.filename; // 否则使用上传的文件的文件名
  }
  const updateQuery = `UPDATE comics SET comic_id = ?, title = ?, description = ?, category = ?, filename = ? WHERE comic_id = ?`;
  pool.query(updateQuery, [hash, title, description, category, filename, id], (error, results, fields) => {
    if (error) {
      res.status(500).json({ error: 'Failed to update comicData' });
      return;
    }
    res.status(200).json({ message: 'comicData updated successfully' });
  });
});


// 編輯章節資料的請求、添加章節信息到數據庫的路由
app.put('/api/update/chapterData', upload.single('chapterIMG'), (req, res) => {
  const { id, chapter_id, price, title, fileName } = req.body;
  let filename = ''; // 初始化 filename 变量
  if (fileName) {
    filename = fileName; // 如果请求中有 fileName 属性，则使用该属性值
  } else if (req.file) {
    filename = req.file.filename; // 否则使用上传的文件的文件名
  }
  const updateQuery = `UPDATE chapters SET chapter_id = ?, price = ?, title = ?, filename = ? WHERE chapter_id = ?`;
  pool.query(updateQuery, [chapter_id, price, title, filename, id], (error, results, fields) => {
    if (error) {
      res.status(500).json({ error: 'Failed to update chapterData' });
      return;
    }
    res.status(200).json({ message: 'chapterData updated successfully' });
  });
});


// 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器正在監聽 http://localhost:${port}`);
  });
  