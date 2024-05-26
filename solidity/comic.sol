/**
 *Submitted for verification at Etherscan.io on 2024-05-26
*/

/**
 *Submitted for verification at Etherscan.io on 2024-05-25
*/

/**
    *Submitted for verification at Etherscan.io on 2024-05-08
    */

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
        mapping(address => mapping(bytes32 => bool)) public purchasedChapters; 
        //記錄每本漫畫的章節的標題，避免重複上傳
        mapping(bytes32 => mapping(string => bool)) private comicChapterTitles;
        //記錄每本漫畫的章節的hash，保持唯一性
        mapping(bytes32 => mapping(bytes32 => bool)) private comicChapterhashs;
        // 漫畫章節的購買記錄
        mapping(bytes32 => mapping(bytes32 => address[])) public chapterPurchases;
        //個人書櫃 地址->漫畫hash
        mapping(address => bytes32[]) public userPurchases;
        //章節價格 漫畫hash->章節hash->價格
        mapping(bytes32 => mapping(bytes32 => uint256)) public ChapterPrice;
        //漫畫編輯紀錄
        mapping(bytes32 => bytes32) public editcomicHistory;
        //章節編輯紀錄
        mapping (bytes32 =>mapping(bytes32 => bytes32))  public editchapterHistory;
         // 管理者列表
        mapping(address => bool) public  admins;
        //首頁 all漫畫hash
        bytes32[] public allComicHashes;
        //取得章節目前信息
        function getchapterdata(bytes32 _comicHash,bytes32 _chapterHash) external view returns(string memory,uint256){
                _comicHash = editcomicHistory[_comicHash];
                _chapterHash = editchapterHistory[_comicHash][_chapterHash];
                require(comics[_comicHash].exists, "Comic does not exist");
                string memory title = comicChapterdata[_comicHash][_chapterHash].title;
                uint256 price = ChapterPrice[_comicHash][_chapterHash];
                return(title,price);
        }
        //編輯章節圖片
        function editchapterhash(bytes32 _comicHash,bytes32 old_hash, bytes32 new_hash) external {
            _comicHash = editcomicHistory[_comicHash];
            require(comics[_comicHash].exists, "Comic does not exist");
            require(comics[_comicHash].owner == msg.sender, "You are not owner"); // 確認是否為擁有者
            bytes32 frist_hash = editchapterHistory[_comicHash][old_hash];
            require(editchapterHistory[_comicHash][frist_hash] != new_hash, "Repeat edit!"); // 確認是否為擁有者
            editchapterHistory[_comicHash][frist_hash] = new_hash;
            editchapterHistory[_comicHash][new_hash] = frist_hash;
            
            emit ChapterHashEdited(_comicHash,frist_hash,old_hash, new_hash);
        }
        //編輯章節信息
        function editchapterdata(
            bytes32 _comicHash,
            bytes32 _chapterHash,
            string memory _title,
            uint256 _price)
            external{
            _comicHash = editcomicHistory[_comicHash];
            _chapterHash = editchapterHistory[_comicHash][_chapterHash];
            require(comics[_comicHash].exists, "Comic does not exist");
            require(comics[_comicHash].owner == msg.sender, "You are not owner"); // 確認是否為擁有者

            comicChapterTitles[_comicHash][comicChapterdata[_comicHash][_chapterHash].title] = false;
            comicChapterdata[_comicHash][_chapterHash].title = _title;
            comicChapterdata[_comicHash][_chapterHash].price = _price;
            comicChapterTitles[_comicHash][_title] = true;
            ChapterPrice[_comicHash][_chapterHash] = _price;

            emit ChapterDataEdited(_comicHash, _chapterHash, _title, _price);

        }

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


        // 上傳漫畫功能
        function uploadComic(
            bytes32  _comicHash,
            string memory _title,
            string memory _author,
            string memory _description,
            uint8 _level 
        ) external {
            // 確認漫畫未重複上傳
            require(comics[_comicHash].owner == address(0), "Comic already uploaded");

            // 將漫畫的識別符號標記為已上傳
            Comic storage newComic = comics[_comicHash];
            newComic.owner = payable(msg.sender);
            newComic.title = _title;
            newComic.author = _author;
            newComic.description = _description;
            newComic.level = _level;
            newComic.exists = true;

            allComicHashes.push(_comicHash);
            editcomicHistory[_comicHash]  = _comicHash;

            // 觸發漫畫上傳事件
            emit ComicUploaded(_comicHash, msg.sender, _title, _author, _description,_level);
        }

        modifier onlyAdmin() {
            require(admins[msg.sender], "Caller is not an admin");
            _;
        }

        function addAdmin(address newAdmin) external onlyAdmin {
            admins[newAdmin] = true;
        }

        function removeAdmin(address admin) external onlyAdmin {
            require(admin != msg.sender, "Admin cannot remove themselves");
            admins[admin] = false;
        }
        function toggleComicExistence(bytes32 _comicHash) external onlyAdmin {
            _comicHash = editcomicHistory[_comicHash];
            require(comics[_comicHash].owner != address(0), "Comic does not exist");
            comics[_comicHash].exists = !comics[_comicHash].exists;
        }
        
        // 添加章節功能
        function addChapter(
            bytes32  _comicHash,
            bytes32  _chapterHash,
            string memory _title,
            uint256 _price
        ) external {
            _comicHash = editcomicHistory[_comicHash];
            require(comics[_comicHash].exists, "Comic does not exist");
            require(comics[_comicHash].owner == msg.sender, "You are not owner");// 確認是否為擁有者
            require(!comicChapterhashs[_comicHash][_chapterHash], "Chapter already exists");//確認章節唯一性
            require(!comicChapterTitles[_comicHash][_title] , "Title already exists");//確認標題唯一性

            // 添加章節到漫畫的章節信息中
            Chapter memory newChapter = Chapter({
                price: _price,
                title: _title
            }); 

            comicChapterdata[_comicHash][_chapterHash] = newChapter;//新增章節
            comicChapters[_comicHash].push(_chapterHash);//新增章節
            editchapterHistory[_comicHash][_chapterHash] = _chapterHash; //編輯紀錄第一筆
            comicChapterTitles[_comicHash][_title] = true; // 將章節標題標記為已存在
            comicChapterhashs[_comicHash][_chapterHash] = true;// 將章節hash標記為已存在
            ChapterPrice[_comicHash][_chapterHash] = _price;

            emit ChapterUploaded(_comicHash,_chapterHash, msg.sender, _title, _price);
        }

        function getAllComicHashes() external view returns (bytes32[] memory,string[] memory,bool[] memory) {
            bytes32[] memory hashes = new bytes32[](allComicHashes.length);
            string[] memory titles = new string[](allComicHashes.length);
            bool[] memory status  = new bool[](allComicHashes.length);
            for (uint256 i = 0; i < allComicHashes.length; i++) {         
                hashes[i] = editcomicHistory[allComicHashes[i]];
                titles[i] = comics[allComicHashes[i]].title;  
                status[i] = comics[allComicHashes[i]].exists;             
            }
            return(hashes,titles,status);
        }

        function getChapters(bytes32 _comicHash) external view returns (bytes32[] memory, string[] memory, uint256[] memory, bool[] memory) {
            _comicHash = editcomicHistory[_comicHash];
            require(comics[_comicHash].exists, "Comic does not exist");
            bytes32[] memory hashes = new bytes32[](comicChapters[_comicHash].length);
            string[] memory titles = new string[](comicChapters[_comicHash].length);
            uint256[] memory prices = new uint256[](comicChapters[_comicHash].length);
            bool[] memory status = new bool[](comicChapters[_comicHash].length);

            for (uint256 i = 0; i < comicChapters[_comicHash].length; i++) {
                bytes32 _chapterhash = comicChapters[_comicHash][i];
                hashes[i] = editchapterHistory[_comicHash][_chapterhash];
                titles[i] = comicChapterdata[_comicHash][_chapterhash].title;
                prices[i] = comicChapterdata[_comicHash][_chapterhash].price;
                status[i] = purchasedChapters[msg.sender][_chapterhash];
            }
            return (hashes, titles, prices,status);
        }
        
        // 購買章節
        function purchaseChapter(bytes32 _comicHash, bytes32 _chapterHash) external payable{         
            _comicHash = editcomicHistory[_comicHash];
            _chapterHash = editchapterHistory[_comicHash][_chapterHash];
            require(comics[_comicHash].exists, "Comic does not exist");
            // 檢查章節是否存在
            require(comicChapterhashs[_comicHash][_chapterHash], "Chapter does not exists");

            // 檢查是否已購買過此章節
            require(!purchasedChapters[msg.sender][_chapterHash], "Chapter already purchased");

            // 檢查支付的價格是否正確
            uint256 price = ChapterPrice[_comicHash][_chapterHash];
            require(msg.value >= price, "Insufficient payment");

            // 儲存購買記錄
            comics[_comicHash].owner.transfer(price);
            purchasedChapters[msg.sender][_chapterHash] = true;
            chapterPurchases[_comicHash][_chapterHash].push(msg.sender);
            userPurchases[msg.sender].push(_comicHash);

            // 觸發購買事件
            emit ChapterPurchased(_comicHash, _chapterHash, msg.sender, price);
        }

        //獲取使用者購買漫畫
        function getmycomics() external view returns (bytes32[] memory, string[] memory,bool[] memory){
            bytes32[] memory hashes = new bytes32[](userPurchases[msg.sender].length);
            string[] memory titles = new string[](userPurchases[msg.sender].length);
            bool[] memory status  = new bool[](userPurchases[msg.sender].length);
            for (uint256 i = 0; i < allComicHashes.length; i++) {                         
                hashes[i] = editcomicHistory[userPurchases[msg.sender][i]];
                titles[i] = comics[userPurchases[msg.sender][i]].title ;
                status[i] = comics[userPurchases[msg.sender][i]].exists;             
            }
            return(hashes,titles,status);
        }

        //取得漫畫目前信息
        function getcomic(bytes32 _comicHash) external view returns(string memory,  string memory,string memory,uint8){
                _comicHash = editcomicHistory[_comicHash];
                require(comics[_comicHash].exists, "Comic does not exist");
                string memory title = comics[_comicHash].title;
                string memory author = comics[_comicHash].author;
                string memory description = comics[_comicHash].description;
                uint8  level = comics[_comicHash].level;
                return(title,author,description,level);
        }
        //編輯漫畫圖片
        function editcomichash(bytes32 old_hash, bytes32 new_hash) external {
            bytes32  _comicHash = editcomicHistory[old_hash];
            require(comics[_comicHash].exists, "Comic does not exist");
            require(comics[_comicHash].owner == msg.sender, "You are not owner"); // 確認是否為擁有者
            editcomicHistory[_comicHash] = new_hash;
            editcomicHistory[new_hash] = _comicHash;
            emit ComichasgEdited(_comicHash,old_hash,new_hash);
        }
        //編輯漫畫信息
        function editcomicdata(
            bytes32 _comicHash,
            string memory _title,
            string memory _author,
            string memory _description,
            uint8 _level)
            external{

            _comicHash = editcomicHistory[_comicHash];
            require(comics[_comicHash].exists, "Comic does not exist");
            require(comics[_comicHash].owner == msg.sender, "You are not owner"); // 確認是否為擁有者
            comics[_comicHash].title = _title;
            comics[_comicHash].author = _author;
            comics[_comicHash].description = _description;
            comics[_comicHash].level = _level;
            emit ComicdataEdited(_comicHash,_title,_author,_description,_level);
        }
}