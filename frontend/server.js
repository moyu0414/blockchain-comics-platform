const cors = require('cors');
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
//const fs = require('fs');
const fsPromises = require('fs').promises;
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const { promisify } = require('util');
const rename = promisify(fsPromises.rename); // 圖片重命名
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

const query = promisify(pool.query).bind(pool);  // 将 pool.query 包装成返回 Promise 的函数

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


// 异步函数，用于重命名文件并将其移动到上传目录
async function renameFilename(file, comic_id, type, protoFilename, coverFile) {
  const comicFolder = path.join('uploads', comic_id);
  const specificFolder = path.join(comicFolder, type === 'comicIMG' ? 'cover' : 'chapters');
  try {
    await fsPromises.mkdir(comicFolder, { recursive: true });
    await fsPromises.mkdir(specificFolder, { recursive: true });
    // 如果有 protoFilename 和 coverFile，則處理 protoFilename 的重命名
    if (coverFile) {
      const protoFilePath = path.join(specificFolder, protoFilename);
      try {
        await fsPromises.access(protoFilePath);
        await fsPromises.unlink(protoFilePath); // 刪除已存在的 protoFilename
      } catch (error) {
        // 當 protoFilename 不存在時，access 會拋出錯誤，這裡可以忽略
      }
      await fsPromises.rename(coverFile.path, protoFilePath);
    } 
    if (file) {
      const timestamp = Date.now().toString();
      const hashValue = await calculateHash(file.path);
      const fileExtension = getFileExtension(file.originalname);
      const filename = `${timestamp}_${hashValue}.${fileExtension}`;
      const filePath = path.join(specificFolder, filename);
      await fsPromises.rename(file.path, filePath);
      return filename;
    }
  } catch (error) {
    console.error('Error moving file or creating directory:', error);
    throw error;
  }
}

// 計算圖檔hash值
async function calculateHash(filePath) {
  try {
      const hash = crypto.createHash('sha256');
      const input = await fsPromises.readFile(filePath); // 使用 fsPromises.promises 的 readFile 方法读取文件内容
      hash.update(input); // 直接更新哈希值
      return hash.digest('hex'); // 返回计算后的哈希值
  } catch (error) {
      console.error('Error reading file or calculating hash:', error);
      throw error;
  }
}

// 获取文件扩展名的函数
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

const deleteFile = async (filePath) => {
  try {
    // 检查文件是否存在
    await fsPromises.access(filePath);
    // 删除文件
    await fsPromises.unlink(filePath);
    //console.log(`File deleted successfully: ${filePath}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`File not found: ${filePath}`);
    } else {
      console.error(`Error deleting file ${filePath}:`, error);
      throw error;
    }
  }
};


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


// 這本漫畫的所有章節
app.get('/api/chapters', (req, res) => {
  const comicHash = req.query.comicHash;
  const query = `
    SELECT chapters.chapter_id AS chapterHash, chapters.title AS chapterTitle, chapters.price, chapters.filename, comics.title AS comicTitle, comics.creator
    FROM chapters
    INNER JOIN comics ON chapters.comic_id = comics.comic_id
    WHERE comics.comic_id = ? AND comics.is_exist = 1
  `;
  pool.query(query, [comicHash], (error, results, fields) => {
    if (error) {
      console.error('Error fetching chapters records: ', error);
      return res.status(500).json({ message: 'Error fetching chapters records' });
    }
    if (results.length === 0) {
      return res.json([]);
    }
    res.json(results);
  });
});


// 讀取創作者所有漫畫中，所有章節購買紀錄，下架不算：transactionHistory
app.get('/api/creator/records', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const query = `
    SELECT comics.title AS comicTitle, chapters.title AS chapterTitle, records.purchase_date, records.price
    FROM records
    INNER JOIN chapters ON records.chapter_id = chapters.chapter_id
    INNER JOIN comics ON chapters.comic_id = comics.comic_id
    WHERE comics.creator = ? AND comics.comic_id = records.comic_id AND comics.is_exist = 1
  `;
  pool.query(query, [currentAccount], (error, results, fields) => {
    if (error) {
      console.error('Error fetching creator records: ', error);
      return res.status(500).json({ message: 'Error fetching creator records' });
    }
    if (results.length === 0) {
      return res.json([]);
    }
    res.json(results);
  });
});


