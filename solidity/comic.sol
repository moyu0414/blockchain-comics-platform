    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.24;

    contract ComicPlatform {
        constructor() {
            admins[msg.sender] = true; // 部署合約的地址設為管理者
            admins[0xC6Bf9f4E9C1042Ca3aF0a33ce51506c3a123162c] = true;
            admins[0xb4C39375f9cBCCdD5dA4423F210A74f7Cbd110B7] = true;
        }
        // 定義章節結構體
        struct Chapter {
            uint256 price; // 章節價格
            string title; // 章節標題
        }
        // 定義漫畫結構體
        struct Comic {
            address payable owner; // 漫畫所有者的錢包地址
            string title; // 漫畫標題
            string author; // 漫畫作者
            string description; // 漫畫描述
            uint8 level; //漫畫分級
            bool exists; // 漫畫是否存在
        }
        
        // 儲存已上傳的漫畫
        mapping(bytes32 => Comic) public comics;
        // 儲存每本漫畫的章節信息
        mapping (bytes32 =>mapping(bytes32 => Chapter))  public comicChapterdata;
        // 儲存每本漫畫的章節信息
        mapping(bytes32 => bytes32[]) public comicChapters;
        // 記錄每個地址購買的章節
        mapping(address => mapping(bytes32 => mapping(bytes32 => bool))) public purchasedChapters;  
        //記錄每本漫畫的章節的標題，避免重複上傳
        mapping(bytes32 => mapping(string => bool)) private comicChapterTitles;
        //記錄每本漫畫的章節的hash，保持唯一性
        mapping(bytes32 => mapping(bytes32 => bool)) private comicChapterHashes;
        // 漫畫章節的購買記錄
        mapping(bytes32 => mapping(bytes32 => address[])) public chapterPurchases;
        //個人書櫃 地址->漫畫hash
        mapping(address => bytes32[]) public userPurchases;
        //章節價格 漫畫hash->章節hash->價格
        mapping(bytes32 => mapping(bytes32 => uint256)) public chapterPrice;
        //漫畫編輯紀錄
        mapping(bytes32 => bytes32) public editComicHistory;
        //章節編輯紀錄
        mapping (bytes32 =>mapping(bytes32 => bytes32))  public editChapterHistory;
         // 管理者列表
        mapping(address => bool) public  admins;
        //首頁 all漫畫hash
        bytes32[] public allComicHashes;
        
        // 定義漫畫上傳事件
        event ComicUploaded(
            bytes32 indexed comicHash,
            address indexed owner,
            string title,
            string author,
            string description,
            uint8 level 
        );
        // 定義漫畫hash編輯事件
        event ComichasgEdited(
            bytes32 indexed frist_hash,
            bytes32 indexed oldhash,
            bytes32 indexed newhash
        );
        // 定義漫畫資料編輯事件
        event ComicdataEdited(
            bytes32 indexed comicHash,
            string title,
            string author,
            string description,
            uint8 level 
        );
        //定義章節上傳事件
        event ChapterUploaded(
            bytes32 indexed comicHash,
            bytes32 indexed chapterHash,
            address indexed owner,
            string title,
            uint256 price
        );
        //定義購買事件
        event ChapterPurchased(
            bytes32 indexed comicHash,
            bytes32 indexed chapterHash,
            address indexed buyer,
            uint256 price
        );
        // 定義章節hash編輯事件
        event ChapterHashEdited(
            bytes32 indexed comicHash,
            bytes32 indexed frist_hash,
            bytes32 oldHash,
            bytes32 indexed newHash
        );
        // 定義章節資料編輯事件
        event ChapterDataEdited(
            bytes32 indexed comicHash,
            bytes32 indexed chapterHash,
            string title,
            uint256 price
        );

        modifier onlyAdmin() {
            require(admins[msg.sender], "Caller is not an admin");
            _;
        }

        function addAdmin(address newAdmin) external onlyAdmin {
            admins[newAdmin] = true;
        }

        function removeAdmin(address admin) external onlyAdmin {
            require(admin != msg.sender, "Admin cannot remove themselves");
            require(admins[admin], "Address is not an admin");
            admins[admin] = false;
        }
        function toggleComicExistence(bytes32 _comicHash) external onlyAdmin {
            bytes32 actualHash = editComicHistory[_comicHash];
            require(comics[actualHash].owner != address(0), "Comic does not exist");
            comics[actualHash].exists = !comics[actualHash].exists;
        }

        // 上傳漫畫功能
        function uploadComic(bytes32  _comicHash,string memory _title,string memory _author,string memory _description,uint8 _level ) external {    
            require(comics[_comicHash].owner == address(0), "Comic already uploaded");// 確認漫畫未重複上傳

            // 紀錄漫畫資訊
            comics[_comicHash] = Comic({
                owner: payable(msg.sender),
                title: _title,
                author: _author,
                description: _description,
                level: _level,
                exists: true
            });

            allComicHashes.push(_comicHash);// 添加至所有漫畫hash紀錄
            editComicHistory[_comicHash] = _comicHash;// 設置初始編輯紀錄
 
            emit ComicUploaded(_comicHash, msg.sender, _title, _author, _description,_level);// 觸發漫畫上傳事件
        }      
        // 添加章節功能
        function addChapter(bytes32 _comicHash,bytes32 _chapterHash,string memory _title,uint256 _price) external {
            bytes32 actualComicHash = editComicHistory[_comicHash];

            require(comics[actualComicHash].exists, "Comic does not exist"); //確認漫畫是否存在
            require(comics[actualComicHash].owner == msg.sender, "You are not owner");// 確認是否為擁有者
            require(!comicChapterHashes[actualComicHash][_chapterHash], "Chapter already exists");//確認章節唯一性
            require(!comicChapterTitles[actualComicHash][_title] , "Title already exists");//確認標題唯一性

            // 添加章節到漫畫的章節信息中
            comicChapterdata[actualComicHash][_chapterHash] = Chapter({
                price: _price,
                title: _title
            });

            comicChapters[actualComicHash].push(_chapterHash);//新增章節
            editChapterHistory[actualComicHash][_chapterHash] = _chapterHash; //編輯紀錄第一筆
            comicChapterTitles[actualComicHash][_title] = true; // 將章節標題標記為已存在
            comicChapterHashes[actualComicHash][_chapterHash] = true;// 將章節hash標記為已存在
            chapterPrice[actualComicHash][_chapterHash] = _price; //紀錄章節價格

            emit ChapterUploaded(actualComicHash,_chapterHash, msg.sender, _title, _price);
        }

        function getAllComicHashes() external view returns (bytes32[] memory,string[] memory,bool[] memory) {
            uint256 length = allComicHashes.length;
            bytes32[] memory hashes = new bytes32[](length);
            string[] memory titles = new string[](length);
            bool[] memory status  = new bool[](length);

            for (uint256 i = 0; i < allComicHashes.length; i++) {           
                bytes32 comicHash = allComicHashes[i];       
                hashes[i] = editComicHistory[comicHash];
                titles[i] = comics[comicHash].title;  
                status[i] = comics[comicHash].exists;             
            }

            return(hashes,titles,status);
        }
        function getChapters(bytes32 _comicHash,address _user) external view returns (bytes32[] memory, string[] memory, uint256[] memory, bool[] memory) {
            bytes32 actualComicHash = editComicHistory[_comicHash];
            require(comics[actualComicHash].exists, "Comic does not exist");

            bytes32[] storage comicChaptersArray = comicChapters[actualComicHash];
            uint256 length = comicChaptersArray.length;

            bytes32[] memory hashes = new bytes32[](length);
            string[] memory titles = new string[](length);
            uint256[] memory prices = new uint256[](length);
            bool[] memory status = new bool[](length);

            for (uint256 i = 0; i < length; i++) {
                bytes32 chapterHash  = comicChaptersArray[i];
                hashes[i] = editChapterHistory[actualComicHash][chapterHash];
                titles[i] = comicChapterdata[actualComicHash][chapterHash].title;
                prices[i] = comicChapterdata[actualComicHash][chapterHash].price;
                status[i] = purchasedChapters[_user][actualComicHash][chapterHash];
            }
            return (hashes, titles, prices,status);
        }
            
        // 購買章節
        function purchaseChapter(bytes32 _comicHash, bytes32 _chapterHash) external payable{               
            bytes32 actualComicHash = editComicHistory[_comicHash];
            bytes32 actualChapterHash = editChapterHistory[actualComicHash][_chapterHash];

            require(comics[actualComicHash].exists, "Comic does not exist");// 檢查漫畫是否存在
            require(comicChapterHashes[actualComicHash][actualChapterHash], "Chapter does not exists");// 檢查章節是否存在
            require(!purchasedChapters[msg.sender][actualComicHash][actualChapterHash], "Chapter already purchased");// 檢查是否已購買過此章節
    
            uint256 price = chapterPrice[actualComicHash][actualChapterHash];
            require(msg.value >= price, "Insufficient payment");// 檢查錢包是否有錢
            
            comics[actualComicHash].owner.transfer(price);//轉帳給漫畫持有者

            // 儲存購買記錄
            purchasedChapters[msg.sender][actualComicHash][actualChapterHash] = true;
            chapterPurchases[actualComicHash][actualChapterHash].push(msg.sender);
            userPurchases[msg.sender].push(actualComicHash);

            // 觸發購買事件
            emit ChapterPurchased(actualComicHash, _chapterHash, msg.sender, price);
        }

        //獲取使用者購買漫畫
        function getmycomics() external view returns (bytes32[] memory, string[] memory,bool[] memory){
            uint256 userComicCount = userPurchases[msg.sender].length;

            bytes32[] memory hashes = new bytes32[](userComicCount);
            string[] memory titles = new string[](userComicCount);
            bool[] memory status  = new bool[](userComicCount);

            for (uint256 i = 0; i < allComicHashes.length; i++) {
                bytes32 comicHash = userPurchases[msg.sender][i];                  
                hashes[i] = editComicHistory[comicHash];
                titles[i] = comics[comicHash].title ;
                status[i] = comics[comicHash].exists;             
            }
            
            return(hashes,titles,status);
        }

        //取得漫畫目前信息
        function getcomic(bytes32 _comicHash) external view returns(string memory,string memory,string memory,uint8){         
            bytes32 actualComicHash = editComicHistory[_comicHash];

            require(comics[actualComicHash].exists, "Comic does not exist");

            string memory title = comics[actualComicHash].title;
            string memory author = comics[actualComicHash].author;
            string memory description = comics[actualComicHash].description;
            uint8  level = comics[actualComicHash].level;

            return(title,author,description,level);
        }
        //編輯漫畫圖片
        function editcomichash(bytes32 old_hash, bytes32 new_hash) external {           
            bytes32 actualComicHash = editComicHistory[old_hash];

            require(comics[actualComicHash].exists, "Comic does not exist");
            require(comics[actualComicHash].owner == msg.sender, "You are not owner"); // 確認是否為擁有者

            editComicHistory[actualComicHash] = new_hash;
            editComicHistory[new_hash] = actualComicHash;

            emit ComichasgEdited(actualComicHash,old_hash,new_hash);
        }
        //編輯漫畫信息
        function editcomicdata(bytes32 _comicHash,string memory _title,string memory _author,string memory _description,uint8 _level)external{      
            bytes32 actualComicHash = editComicHistory[_comicHash];

            require(comics[actualComicHash].exists, "Comic does not exist");
            require(comics[actualComicHash].owner == msg.sender, "You are not owner"); // 確認是否為擁有者

            comics[actualComicHash].title = _title;
            comics[actualComicHash].author = _author;
            comics[actualComicHash].description = _description;
            comics[actualComicHash].level = _level;

            emit ComicdataEdited(actualComicHash,_title,_author,_description,_level);
        }

        //取得章節目前信息
        function getchapterdata(bytes32 _comicHash,bytes32 _chapterHash) external view returns(string memory,uint256){     
                bytes32 actualComicHash = editComicHistory[_comicHash];
                bytes32 actualChapterHash = editChapterHistory[actualComicHash][_chapterHash];

                require(comics[actualComicHash].exists, "Comic does not exist");

                string memory title = comicChapterdata[actualComicHash][actualChapterHash].title;
                uint256 price = chapterPrice[actualComicHash][actualChapterHash];

                return(title,price);
        }
        //編輯章節圖片
        function editchapterhash(bytes32 _comicHash,bytes32 old_hash, bytes32 new_hash) external {      
            bytes32 actualComicHash = editComicHistory[_comicHash];

            require(comics[actualComicHash].exists, "Comic does not exist");
            require(comics[actualComicHash].owner == msg.sender, "You are not owner");// 確認是否為擁有者

            bytes32 actualChapterHash = editChapterHistory[actualComicHash][old_hash];
            require(editChapterHistory[actualComicHash][actualChapterHash] != new_hash, "Repeat edit!");

            editChapterHistory[actualComicHash][actualChapterHash] = new_hash;
            editChapterHistory[actualComicHash][new_hash] = actualChapterHash;
            
            emit ChapterHashEdited(actualComicHash,actualChapterHash,old_hash, new_hash);
        }
        //編輯章節信息
        function editchapterdata(bytes32 _comicHash,bytes32 _chapterHash,string memory _title,uint256 _price)external{   
            bytes32 actualComicHash = editComicHistory[_comicHash];
            bytes32 actualChapterHash = editChapterHistory[actualComicHash][_chapterHash];

            require(comics[actualComicHash].exists, "Comic does not exist");
            require(comics[actualComicHash].owner == msg.sender, "You are not owner"); // 確認是否為擁有者

            comicChapterTitles[actualComicHash][comicChapterdata[actualComicHash][actualChapterHash].title] = false;//原先title設定為false
            
            //編輯原始資料
            comicChapterdata[actualComicHash][actualChapterHash].title = _title;
            comicChapterdata[actualComicHash][actualChapterHash].price = _price;

            comicChapterTitles[actualComicHash][_title] = true;//新title設定true，避免重複上傳
            chapterPrice[actualComicHash][actualChapterHash] = _price;//修正新價格

            emit ChapterDataEdited(actualComicHash, actualChapterHash, _title, _price);
        }
}