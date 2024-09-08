const cors = require('cors');
const express = require('express');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
//const fs = require('fs');
const fsPromises = require('fs').promises;
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const moment = require('moment');
const { format } = require('date-fns');
const { promisify } = require('util');
const rename = promisify(fsPromises.rename); // 圖片重命名
const app = express();
const port = 5000;
const dotenv = require('dotenv');
const envPath = path.join('../', '.env');  // localhost
//const envPath = path.join('/var/www/html/src', '.env');  // web3toonapi
dotenv.config({ path: envPath });
const API_KEY = process.env.REACT_APP_API_KEY; // localhost
//const API_KEY = process.env.API_KEY; // web3toonapi

const emailAccount = process.env.REACT_APP_EMAIL; // localhost
const emailPassword = process.env.REACT_APP_EMAIL_PASSWORD; // localhost

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

// API密钥验证中间件
app.use((req, res, next) => {
  const apiKey = req.headers['api-key'];
  if (apiKey && apiKey === API_KEY) {
    next(); // API密钥验证通过，继续处理请求
  } else {
    res.status(403).json({ error: 'Forbidden' }); // API密钥验证失败，拒绝请求
  }
});

// 創建MySQL連線池
const pool = mysql.createPool({
    host: '140.131.114.242',
    user: '113410',
    password: '@NTUB11341o',
    database: '113-113410',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,  // 適當設置連線池大小
    connectTimeout: 30000, // 將連接超時時間增加到 30 秒
});

const query = promisify(pool.query).bind(pool);  // 将 pool.query 包装成返回 Promise 的函数

// 檢查連線建立過程中的錯誤
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database: ', err.code);  // 更詳細地記錄錯誤代碼
    console.error('Error details: ', err);  // 顯示完整的錯誤對象
    return;
  }
  console.log('Connected to MySQL database!');
  connection.release(); // 釋放連線
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailAccount,
    pass: emailPassword
  },
  tls: {
    rejectUnauthorized: false // 忽略自簽名證書錯誤
  }
});


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');  // localhost
    //cb(null, '/var/www/html/uploads');  // web3toonapi
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // 保持文件名不变，或者根据需要修改
  }
});
const upload = multer({ storage: storage });
//const upload = multer({ dest: 'uploads/' });  // 圖片存到跟目錄下的 uploads 資料夾，檔名隨機生成