// 讀取讀者所有漫畫中，漫畫資訊，下架不算：reader
app.get('/api/reader/records', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const query = `
    SELECT comics.title AS comicTitle, comics.comic_id AS comicHash, chapters.title AS chapterTitle
    FROM records
    INNER JOIN chapters ON records.chapter_id = chapters.chapter_id
    INNER JOIN comics ON chapters.comic_id = comics.comic_id
    WHERE records.buyer = ? AND comics.comic_id = records.comic_id AND comics.is_exist = 1
  `;
  pool.query(query, [currentAccount], (error, results, fields) => {
    if (error) {
      console.error('Error fetching reader records: ', error);
      return res.status(500).json({ message: 'Error fetching reader records' });
    }
    if (results.length === 0) {
      return res.json([]);
    }
    res.json(results);
  });
});


// 讀取讀者_購買紀錄，下架不算：purchaseHistory
app.get('/api/purchaseHistory/records', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const query = `
    SELECT comics.title AS comicTitle, chapters.title AS chapterTitle, comics.creator, records.purchase_date, records.price AS recordsPrice
    FROM records
    INNER JOIN chapters ON records.chapter_id = chapters.chapter_id
    INNER JOIN comics ON chapters.comic_id = comics.comic_id
    WHERE records.buyer = ? AND comics.comic_id = records.comic_id AND comics.is_exist = 1
  `;
  pool.query(query, [currentAccount], (error, results, fields) => {
    if (error) {
      console.error('Error fetching reader records: ', error);
      return res.status(500).json({ message: 'Error fetching reader records' });
    }
    if (results.length === 0) {
      return res.json([]);
    }
    res.json(results);
  });
});


// 購買紀錄＿章節選擇：selectChapter、reader_Chapter
app.get('/api/selectChapter/records', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const comicHash = req.query.comicHash;
  const query = `
    SELECT chapters.chapter_id AS chapterHash, chapters.title AS chapterTitle, chapters.price, records.price AS recordsPrice, records.purchase_date
    FROM records
    INNER JOIN chapters ON records.chapter_id = chapters.chapter_id
    INNER JOIN comics ON chapters.comic_id = comics.comic_id
    WHERE records.buyer = ? AND comics.comic_id = ? AND comics.is_exist = 1
  `;
  pool.query(query, [currentAccount, comicHash], (error, results, fields) => {
    if (error) {
      console.error('Error fetching reader records: ', error);
      return res.status(500).json({ message: 'Error fetching reader records' });
    }
    if (results.length === 0) {
      return res.json([]);
    }
    res.json(results);
  });
});


// 購買紀錄_reading
app.get('/api/reading/records', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const comicHash = req.query.comicHash;
  const query = `
    SELECT comics.title AS comicTitle, chapters.title AS chapterTitle, chapters.filename, chapters.chapter_id
    FROM records
    INNER JOIN chapters ON records.chapter_id = chapters.chapter_id
    INNER JOIN comics ON chapters.comic_id = comics.comic_id
    WHERE records.buyer = ? AND comics.comic_id = ? AND comics.is_exist = 1
  `;
  pool.query(query, [currentAccount, comicHash], (error, results, fields) => {
    if (error) {
      console.error('Error fetching reading records: ', error);
      return res.status(500).json({ message: 'Error fetching reading records' });
    }
    if (results.length === 0) {
      return res.json([]);
    }
    res.json(results);
  });
});


app.get('/api/comicDetail', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const comicHash = req.query.comicHash;
  const query = `
    SELECT chapters.title, chapters.price, records.buyer AS isBuying, comics.comic_id AS comicHash, chapters.chapter_id AS chapterHash, chapters.create_timestamp, comics.creator
    FROM chapters
    LEFT JOIN records ON chapters.chapter_id = records.chapter_id AND records.buyer = ?
    INNER JOIN comics ON chapters.comic_id = comics.comic_id
    WHERE comics.comic_id = ? AND comics.is_exist = 1
  `;
  pool.query(query, [currentAccount, comicHash], (error, results, fields) => {
    if (error) {
      console.error('Error fetching chapter records: ', error);
      return res.status(500).json({ message: 'Error fetching chapter records' });
    }
    res.json(results);
  });
});


