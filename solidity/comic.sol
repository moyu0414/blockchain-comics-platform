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
    }
    // 定義漫畫結構體
    struct Comic {
        address payable owner; // 漫畫所有者的錢包地址
        bool exists; // 漫畫是否存在
    }
    // 儲存已上傳的漫畫
    mapping(bytes32 => Comic) public comics;
    // 儲存每本漫畫的章節信息
    mapping(bytes32 => mapping(bytes32 => Chapter)) public comicChapterdata;
    // 儲存每本漫畫的章節信息
    mapping(bytes32 => bytes32[]) public comicChapters;
    // 記錄每個地址購買的章節
    mapping(address => mapping(bytes32 => bool)) public purchasedChapters;
    //記錄每本漫畫的章節的hash，保持唯一性
    mapping(bytes32 => mapping(bytes32 => bool)) private comicChapterhashs;
    // 管理者列表
    mapping(address => bool) public admins;
    //首頁 all漫畫hash
    bytes32[] public allComicHashes;

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

    // 定義漫畫上傳事件
    event ComicUploaded(
        bytes32 indexed comicHash,
        address indexed owner,
        string newtitle
    );
    // 定義漫畫編輯事件
    event ComicEdited(
        bytes32 indexed comicHash,
        address indexed owner,
        string title
    );
    //定義章節上傳事件
    event ChapterUploaded(
        bytes32 indexed comicHash,
        bytes32 indexed chapterHash,
        address indexed owner,
        string title,
        uint256 price
    );
    //定義章節編輯事件
    event ChapterEdited(
        bytes32 indexed comicHash,
        bytes32 indexed chapterHash,
        address indexed owner,
        string newtitle,
        uint256 newprice
    );
    //定義購買事件
    event ChapterPurchased(
        bytes32 indexed comicHash,
        bytes32 indexed chapterHash,
        address indexed buyer,
        uint256 price
    );

    // 上傳漫畫功能
    function uploadComic(bytes32 _comicHash,string memory _title) external {
        require(comics[_comicHash].owner == address(0),"Comic already uploaded"); // 確認漫畫未重複上傳
        
        //新增漫畫
        Comic memory newComic = Comic({owner:  payable(msg.sender),exists: true});
        comics[_comicHash]= newComic; 
        allComicHashes.push(_comicHash); 

        // 觸發漫畫上傳事件
        emit ComicUploaded(_comicHash,msg.sender,_title);
    }
    //修改漫畫狀態
    function toggleComicExistence(bytes32 _comicHash) external onlyAdmin {
        require(comics[_comicHash].owner != address(0), "Comic does not exist");
        comics[_comicHash].exists = !comics[_comicHash].exists;
    }

    // 添加章節功能
    function addChapter(bytes32 _comicHash,bytes32 _chapterHash,string memory _title,uint256 _price) external {
        require(comics[_comicHash].exists, "Comic does not exist");//確認漫畫是否存在
        require(comics[_comicHash].owner == msg.sender, "You are not owner"); // 確認是否為擁有者
        require(!comicChapterhashs[_comicHash][_chapterHash],"Chapter already exists"); //確認章節唯一性

        // 添加章節到漫畫的章節信息中
        Chapter memory newChapter = Chapter({price: _price});

        comicChapterdata[_comicHash][_chapterHash] = newChapter; //新增章節
        comicChapters[_comicHash].push(_chapterHash); //新增章節
        comicChapterhashs[_comicHash][_chapterHash] = true; // 將章節hash標記為已存在

        emit ChapterUploaded(_comicHash,_chapterHash,msg.sender, _title ,_price);
    }

    // 編輯漫畫功能
    function editComic(bytes32 _comicHash,string memory _title) external {
        require(comics[_comicHash].exists, "Comic does not exist");//確認漫畫是否存在
        require(comics[_comicHash].owner == msg.sender, "You are not owner"); // 確認是否為擁有者
        
        emit ComicEdited(_comicHash, msg.sender, _title);
    }
    // 編輯章節功能
    function editChapter(bytes32 _comicHash,bytes32 _chapterHash,string memory _title,uint256 _price) external {
        require(comics[_comicHash].exists, "Comic does not exist");//確認漫畫是否存在
        require(comics[_comicHash].owner == msg.sender, "You are not owner"); // 確認是否為擁有者

        comicChapterdata[_comicHash][_chapterHash].price = _price; //修改價格
        
        emit ChapterEdited(_comicHash, _chapterHash, msg.sender, _title, _price);
    }
    // 購買章節
    function purchaseChapter(bytes32 _comicHash, bytes32 _chapterHash,uint256 gasfee)external payable{
        require(comics[_comicHash].exists, "Comic does not exist");// 檢查漫畫是否存在
        require(comicChapterhashs[_comicHash][_chapterHash],"Chapter does not exists");/// 檢查章節是否存在
        require(!purchasedChapters[msg.sender][_chapterHash],"Chapter already purchased");// 檢查是否已購買過此章節

        // 檢查支付的價格是否正確
        uint256 price = comicChapterdata[_comicHash][_chapterHash].price;
        require(msg.value >= price, "Insufficient payment");

        // 扣除手續費
        uint256 fee = price / 10; // 10%的手續費
        uint256 netPrice = price - fee;

        // 將章節價格支付給漫畫擁有者
        (bool sentToOwner, ) = comics[_comicHash].owner.call{value: netPrice}("");
        require(sentToOwner, "Failed to send Ether to the comic owner");

        // 退還燃料費
        require(fee >= gasfee, "Gas fee exceeds the fee");
        (bool refundGas, ) = msg.sender.call{value: gasfee}("");
        require(refundGas, "Failed to refund gas fee");
        
        // 儲存購買記錄
        purchasedChapters[msg.sender][_chapterHash] = true;

        // 觸發購買事件
        emit ChapterPurchased(_comicHash, _chapterHash, msg.sender, price);
    }

    // 管理者提取手續費
    function withdrawFees() external onlyAdmin {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(msg.sender).transfer(balance);
    }
    function getContractBalance() external view onlyAdmin returns (uint256)  {
        return address(this).balance;
    }
}