const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 5000; 

app.use(cors());
app.use(express.json()); 

// =========================================================
// 🔏 몽고DB 연결 세팅
// =========================================================
// 👇 여기에 아까 복사한 주소를 넣어주세요. (주소 안의 <password> 부분은 본인의 진짜 비밀번호로 교체하셔야 합니다!)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://phanta79:abcd1234@cluster0.de8v8lf.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('🍃 클라우드 데이터베이스(MongoDB) 연결 성공!'))
  .catch(err => console.error('❌ MongoDB 연결 실패:', err));

// =========================================================
// 🔄 유연한 동적 스키마 정의 (핵심!)
// { strict: false } 설정을 주면, 향후 매출액 외에 어떤 새로운 재무 항목을 
// 추가해서 밀어 넣어도 DB가 거부하지 않고 유동적으로 모두 저장합니다.
// =========================================================
const stockSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true } // 종목명은 필수값으로 고정
}, { strict: false, versionKey: false });

const Stock = mongoose.model('Stock', stockSchema);

// =========================================================
// 1. 프론트엔드(React)로 데이터 전송 (GET)
// =========================================================
app.get('/api/stocks', async (req, res) => {
  try {
    // DB에 저장된 모든 종목 데이터를 긁어와서 프론트엔드로 쏩니다.
    const stocks = await Stock.find();
    res.json(stocks);
  } catch (error) {
    console.error("데이터 조회 에러:", error);
    res.status(500).json({ error: "DB에서 데이터를 읽어오는 중 문제가 발생했습니다." });
  }
});

// =========================================================
// 2. 수집기(스크립트)에서 보낸 데이터 대량 업데이트 (POST)
// =========================================================
app.post('/api/stocks', async (req, res) => {
  try {
    const newData = req.body; // 수집기가 긁어온 데이터 배열

    // 분기별 데이터 갱신을 위해 기존 데이터를 싹 지우고 최신 데이터로 통째로 덮어씁니다.
    await Stock.deleteMany({});
    await Stock.insertMany(newData);
    
    console.log("✅ 최신 주식 데이터가 몽고DB에 완벽하게 업데이트되었습니다!");
    res.json({ message: "데이터 업데이트 완료" });
  } catch (error) {
    console.error("데이터 저장 에러:", error);
    res.status(500).json({ error: "데이터를 DB에 저장하는 중 문제가 발생했습니다." });
  }
});

// =========================================================
// 서버 작동 시작
// =========================================================
app.listen(port, () => {
  console.log(`🚀 백엔드 서버가 포트 ${port}에서 활기차게 작동 중입니다!`);
});