app.get('/api/bookcase', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const query = `
    SELECT comics.title, comics.filename, comics.create_timestamp, COALESCE(ranked_records.purchase_date, '') AS purchase_date
    FROM comics
    LEFT JOIN (
      SELECT records.comic_id, MAX(records.purchase_date) AS purchase_date
      FROM records
      WHERE records.buyer = ?
      GROUP BY records.comic_id
    ) AS ranked_records ON comics.comic_id = ranked_records.comic_id
    WHERE comics.is_exist = 1
    ORDER BY comics.create_timestamp ASC
  `;
  pool.query(query, [currentAccount], (error, results, fields) => {
    if (error) {
      console.error('Error fetching chapter records: ', error);
      return res.status(500).json({ message: 'Error fetching chapter records' });
    }
    res.json(results);
  });
});



// 新增一筆 comics 資料、添加漫画信息到数据库的路由
app.post('/api/add/comics', upload.fields([{ name: 'comicIMG' }, { name: 'coverFile' }]), async (req, res) => {
  const file = req.files['comicIMG'] ? req.files['comicIMG'][0] : null;
  const coverFile = req.files['coverFile'] ? req.files['coverFile'][0] : null;
  if (!file) {
    return res.status(400).json({ error: 'Main comic image file must be uploaded' });
  }
  try {
    const { creator, title, description, category, is_exist, comic_id, protoFilename, timestamp } = req.body;
    let filename, protoFile;
    if (coverFile) {
      protoFile = 1;
      filename = await renameFilename(file, comic_id, 'comicIMG', protoFilename, coverFile);
    } else {
      protoFile = 0;
      filename = await renameFilename(file, comic_id, 'comicIMG');
    }
    pool.query(
      'INSERT INTO comics (comic_id, creator, title, description, category, is_exist, filename, protoFilename, create_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [comic_id, creator, title, description, category, is_exist, filename, protoFile, timestamp],
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
    const { chapter_hash, comic_id, price, title, timestamp} = req.body;
    const filename = await renameFilename(file, comic_id, 'chapterIMG');
    pool.query(
      'INSERT INTO chapters (chapter_id, comic_id, price, title, filename, create_timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [chapter_hash, comic_id, price, title, filename, timestamp],
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
app.post('/api/add/records',upload.any(), (req, res) => {
  const { hash, comic_id, chapter_id, buyer, creator, purchase_date, price } = req.body;
  pool.query(
    'INSERT INTO records (hash, comic_id, chapter_id, buyer, creator, purchase_date, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [hash, comic_id, chapter_id, buyer, creator, purchase_date, price],
    (error, results, fields) => {
      if (error) {
        console.error('Error inserting into records: ', error);
        return res.status(500).json({ message: 'Error inserting into records' });
      }
      res.json({ message: 'Chapter added successfully.', hash: hash, purchaseDate: purchase_date });
    }
  );
});


// 根据 filename 获取漫画图片的路由
app.get('/api/comicIMG/:filename', async (req, res) => {
  const { filename } = req.params;
  try {
    const [results] = await query('SELECT * FROM comics WHERE filename = ?', [filename]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'filename not found.' });
    }
    const comic_id = results.comic_id; // 假设数据库中有 comic_id 字段
    const imagePath = path.join(__dirname, 'uploads', comic_id, 'cover', filename);
    // 使用 fsPromises.promises.readFile 直接读取文件内容并发送给响应流
    const image = await fsPromises.readFile(imagePath);
    res.setHeader('Content-Type', 'image/jpeg'); // 假设是 JPEG 格式的图片
    res.send(image);
  } catch (error) {
    console.error('Error fetching comicIMG:', error);
    res.status(500).json({ message: 'Error fetching comicIMG' });
  }
});


// 根据 filename 获取章節图片的路由
app.get('/api/chapterIMG/:filename',async (req, res) => {
  const { filename } = req.params;
  try {
    const [results] = await query('SELECT * FROM chapters WHERE filename = ?', [filename]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'filename not found.' });
    }
    const comic_id = results.comic_id; // 假设数据库中有 comic_id 字段
    const imagePath = path.join(__dirname, 'uploads', comic_id, 'chapters', filename);
    // 使用 fsPromises.promises.readFile 直接读取文件内容并发送给响应流
    const image = await fsPromises.readFile(imagePath);
    res.setHeader('Content-Type', 'image/jpeg'); // 假设是 JPEG 格式的图片
    res.send(image);
  } catch (error) {
    console.error('Error fetching chapterIMG:', error);
    res.status(500).json({ message: 'Error fetching chapterIMG' });
  }
});


// 根据 protoFilename 获取漫画图片的路由
app.get('/api/coverFile/:filename/:protoFilename', async (req, res) => {
  const { filename, protoFilename } = req.params;
  try {
    const [results] = await query('SELECT * FROM comics WHERE filename = ? AND protoFilename = ?', [filename, protoFilename]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'Comic image not found.' });
    }
    const comic_id = results.comic_id; // 假设数据库中有 comic_id 字段
    const imagePath = path.join(__dirname, 'uploads', comic_id, 'cover', 'promoCover.jpg');
    const image = await fsPromises.readFile(imagePath);
    res.setHeader('Content-Type', 'image/jpeg'); // 假设是 JPEG 格式的图片
    res.send(image);
  } catch (error) {
    console.error('Error fetching comic image:', error);
    res.status(500).json({ message: 'Error fetching comic image' });
  }
});