// 异步函数，用于重命名文件并将其移动到上传目录
async function renameFilename(file, comic_id, type, protoFilename, coverFile) {
  const comicFolder = path.join('uploads', comic_id);  // localhost
  //const comicFolder = path.join('/var/www/html/uploads', comic_id);  // web3toonapi
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

async function creatorFile(file, account) {
  const creatorFolder = path.join('uploads', 'creator');  // localhost
  //const comicFolder = path.join('/var/www/html/uploads', comic_id);  // web3toonapi
  const fileExtension = getFileExtension(file.originalname);
  const filename = `${account}.${fileExtension}`;
  const filePath = path.join(creatorFolder, filename);
  try {
    await fsPromises.mkdir(creatorFolder, { recursive: true });
    await fsPromises.rename(file.path, filePath);
    return filename;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

async function nftFile(file, comic_id, tokenId) {
  const creatorFolder = path.join('uploads', comic_id, 'NFT');  //localhost
  // const comicFolder = path.join('/var/www/html/uploads', comic_id, 'NFT');  // web3toonapi
  const filename = `${tokenId}.jpg`;
  const filePath = path.join(creatorFolder, filename);
  try {
    await fsPromises.mkdir(creatorFolder, { recursive: true });
    await fsPromises.access(file.path);
    await fsPromises.copyFile(file.path, filePath);
    return filename;
  } catch (error) {
    console.error('Error handling file:', error);
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


app.post('/api/send-verification-email', async (req, res) => {
  const { name, penName, email, account } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000);  // 隨機生成 6 位數驗證碼
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 驗證碼 15 分钟內有效
  const mailOptions = {
    from: emailAccount,
    to: email,
    subject: 'web3toon email verification',
    text: `Hello ${name},\n\nPen Name: ${penName}\n\nWe are the web3toon platform. To become a creator on our platform, we need to verify your email address.\n\nYour verification code is: ${code}\nThe verification code is valid for 15 minutes.\n\nLet's start our journey!\n\nBest regards,\nweb3toon`
  };

  try {
    await transporter.sendMail(mailOptions);
    const verificationData = JSON.stringify({ email, name, penName, code, expires });
    const updateQuery = 'UPDATE user SET info = ? WHERE address = ?';
    const queryResult = await new Promise((resolve, reject) => {
      pool.query(updateQuery, [verificationData, account], (error, results, fields) => {
        if (error) {
          reject(error);
          return res.json({ state: false });
        }
        res.status(200).json({ state: true });
      });
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error sending email or updating database' });
  }
});


app.post('/api/verify-email', upload.single('creatorIMG'),async (req, res) => {
  const file = req.file;
  const { token, account } = req.body;
  const image = await creatorFile(file, account, 'creatorIMG');
  if (!image){
    return res.status(500).json({ state: false, message: 'Error upload image' });
  }
  const query = 'SELECT info FROM user WHERE address = ?';
  pool.query(query, [account], (error, results) => {
    if (error) {
      console.error('Error fetching user data:', error);
      return res.status(500).json({ state: false, message: 'Error fetching user data' });
    }
    if (results.length === 0) {
      return res.json({ state: false, message: 'Account not found' });
    }
    const code = results[0].info.code;
    const expires = results[0].info.expires;
    if (code !== parseInt(token) || new Date() > new Date(expires)) {
      return res.json({ state: false, message: 'Invalid or expired token' });
    }
    const name = results[0].info.name;
    const email = results[0].info.email;
    const penName = results[0].info.penName;
    const info = JSON.stringify({ name, email, image });
    const updateQuery = 'UPDATE user SET info = ?, is_creator = 2, penName = ? WHERE address = ?';
    pool.query(updateQuery, [info, penName, account], (error, results) => {
      if (error) {
        console.error('Error updating user data:', error);
        return res.status(500).json({ state: false, message: 'Error updating user data' });
      }
      res.json({ state: true, message: 'Email verified successfully' });
    });
  });
});


app.post('/api/authorProfile-send-verification-email', async (req, res) => {
  const { name, penName, editEamil, account } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000);  // 隨機生成 6 位數驗證碼
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 驗證碼 15 分鐘內有效
  const mailOptions = {
    from: emailAccount,
    to: editEamil,
    subject: 'web3toon 信箱認證',
    text: `Hello ~~,\n\nPen Name: ${penName}\n\nWe are the web3toon platform. There has been a change to the email in your profile information, we need to verify your email address.\n\nYour verification code is: ${code}\nThe verification code is valid for 15 minutes.\n\nLet's start our journey!\n\nBest regards,\nweb3toon`
  };
  try {
    await transporter.sendMail(mailOptions);
    const [currentInfoResult] = await new Promise((resolve, reject) => {
      pool.query('SELECT info FROM user WHERE address = ?', [account], (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });

    let currentInfo = {};
    currentInfo = currentInfoResult.info;
    const verificationData = { editEamil, code, expires };
    const updatedInfo = { ...currentInfo, verificationData };
    await new Promise((resolve, reject) => {
      pool.query('UPDATE user SET info = ? WHERE address = ?', [JSON.stringify(updatedInfo), account], (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    res.status(200).json({ state: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error sending email or updating database' });
  }
});


app.post('/api/authorProfile-verify-email', (req, res) => {
  const { token, account } = req.body;
  if (!token || !account) {
    return res.status(400).json({ state: false, message: 'Token and account are required' });
  }
  const query = 'SELECT info FROM user WHERE address = ?';
  pool.query(query, [account], (error, results) => {
    if (error) {
      console.error('Error fetching user data:', error);
      return res.status(500).json({ state: false, message: 'Error fetching user data' });
    }
    if (results.length === 0) {
      return res.status(404).json({ state: false, message: 'Account not found' });
    }
    const info = results[0].info.verificationData;
    const code = info.code;
    const expires = new Date(info.expires);
    if (parseInt(token) !== code || new Date() > expires) {
      return res.json({ state: false, message: 'Invalid or expired token' });
    }
    res.json({ state: true, message: 'Verification successful' });
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
  const { hash, comic_id, chapter_id, buyer, purchase_date, price } = req.body;
  pool.query(
    'INSERT INTO records (hash, comic_id, chapter_id, buyer, purchase_date, price) VALUES (?, ?, ?, ?, ?, ?)',
    [hash, comic_id, chapter_id, buyer, purchase_date, price],
    (error, results, fields) => {
      if (error) {
        console.error('Error inserting into records: ', error);
        return res.status(500).json({ message: 'Error inserting into records' });
      }
      res.json({ message: 'Chapter added successfully.', hash: hash, purchaseDate: purchase_date });
    }
  );
});


// 新增 NFT 資料
app.post('/api/add/NFT', upload.single('nftIMG'), async (req, res) => {
  const { tokenId, comicHash, minter, price, tokenTitle, description, forSale, royalty, owner } = req.body;
  const tokenIds = Array.isArray(tokenId) ? tokenId : [tokenId];
  const file = req.file;
  try {
    if (file) {
      await Promise.all(tokenIds.map(async (id) => {
        if (typeof id === 'string') {
          await nftFile(file, comicHash, id);
        } else {
          throw new Error('Invalid tokenId format');
        }
      }));
      await deleteFile(`uploads/${file.filename}`);  // localhost
      //await deleteFile(`/var/www/html/uploads/${file.filename}`);  // web3toon
    }
    const sql = `
      INSERT INTO nft (tokenId, comicHash, minter, price, tokenTitle, description, forSale, royalty, owner)
      VALUES ?
    `;
    // 准备批量插入的数据
    const values = tokenIds.map(id => [
      id, comicHash, minter, price, tokenTitle, description, forSale, royalty, owner
    ]);
    pool.query(sql, [values], (error) => {
      if (error) {
        console.error('Error inserting into nft: ', error);
        return res.status(500).json({ message: 'Error inserting into nft' });
      }
      res.json({ message: 'NFT added successfully.' });
    });
  } catch (error) {
    console.error('Error adding NFT img:', error);
    res.status(500).json({ message: 'Error adding NFT img.' });
  }
});


app.post('/api/add/user', upload.any(), (req, res) => {
  const { address } = req.body;
  // 先检查是否已经存在相同的 address
  pool.query(
    'SELECT 1 FROM user WHERE address = ? LIMIT 1',
    [address],
    (error, results) => {
      if (error) {
        console.error('Error checking address existence: ', error);
        return res.status(500).json({ message: 'Error checking address existence' });
      }
      if (results.length > 0) {
        return res.json({ message: 'Address already exists' });
      }
      // 如果地址不存在，则插入新记录
      pool.query(
        'INSERT INTO user (address, is_creator, is_admin) VALUES (?, ?, ?)',
        [address, 0, 0],
        (error) => {
          if (error) {
            console.error('Error inserting into records: ', error);
            return res.status(500).json({ message: 'Error inserting into records' });
          }
          res.json({ message: 'User added successfully.' });
        }
      );
    }
  );
});


// 根据 filename 获取漫画图片的路由
app.get('/api/comicIMG/:filename', async (req, res) => {
  const { filename } = req.params;
  try {
      const [results] = await query('SELECT * FROM comics WHERE filename = ?', [filename]);
      if (results.length === 0) {
          return res.status(404).json({ message: 'Filename not found.' });
      }
      const comic_id = results.comic_id; // 假设数据库中有 comic_id 字段
      
      // localhost
      const imagePath = path.join(__dirname, 'uploads', comic_id, 'cover', filename);

      // web3toonapi
      //const imagePath = path.join('/var/www/html/', 'uploads', comic_id, 'cover', filename);
      
      const extname = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream'; // 默認為通用二進位流
      switch (extname) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
      }

      // 使用 fsPromises.promises.readFile 直接读取文件内容并发送给响应流
      const image = await fsPromises.readFile(imagePath);
      res.setHeader('Content-Type', contentType);
      res.send(image);
  } catch (error) {
      console.error('Error fetching comic image path:', error);
      res.status(500).json({ message: 'Error fetching comic image path' });
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
      
    // localhost
    const imagePath = path.join(__dirname, 'uploads', comic_id, 'chapters', filename);

    // web3toonapi
    //const imagePath = path.join('/var/www/html/', 'uploads', comic_id, 'chapters', filename);

    const extname = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream'; // 默認為通用二進位流
    switch (extname) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
    }

    // 使用 fsPromises.promises.readFile 直接读取文件内容并发送给响应流
    const image = await fsPromises.readFile(imagePath);
    res.setHeader('Content-Type', contentType);
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
    
    // localhost
    const imagePath = path.join(__dirname, 'uploads', comic_id, 'cover', 'promoCover.jpg');

    // web3toonapi
    //const imagePath = path.join('/var/www/html/', 'uploads', comic_id, 'cover', 'promoCover.jpg');
    
    const image = await fsPromises.readFile(imagePath);
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(image);
  } catch (error) {
    console.error('Error fetching comic image:', error);
    res.status(500).json({ message: 'Error fetching comic image' });
  }
});


app.get('/api/creatorIMG/:account', async (req, res) => {
  const { account } = req.params;
  try {
      const [results] = await query('SELECT info FROM user WHERE address = ?', [account]);
      if (results.length === 0) {
          return res.status(404).json({ message: 'Image not found.' });
      }
      const filename = results.info.image;

      // localhost
      const imagePath = path.join(__dirname, 'uploads', 'creator', filename);

      // web3toonapi
      //const imagePath = path.join('/var/www/html/', 'uploads', 'creator', filename);

      const extname = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream'; // 默認為通用二進位流
      switch (extname) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
      }

      // 使用 fsPromises.promises.readFile 直接读取文件内容并发送给响应流
      const image = await fsPromises.readFile(imagePath);
      res.setHeader('Content-Type', contentType);
      res.send(image);
  } catch (error) {
      console.error('Error fetching comic image path:', error);
      res.status(500).json({ message: 'Error fetching comic image path' });
  }
});


app.get('/api/nftIMG/:comicHash/:tokenId', async (req, res) => {
  const { comicHash, tokenId } = req.params;
  try {
      const filename = `${tokenId}.jpg`;

      // localhost
      const imagePath = path.join(__dirname, 'uploads', comicHash, 'NFT', filename);

      // web3toonapi
      //const imagePath = path.join('/var/www/html/', comicHash, 'NFT', filename);

      await fsPromises.access(imagePath);
      const image = await fsPromises.readFile(imagePath);
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(image);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({ state: false });
    } else {
      console.error('Error fetching NFT image path:', error);
      res.json({ state: false });
    }
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
      await deleteFile(`uploads/${id}/cover/${fileName}`);  // localhost
      //await deleteFile(`/var/www/html/uploads/${id}/cover/${fileName}`);  // web3toon
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
      await deleteFile(`uploads/${comic_id}/chapters/${fileName}`);  // localhost
      //await deleteFile(`/var/www/html/uploads/${comic_id}/chapters/${fileName}`);  // web3toon
    }
    return res.status(200).json({ message: 'chapterData updated successfully' });
  } catch (error) {
    console.error('Error updating Chapter data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.put('/api/update/comicExist', async (req, res) => {
  const comicHash = req.query.comicHash;
  const is_exist = req.query.is_exist;
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


app.put('/api/update/addAdmin', async (req, res) => {
  const address = req.query.address;
  try {
    const updateQuery = 'UPDATE user SET is_admin = 1 WHERE address = ?';
    const queryResult = await new Promise((resolve, reject) => {
      pool.query(updateQuery, [address.toLowerCase()], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    res.status(200).json({ message: 'addAdmin successfully' });
  } catch (error) {
    console.error('Error updating addAdmin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.put('/api/update/removeAdmin', async (req, res) => {
  const address = req.query.address;
  try {
    const updateQuery = 'UPDATE user SET is_admin = 0 WHERE address = ?';
    const queryResult = await new Promise((resolve, reject) => {
      pool.query(updateQuery, [address.toLowerCase()], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    res.status(200).json({ message: 'removeAdmin successfully' });
  } catch (error) {
    console.error('Error updating removeAdmin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.put('/api/update/userAccount', async (req, res) => {
  const address = req.query.address;
  const state = req.query.state;
  try {
    const updateQuery = 'UPDATE user SET is_creator = ? WHERE address = ?';
    const queryResult = await new Promise((resolve, reject) => {
      pool.query(updateQuery, [state, address.toLowerCase()], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
    res.status(200).json({ message: 'addAdmin successfully' });
  } catch (error) {
    console.error('Error updating addAdmin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.put('/api/update/comicDetail/favorite', async (req, res) => {
  const { currentAccount, comicHash, bool, data } = req.query;
  if (!currentAccount || !comicHash || bool === undefined) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  try {
    // 查询当前用户的 collectComic 数据
    const getCollectQuery = `SELECT collectComic FROM user WHERE address = ?`;
    const [results] = await new Promise((resolve, reject) => {
      pool.query(getCollectQuery, [currentAccount], (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      });
    });
    let collectComic = results.collectComic ? results.collectComic : {};
    // 更新 collectComic 数据，只留存"收藏"的資料
    if (bool == 'true') {
      collectComic[comicHash] = data;
    } else {
      delete collectComic[comicHash];
    }
    // 将更新后的 collectComic 对象存回数据库
    const updateQuery = `UPDATE user SET collectComic = ? WHERE address = ?`;
    await new Promise((resolve, reject) => {
      pool.query(updateQuery, [JSON.stringify(collectComic), currentAccount], (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      });
    });
    res.status(200).json({ message: 'Comic detail updated successfully' });
  } catch (error) {
    console.error('Error updating comic detail:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.put('/api/update/nftDetail/favorite', async (req, res) => {
  const { currentAccount, comicHash, bool, data } = req.query;
  if (!currentAccount || !comicHash || bool === undefined) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  try {
    // 查询当前用户的 collectNFT 数据
    const getCollectQuery = `SELECT collectNFT FROM user WHERE address = ?`;
    const [results] = await new Promise((resolve, reject) => {
      pool.query(getCollectQuery, [currentAccount], (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      });
    });
    let collectNFT = results.collectNFT ? results.collectNFT : {};
    if (!Array.isArray(collectNFT[comicHash])) {
      collectNFT[comicHash] = [];
    }
    if (bool === 'true') {
      if (collectNFT[comicHash].length > 0) {
        collectNFT[comicHash].push(data);
      } else {
        collectNFT[comicHash] = [data];
      }
    } else {
      const index = collectNFT[comicHash].indexOf(data);
      if (index > -1) {
        if (collectNFT[comicHash].length === 1) {
          delete collectNFT[comicHash];
        } else {
          collectNFT[comicHash].splice(index, 1);
        }
      }
    }
    // 将更新后的 collectNFT 对象存回数据库
    const updateQuery = `UPDATE user SET collectNFT = ? WHERE address = ?`;
    await new Promise((resolve, reject) => {
      pool.query(updateQuery, [JSON.stringify(collectNFT), currentAccount], (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      });
    });
    res.status(200).json({ message: 'Comic detail updated successfully' });
  } catch (error) {
    console.error('Error updating comic detail:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.put('/api/update/nftDetail/owner', async (req, res) => {
  const { tokenId, currentAccount, price, forSale } = req.body;
  try {
    const updateQuery = `UPDATE nft SET owner = ?, price = ?, forSale = ? WHERE tokenId = ?`;
    const queryResult = await new Promise((resolve, reject) => {
      pool.query(updateQuery, [currentAccount, price, forSale, tokenId], (error, results, fields) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      });
    });
    res.status(200).json({ message: 'NFT updated successfully' });
  } catch (error) {
    console.error('Error updating comicExist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.put('/api/update/nftMarket/owner', async (req, res) => {
  const { tokenId, currentAccount, forSale } = req.body;
  try {
    const placeholders = tokenId.map(() => '?').join(',');
    const updateQuery = `UPDATE nft SET owner = ?, forSale = ? WHERE tokenId IN (${placeholders})`;
    const values = [currentAccount, forSale, ...tokenId];
    const queryResult = await new Promise((resolve, reject) => {
        pool.query(updateQuery, values, (error, results, fields) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(results);
        });
    });
    res.status(200).json({ message: 'NFT updated DB successfully' });
  } catch (error) {
    console.error('Error updating DB NFT:', error);
    res.status(500).json({ error: 'Error updating DB NFT' });
  }
});


app.put('/api/update/EditProfile', async (req, res) => {
  const editableInfo = req.body;
  try {
      const { penName, email, intro, account } = editableInfo;
      // 1. 获取当前用户的现有数据
      const currentUserResult = await new Promise((resolve, reject) => {
          pool.query('SELECT penName, info FROM user WHERE address = ?', [account], (error, results) => {
              if (error) {
                  reject(error);
                  return;
              }
              resolve(results);
          });
      });
      const { info } = currentUserResult[0];
      const currentInfo = info;
      // 2. 更新信息
      const updatedInfo = { ...currentInfo };
      if (email) updatedInfo.email = email;
      if (intro) updatedInfo.intro = intro;
      // 将 updatedInfo 转回 JSON 字符串
      const updatedInfoJson = JSON.stringify(updatedInfo);
      // 3. 更新数据库
      await new Promise((resolve, reject) => {
          pool.query('UPDATE user SET penName = ?, info = ? WHERE address = ?', [penName, updatedInfoJson, account], (error, results) => {
              if (error) {
                  reject(error);
                  return res.json({ state: false });;
              }
              resolve(results);
          });
      });
      res.json({ state: true });
  } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});


app.put('/api/update/AddProfile', async (req, res) => {
  const { date, msg, account } = req.body;
  try {
      // 1. 获取当前用户的现有数据
      const [currentUserResult] = await new Promise((resolve, reject) => {
          pool.query('SELECT info FROM user WHERE address = ?', [account], (error, results) => {
              if (error) return reject(error);
              if (results.length === 0) return reject(new Error('User not found'));
              resolve(results);
          });
      });
      const currentInfo = currentUserResult.info;
      // 2. 更新信息
      if (!currentInfo.BBS) {
        currentInfo.BBS = {};
      }
      currentInfo.BBS[date] = msg;
      // 3. 更新数据库
      await new Promise((resolve, reject) => {
          pool.query('UPDATE user SET info = ? WHERE address = ?', [JSON.stringify(currentInfo), account], (error) => {
              if (error) return reject(error);
              resolve();
          });
      });
      res.json({ state: true });
  } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});


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
      pool.query(`
        SELECT 
          comics.comic_id, comics.creator, comics.title, comics.description, comics.category, comics.is_exist, comics.filename, comics.protoFilename, comics.create_timestamp,
          user.penName
      FROM 
          comics
      LEFT JOIN 
          user ON user.address = comics.creator
      ORDER BY 
          comics.create_timestamp ASC
      `, (error, results, fields) => {
        if (error) {
          console.error('Error fetching comics: ', error);
          return res.status(500).json({ message: 'Error fetching comics' });
        }
        const comicsWithIDs = results.map((comic, index) => ({
          ...comic,
          comicID: `Comic${index + 1}`,
          date: moment(Number(comic.create_timestamp)).format('YYYY-MM-DD')
        }));
        res.json(comicsWithIDs);
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
    WHERE comics.comic_id = ? AND comics.is_exist = 0
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


app.get('/api/creator/records', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const query = `
    SELECT comics.title AS comicTitle, chapters.title AS chapterTitle, records.purchase_date, records.price
    FROM records
    INNER JOIN chapters ON records.chapter_id = chapters.chapter_id
    INNER JOIN comics ON chapters.comic_id = comics.comic_id
    WHERE comics.creator = ? AND comics.comic_id = records.comic_id AND comics.is_exist = 0
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


app.get('/api/reader/records', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const query = `
    SELECT comics.title AS comicTitle, chapters.title AS chapterTitle, comics.is_exist, records.purchase_date, records.price
    FROM records
    INNER JOIN chapters ON records.chapter_id = chapters.chapter_id
    INNER JOIN comics ON chapters.comic_id = comics.comic_id
    WHERE records.buyer = ? AND comics.comic_id = records.comic_id
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


app.get('/api/purchaseHistory/nftRecords', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const query = `
    SELECT nft.tokenId, nft.price, nft.forSale , comics.title
    FROM nft
    INNER JOIN comics ON nft.comicHash = comics.comic_id
    WHERE nft.owner = ? AND nft.owner <> nft.minter AND comics.is_exist = 0
  `;
  pool.query(query, [currentAccount], (error, results, fields) => {
    if (error) {
      console.error('Error fetching creator NFT records: ', error);
      return res.status(500).json({ message: 'Error fetching creator NFT records' });
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
    WHERE records.buyer = ? AND comics.comic_id = ? AND comics.is_exist = 0
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
    WHERE records.buyer = ? AND comics.comic_id = ? AND comics.is_exist = 0
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
    WHERE comics.comic_id = ? AND comics.is_exist = 0
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
    SELECT 
      comics.comic_id AS comicHash, 
      comics.title, 
      comics.filename, 
      comics.create_timestamp, 
      comics.is_exist,
      ranked_records.purchase_date
    FROM comics
    LEFT JOIN (
      SELECT 
        records.comic_id, 
        MAX(records.purchase_date) AS purchase_date
      FROM records
      WHERE records.buyer = ?
      GROUP BY records.comic_id
    ) AS ranked_records 
    ON comics.comic_id = ranked_records.comic_id
    WHERE ranked_records.purchase_date IS NOT NULL
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


app.get('/api/bookcase/nftRecords', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const query = `
    SELECT 
      nft.tokenId, nft.tokenTitle ,comics.title, nft.comicHash, nft.description
    FROM nft
    INNER JOIN comics ON nft.comicHash = comics.comic_id
    WHERE nft.owner = ? AND nft.owner <> nft.minter AND comics.is_exist = 0
  `;
  pool.query(query, [currentAccount], (error, results, fields) => {
    if (error) {
      console.error('Error fetching creator NFT records: ', error);
      return res.status(500).json({ message: 'Error fetching creator NFT records' });
    }
    if (results.length === 0) {
      return res.json([]);
    }
    res.json(results);
  });
});


app.get('/api/editWork/chapters', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const comicHash = req.query.comicHash;
  const query = `
    SELECT chapters.title, chapters.price, comics.comic_id AS comicHash, chapters.chapter_id AS chapterHash, chapters.create_timestamp, chapters.filename
    FROM chapters
    INNER JOIN comics ON chapters.comic_id = comics.comic_id
    WHERE comics.comic_id = ? AND comics.creator = ? AND comics.is_exist = 0
  `;
  pool.query(query, [comicHash, currentAccount], (error, results, fields) => {
    if (error) {
      console.error('Error fetching chapter records: ', error);
      return res.status(500).json({ message: 'Error fetching chapter records' });
    }
    res.json(results);
  });
});


app.get('/api/isCreator', async (req, res) => {
  const currentAccount = req.query.currentAccount;
  const query = `SELECT user.is_creator FROM user WHERE user.address = ?`;
  pool.query(query, [currentAccount], (error, results, fields) => {
    if (error) {
      console.error('Error fetching creator status: ', error);
      return res.status(500).json({ message: 'Error fetching creator status' });
    }
    res.json(results);
  });
});


app.get('/api/creatorPage/popPurchase', async (req, res) => {
  const currentAccount = req.query.currentAccount;
  const query = `
      SELECT 
          comics.comic_id,
          COALESCE(COUNT(records.comic_id), 0) AS totBuy
      FROM 
          comics
      LEFT JOIN records ON comics.comic_id = records.comic_id
      LEFT JOIN user ON records.buyer = user.address
      WHERE 
          comics.creator = ? AND comics.is_exist = 0
      GROUP BY 
          comics.comic_id
  `;
  pool.query(query, [currentAccount], (error, results, fields) => {
    if (error) {
      console.error('Error fetching comic records: ', error);
      return res.status(500).json({ message: 'Error fetching comic records' });
    }
    res.json(results);
  });
});


app.get('/api/creatorPage/updateChapter', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const query = `
    SELECT comicHash, create_timestamp
    FROM (
      SELECT
        comics.comic_id AS comicHash,
        chapters.create_timestamp,
        ROW_NUMBER() OVER (PARTITION BY comics.comic_id ORDER BY chapters.create_timestamp DESC) AS rn
      FROM chapters
      INNER JOIN comics ON chapters.comic_id = comics.comic_id
      WHERE comics.creator = ? AND comics.is_exist = 0
    ) AS subquery
    WHERE rn = 1
    ORDER BY create_timestamp DESC
  `;
  pool.query(query, [currentAccount], (error, results, fields) => {
    if (error) {
      console.error('Error fetching chapter records: ', error);
      return res.status(500).json({ message: 'Error fetching chapter records' });
    }
    res.json(results);
  });
});


app.get('/api/homepage/updateStats', (req, res) => {
  const query = `
      SELECT 
          comics.comic_id,
          COUNT(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(user.collectComic, CONCAT('$."', comics.comic_id, '"'))) IS NOT NULL THEN 1 END) AS totHearts,
          COALESCE(purchase_stats.purchase_count, 0) AS totBuy
      FROM 
          comics
      LEFT JOIN 
          user ON JSON_UNQUOTE(JSON_EXTRACT(user.collectComic, CONCAT('$."', comics.comic_id, '"'))) IS NOT NULL
      LEFT JOIN (
          SELECT 
              comic_id,
              COUNT(*) AS purchase_count
          FROM 
              records
          WHERE 
              EXISTS (SELECT 1 FROM comics WHERE records.comic_id = comics.comic_id AND comics.is_exist = 0)
          GROUP BY 
              comic_id
      ) AS purchase_stats ON purchase_stats.comic_id = comics.comic_id
      WHERE 
          comics.is_exist = 0
      GROUP BY 
          comics.comic_id
  `;
  pool.query(query, (error, results) => {
      if (error) {
          console.error('Error fetching comic records: ', error);
          return res.status(500).json({ message: 'Error fetching comic records' });
      }
      res.json(results);
  });
});


app.get('/api/category/updateChapter', (req, res) => {
  const currentCategory = req.query.currentCategory;
  const query = `
    SELECT comicHash, create_timestamp
    FROM (
      SELECT
        comics.comic_id AS comicHash,
        chapters.create_timestamp,
        ROW_NUMBER() OVER (PARTITION BY comics.comic_id ORDER BY chapters.create_timestamp DESC) AS rn
      FROM chapters
      INNER JOIN comics ON chapters.comic_id = comics.comic_id
      WHERE comics.category = ? AND comics.is_exist = 0
    ) AS subquery
    WHERE rn = 1
    ORDER BY create_timestamp DESC
  `;
  pool.query(query, [currentCategory], (error, results, fields) => {
    if (error) {
      console.error('Error fetching chapter records: ', error);
      return res.status(500).json({ message: 'Error fetching chapter records' });
    }
    res.json(results);
  });
});


app.get('/api/category/updateComic', (req, res) => {
  const currentCategory = req.query.currentCategory;
  const query = `
      SELECT comic_id AS comicHash, create_timestamp
      FROM comics
      WHERE category = ? AND is_exist = 0
      ORDER BY create_timestamp DESC
  `;
  pool.query(query, [currentCategory], (error, results, fields) => {
      if (error) {
          console.error('Error fetching comic records: ', error);
          return res.status(500).json({ message: 'Error fetching comic records' });
      }
      res.json(results);
  });
});


app.get('/api/category/updateStats', (req, res) => {
  const currentCategory = req.query.currentCategory;
  const query = `
      SELECT 
          comics.comic_id,
          COUNT(DISTINCT user.address) AS totHearts,
          COALESCE(purchase_stats.purchase_count, 0) AS totBuy
      FROM 
          comics
      LEFT JOIN 
          user ON JSON_UNQUOTE(JSON_EXTRACT(user.collectComic, CONCAT('$."', comics.comic_id, '"'))) IS NOT NULL
      LEFT JOIN (
          SELECT 
              records.comic_id,
              COUNT(records.comic_id) AS purchase_count
          FROM 
              records
          INNER JOIN 
              comics ON records.comic_id = comics.comic_id
          INNER JOIN 
              user ON records.buyer = user.address
          WHERE 
              comics.category = ? AND comics.is_exist = 0
          GROUP BY 
              records.comic_id
      ) AS purchase_stats ON purchase_stats.comic_id = comics.comic_id
      WHERE 
          comics.category = ? AND comics.is_exist = 0
      GROUP BY 
          comics.comic_id
  `;
  pool.query(query, [currentCategory, currentCategory], (error, results) => {
      if (error) {
          console.error('Error fetching comic records: ', error);
          return res.status(500).json({ message: 'Error fetching comic records' });
      }
      res.json(results);
  });
});


app.get('/api/comicDetail/isFavorited', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const comicHash = req.query.comicHash;
  let query;
  let queryParams = [];
  query = `SELECT collectComic FROM user WHERE address = ?`;
  queryParams = [currentAccount];
  pool.query(query, queryParams, (error, results) => {
    if (error) {
      console.error('Error fetching data: ', error);
      return res.status(500).json({ message: 'Error fetching data' });
    }
    if (comicHash) {
      const collectComic = results[0]?.collectComic || {};
      const isFavorited = collectComic.hasOwnProperty(comicHash);
      return res.json({ isFavorited });
    } else {
      if (results.length === 0) {
        return res.json({ collectComic: {} }); // 如果没有找到用户数据，返回空对象
      }
      const collectComic = results[0]?.collectComic || {};
      return res.json({ collectComic });
    }
  });
});


app.get('/api/nftDetail/records', (req, res) => {
  const tokenId = req.query.tokenId;
  const query = `
    SELECT nft.*, comics.title, comics.description AS comicDesc, comics.filename , comics.protoFilename, user.penName
    FROM nft
    INNER JOIN comics ON nft.comicHash = comics.comic_id
    INNER JOIN user ON nft.minter = user.address
    WHERE nft.tokenId = ? AND comics.is_exist = 0
  `;
  pool.query(query, [tokenId], (error, results, fields) => {
    if (error) {
      console.error('Error fetching creator NFT records: ', error);
      return res.status(500).json({ message: 'Error fetching creator NFT records' });
    }
    if (results.length === 0) {
      return res.json([]);
    }
    res.json(results);
  });
});


app.get('/api/nftDetail/isFavorited', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const comicHash = req.query.comicHash;
  const query = `SELECT collectNFT FROM user WHERE address = ?`;
  pool.query(query, [currentAccount], (error, results) => {
    if (error) {
      console.error('Error fetching data: ', error);
      return res.status(500).json({ message: 'Error fetching data' });
    }
    if (results.length === 0) {
      return res.json({ collectNFT: {} }); // 如果没有找到用户数据，返回空对象
    }
    const collectNFT = results[0]?.collectNFT || {};
    if (comicHash) {
      const isFavorited = collectNFT.hasOwnProperty(comicHash);
      const value = isFavorited ? collectNFT[comicHash] : null;
      return res.json({ isFavorited, value });
    } else {
      const allValues = Object.values(collectNFT).flat();
      const tokenIds = allValues.map(value => {
        const match = value.match(/tokenId(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      }).filter(id => id !== null);
      if (tokenIds.length === 0) {
        return res.json([]); // 如果没有 tokenId, 返回空数组
      }
      const placeholders = tokenIds.map(() => '?').join(',');
      const queryString = `
        SELECT 
          comics.title, comics.comic_id , comics.filename, comics.protoFilename, nft.tokenId, nft.tokenTitle, nft.price ,nft.description, nft.forSale ,nft.minter, nft.owner
        FROM nft
        INNER JOIN comics ON nft.comicHash = comics.comic_id
        WHERE nft.tokenId IN (${placeholders}) AND comics.is_exist = 0
      `;
      pool.query(queryString, tokenIds, (error, results) => {
        if (error) {
          console.error('Error fetching chapters and comics info: ', error);
          return res.status(500).json({ message: 'Error fetching chapters and comics info' });
        }
        const processedResults = results.map(result => ({
          ...result,
          status: [result.minter, result.owner].includes(currentAccount) ? true : false
      }));
        res.json(processedResults.length > 0 ? processedResults : []);
      });
    }
  });
});


app.get('/api/nftOwner/records', (req, res) => {
  const tokenId = req.query.tokenId;
  const currentAccount = req.query.currentAccount;
  const query = `
    SELECT nft.*, comics.title, comics.description AS comicDesc, comics.filename , comics.protoFilename, user.penName
    FROM nft
    INNER JOIN comics ON nft.comicHash = comics.comic_id
    INNER JOIN user ON nft.minter = user.address
    WHERE nft.tokenId = ? AND nft.owner = ? AND comics.is_exist = 0
  `;
  pool.query(query, [tokenId, currentAccount], (error, results, fields) => {
    if (error) {
      console.error('Error fetching creator NFT records: ', error);
      return res.status(500).json({ message: 'Error fetching creator NFT records' });
    }
    if (results.length === 0) {
      return res.json([]);
    }
    res.json(results);
  });
});


app.get('/api/comicRead', (req, res) => {
  const comicHash = req.query.comicHash;
  const currentAccount = req.query.currentAccount;
  const query = `
    SELECT 
      comics.title AS comicTitle,
      chapters.chapter_id AS chapterHash,
      chapters.title AS chapterTitle,
      chapters.filename,
      comics.creator,
      chapters.create_timestamp,
      chapters.price AS chapterPrice,
      IF(records.buyer IS NOT NULL, '閱讀', '購買') AS isBuying
    FROM chapters
    INNER JOIN comics ON chapters.comic_id = comics.comic_id
    LEFT JOIN records ON chapters.chapter_id = records.chapter_id AND records.buyer = ?
    WHERE comics.comic_id = ?
    AND comics.is_exist = 0
  `;
  pool.query(query, [currentAccount, comicHash], (error, results, fields) => {
    if (error) {
      console.error('Error fetching chapters and comics info: ', error);
      return res.status(500).json({ message: 'Error fetching chapters and comics info' });
    }
    if (results.length === 0) {
      return res.json([]);
    }
    res.json(results);
  });
});


app.get('/api/messagePage', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const selectQuery = `
    SELECT collectComic
    FROM user
    WHERE address = ?
  `;
  pool.query(selectQuery, [currentAccount], (selectError, selectResults) => {
    if (selectError) {
      console.error('查询 collectComic 字段时发生错误：', selectError);
      return res.status(500).json({ message: '查询 collectComic 字段时发生错误' });
    }
    if (!selectResults.length || !selectResults[0].collectComic) {
      return res.json({ message: '請先收藏漫畫!' });
    }
    const collectComic = selectResults[0].collectComic;
    const comicIDs = Object.keys(collectComic);
    const updatedComics = [];
    let completedQueries = 0;
    comicIDs.forEach(comicID => {
      const sql = `
        SELECT chapters.title AS chapterTitle, 
               chapters.create_timestamp AS newCreate, 
               comics.title AS comicTitle, 
               comics.filename
        FROM chapters
        INNER JOIN comics ON chapters.comic_id = comics.comic_id
        WHERE chapters.comic_id = ? 
          AND comics.is_exist = 0
        ORDER BY chapters.create_timestamp DESC 
        LIMIT 1
      `;
      pool.query(sql, [comicID], (error, results) => {
        if (error) {
          console.error(`Error occurred while querying the collect status for comicID ${comicID}:`, error);
          return res.status(500).json({ message: 'Error occurred while querying the collect status' });
        }
        if (results.length) {
          const { comicTitle, chapterTitle, filename, newCreate } = results[0];
          updatedComics.push({ comicHash: comicID, comicTitle, chapterTitle, filename, newCreate });
        }
        completedQueries++;
        if (completedQueries === comicIDs.length) {
          res.json({ collectComic: updatedComics });
        }
      });
    });
  });
});


app.get('/api/creatorNft/records', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const query = `
    SELECT nft.*, comics.title, comics.filename , comics.protoFilename
    FROM nft
    INNER JOIN comics ON nft.comicHash = comics.comic_id
    WHERE nft.minter = ? AND comics.is_exist = 0
  `;
  pool.query(query, [currentAccount], (error, results, fields) => {
    if (error) {
      console.error('Error fetching creator NFT records: ', error);
      return res.status(500).json({ message: 'Error fetching creator NFT records' });
    }
    if (results.length === 0) {
      return res.json([]);
    }
    res.json(results);
  });
});


app.get('/api/nftMarket/records', (req, res) => {
  const query = `
    SELECT nft.*, comics.title, comics.filename , comics.protoFilename, user.penName
    FROM nft
    INNER JOIN comics ON nft.comicHash = comics.comic_id
    INNER JOIN user ON nft.minter = user.address
    WHERE comics.is_exist = 0
  `;
  pool.query(query, (error, results, fields) => {
    if (error) {
      console.error('Error fetching creator NFT records: ', error);
      return res.status(500).json({ message: 'Error fetching creator NFT records' });
    }
    if (results.length === 0) {
      return res.json([]);
    }
    res.json(results);
  });
});


app.get('/api/searchPage/LP', (req, res) => {
  const query = `
    SELECT category, description AS text, filename, protoFilename
    FROM comics
    WHERE create_timestamp = (
        SELECT MAX(create_timestamp)
        FROM comics AS sub
        WHERE sub.category = comics.category AND sub.is_exist = 0
    )
      AND is_exist = 0
    GROUP BY category, description, filename, protoFilename
    ORDER BY (
        SELECT COUNT(*)
        FROM comics AS sub
        WHERE sub.category = comics.category AND sub.is_exist = 0
    ) DESC
    LIMIT 4;
  `;
  pool.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching latest records by category: ', error);
      return res.status(500).json({ message: 'Error fetching latest records by category' });
    }
    res.json(results.length ? results : []);
  });
});


app.get('/api/searchPage/Keyword', (req, res) => {
  const searchTerm = req.query.term;
  const query = `
    SELECT title, description AS text, comic_id, filename, protoFilename
    FROM comics
    WHERE is_exist = 0 AND (
      creator LIKE ? OR
      title LIKE ? OR
      description LIKE ? OR
      category LIKE ?
    )
  `;
  const searchTermPattern = `%${searchTerm}%`;
  pool.query(query, [searchTermPattern, searchTermPattern, searchTermPattern, searchTermPattern], (error, results) => {
    if (error) {
      console.error('Error fetching keyword results: ', error);
      return res.status(500).json({ message: 'Error fetching keyword results' });
    }
    res.json(results);
  });
});


app.get('/api/rankingList/top10', (req, res) => {
  const query = `
      SELECT 
          comics.comic_id, comics.creator, comics.title, comics.description, comics.filename,
          COUNT(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(user.collectComic, CONCAT('$."', comics.comic_id, '"'))) IS NOT NULL THEN 1 END) AS totHearts,
          COALESCE(purchase_stats.purchase_count, 0) AS totBuy,
          COUNT(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(user.collectComic, CONCAT('$."', comics.comic_id, '"'))) IS NOT NULL THEN 1 END) + COALESCE(purchase_stats.purchase_count, 0) AS total
      FROM 
          comics
      LEFT JOIN 
          user ON JSON_UNQUOTE(JSON_EXTRACT(user.collectComic, CONCAT('$."', comics.comic_id, '"'))) IS NOT NULL
      LEFT JOIN (
          SELECT 
              comic_id,
              COUNT(*) AS purchase_count
          FROM 
              records
          WHERE 
              EXISTS (SELECT 1 FROM comics WHERE records.comic_id = comics.comic_id AND comics.is_exist = 0)
          GROUP BY 
              comic_id
      ) AS purchase_stats ON purchase_stats.comic_id = comics.comic_id
      WHERE 
          comics.is_exist = 0
      GROUP BY 
          comics.comic_id
      ORDER BY 
          total DESC
      LIMIT 10
  `;
  pool.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching rankingList: ', error);
      return res.status(500).json({ message: 'Error fetching rankingList' });
    }
    res.json(results.length ? results : []);
  });
});


app.get('/api/rankingList/purRank', (req, res) => {
  const query = `
      SELECT 
          c.comic_id, c.creator, c.title, c.description, c.filename,
          COALESCE(purchase_stats.purchase_count, 0) AS totBuy
      FROM 
          comics c
      LEFT JOIN (
          SELECT 
              comic_id,
              COUNT(*) AS purchase_count
          FROM 
              records
          WHERE 
              EXISTS (SELECT 1 FROM comics WHERE records.comic_id = comics.comic_id AND is_exist = 0)
          GROUP BY 
              comic_id
      ) AS purchase_stats ON purchase_stats.comic_id = c.comic_id
      WHERE 
          c.is_exist = 0
      ORDER BY 
          totBuy DESC
      LIMIT 10
  `;
  pool.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching rankingList: ', error);
      return res.status(500).json({ message: 'Error fetching rankingList' });
    }
    res.json(results.length ? results : []);
  });
});


app.get('/api/rankingList/favoriteRank', (req, res) => {
  const query = `
      SELECT 
          comics.comic_id, comics.creator, comics.title, comics.description, comics.filename,
          COUNT(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(user.collectComic, CONCAT('$."', comics.comic_id, '"'))) IS NOT NULL THEN 1 END) AS totHearts
      FROM 
          comics
      LEFT JOIN 
          user ON JSON_UNQUOTE(JSON_EXTRACT(user.collectComic, CONCAT('$."', comics.comic_id, '"'))) IS NOT NULL
      WHERE 
          comics.is_exist = 0
      GROUP BY 
          comics.comic_id
      ORDER BY 
          totHearts DESC
      LIMIT 10
  `;
  pool.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching rankingList: ', error);
      return res.status(500).json({ message: 'Error fetching rankingList' });
    }
    res.json(results.length ? results : []);
  });
});


app.get('/api/rankingList/weekRank', (req, res) => {
  const query = `
      SELECT 
          comics.comic_id, comics.creator, comics.title, comics.description, comics.filename,
          COALESCE(purchase_stats.purchase_count, 0) AS totBuy
      FROM 
          comics
      LEFT JOIN (
          SELECT 
              comic_id,
              COUNT(*) AS purchase_count
          FROM 
              records
          WHERE 
              purchase_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              AND EXISTS (SELECT 1 FROM comics WHERE records.comic_id = comics.comic_id AND comics.is_exist = 0)
          GROUP BY 
              comic_id
      ) AS purchase_stats ON purchase_stats.comic_id = comics.comic_id
      WHERE 
          comics.is_exist = 0
      GROUP BY 
          comics.comic_id
      ORDER BY 
          totBuy DESC
      LIMIT 10
  `;
  pool.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching rankingList: ', error);
      return res.status(500).json({ message: 'Error fetching rankingList' });
    }
    res.json(results.length ? results : []);
  });
});


app.get('/api/rankingList/newRank', (req, res) => {
  const query = `
      SELECT 
          comic_id, creator, title, description, filename, create_timestamp
      FROM 
          comics
      WHERE 
          is_exist = 0
      ORDER BY 
          create_timestamp DESC
      LIMIT 10
  `;
  pool.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching rankingList:', error);
      return res.status(500).json({ message: 'Error fetching rankingList' });
    }
    res.json(results);
  });
});


app.get('/api/comicManagement/isAdmin', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const query = `
      SELECT 
          address
      FROM 
          user
      WHERE 
          is_admin = 1 AND address = ?
  `;
  pool.query(query, [currentAccount], (error, results) => {
    if (error) {
      console.error('Error fetching addresses:', error);
      return res.status(500).json({ message: 'Error fetching addresses' });
    }
    if (results.length === 0) {
      return res.json({ exists: false });
    }
    const allAddressesQuery = `
        SELECT 
            address, is_creator, is_admin
        FROM 
            user
    `;
    pool.query(allAddressesQuery, (error, allResults) => {
      if (error) {
        console.error('Error fetching all addresses:', error);
        return res.status(500).json({ message: 'Error fetching all addresses' });
      }
      res.json({ exists: true, address: allResults });
    });
  });
});


app.get('/api/comicManagement/totalCost', (req, res) => {
  const comicHash = req.query.comicHash;
  const query = `
    SELECT COALESCE(SUM(records.price), 0) AS totalCost
    FROM records
    INNER JOIN chapters ON records.chapter_id = chapters.chapter_id
    INNER JOIN comics ON chapters.comic_id = comics.comic_id
    WHERE comics.comic_id = ?
  `;
  pool.query(query, [comicHash], (error, results) => {
    if (error) {
      console.error('Error fetching total cost: ', error);
      return res.status(500).json({ message: 'Error fetching total cost' });
    }
    res.json(results[0].totalCost);
  });
});


app.get('/api/authorProfile', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const query = `
    SELECT user.penName, user.info
    FROM user
    WHERE user.is_creator = 1 AND user.address = ?
  `;
  pool.query(query, [currentAccount], (error, results, fields) => {
    if (error) {
      console.error('Error fetching user records: ', error);
      return res.status(500).json({ message: 'Error fetching user records' });
    }
    if (results.length === 0) {
      return res.json([]);
    }
    res.json(results);
  });
});


app.get('/api/dataAnalysis/records', (req, res) => {
  const currentAccount = req.query.currentAccount;
  const query = `
    SELECT comics.title AS comicTitle, comics.category, comics.filename, chapters.title AS chapterTitle , records.purchase_date, records.price, records.buyer
    FROM records
    INNER JOIN chapters ON records.chapter_id = chapters.chapter_id
    INNER JOIN comics ON chapters.comic_id = comics.comic_id
    WHERE comics.creator = ? AND comics.comic_id = records.comic_id AND comics.is_exist = 0
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


// 啟動伺服器
app.listen(port, () => {
  console.log(`伺服器正在監聽 http://localhost:${port}`);
});
  