// 編輯漫畫資料的請求、添加漫畫信息到數據庫的路由
app.put('/api/update/comicData', upload.fields([{ name: 'comicIMG' }, { name: 'coverFile' }]), async (req, res) => {
  const { id, title, description, category, fileName, protoFilename } = req.body;
  const file = req.files['comicIMG'] ? req.files['comicIMG'][0] : null;
  const coverFile = req.files['coverFile'] ? req.files['coverFile'][0] : null;
  let filenameToUpdate, protoFile;
  try {
    if (file && coverFile) {
      protoFile = 1;
      filenameToUpdate = await renameFilename(file, id, 'comicIMG', protoFilename, coverFile);
    } else if (file) {
      filenameToUpdate = await renameFilename(file, id, 'comicIMG');
    } else if (coverFile) {
      protoFile = 1;
      filenameToUpdate = fileName;
      await renameFilename('', id, 'comicIMG', protoFilename, coverFile);
    } else {
      filenameToUpdate = fileName;
    }
    if (coverFile) {
      const updateQuery = `UPDATE comics SET title = ?, description = ?, category = ?, filename = ?, protoFilename = ? WHERE comic_id = ?`;
      await new Promise((resolve, reject) => {
        pool.query(updateQuery, [title, description, category, filenameToUpdate, protoFile, id], (error, results, fields) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(results);
        });
      });
    } else{
      const updateQuery = `UPDATE comics SET title = ?, description = ?, category = ?, filename = ? WHERE comic_id = ?`;
      await new Promise((resolve, reject) => {
        pool.query(updateQuery, [title, description, category, filenameToUpdate, id], (error, results, fields) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(results);
        });
      });
    }
    if (file) {
      await deleteFile(`uploads/${id}/cover/${fileName}`);
    }
    return res.status(200).json({ message: 'comicData updated successfully' });
  } catch (error) {
    console.error('Error updating comic data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 編輯章節資料的請求、添加章節信息到數據庫的路由
app.put('/api/update/chapterData', upload.single('chapterIMG'), async (req, res) => {
  const { comic_id, chapter_id, price, title, fileName } = req.body;
  const file = req.file;
  let filenameToUpdate = '';
  try {
    if (file) {
      filenameToUpdate = await renameFilename(file, comic_id, 'chapterIMG');
    } else {
      filenameToUpdate = fileName;
    }
    const updateQuery = `UPDATE chapters SET price = ?, title = ?, filename = ? WHERE chapter_id = ?`;
    const queryResult = await new Promise((resolve, reject) => {
      pool.query(updateQuery, [price, title, filenameToUpdate, chapter_id], (error, results, fields) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      });
    });
    if (file) {
      await deleteFile(`uploads/${comic_id}/chapters/${fileName}`);
    }
    return res.status(200).json({ message: 'chapterData updated successfully' });
  } catch (error) {
    console.error('Error updating Chapter data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 更新漫畫存在狀態的路由
app.put('/api/update/comicExist', async (req, res) => {
  const { is_exist, comicHash } = req.body;
  try {
    const updateQuery = `UPDATE comics SET is_exist = ? WHERE comic_id = ?`;
    const queryResult = await new Promise((resolve, reject) => {
      pool.query(updateQuery, [is_exist, comicHash], (error, results, fields) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      });
    });
    res.status(200).json({ message: 'comicExist updated successfully' });
  } catch (error) {
    console.error('Error updating comicExist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器正在監聽 http://localhost:${port}`);
  });
  