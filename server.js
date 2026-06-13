const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
// 렌더(Render) 환경에서는 자체 포트를 사용하므로 process.env.PORT가 필수입니다.
const port = process.env.PORT || 5000; 

// 미들웨어 설정 (프론트엔드 접속 허용 및 JSON 데이터 파싱)
app.use(cors());
app.use(express.json()); 

// 데이터를 저장할 data.json 파일의 안전한 절대 경로 설정
const dataPath = path.join(__dirname, 'data.json');

// =========================================================
// 1. 프론트엔드(React)로 주식 데이터를 보내주는 부분 (GET 요청)
// =========================================================
app.get('/api/stocks', (req, res) => {
  try {
    // 만약 폴더에 data.json 파일이 없다면 에러가 나지 않도록 빈 배열로 새로 만듭니다.
    if (!fs.existsSync(dataPath)) {
      fs.writeFileSync(dataPath, '[]', 'utf-8');
    }

    // data.json 파일을 읽어서 프론트엔드로 전송
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const stocks = JSON.parse(rawData);
    res.json(stocks);
  } catch (error) {
    console.error("데이터 읽기 에러:", error);
    res.status(500).json({ error: "서버에서 데이터를 읽어오는 중 문제가 발생했습니다." });
  }
});

// =========================================================
// 2. DART API 등 새로운 데이터를 받아와서 저장하는 부분 (POST 요청)
// =========================================================
app.post('/api/stocks', (req, res) => {
  try {
    const newData = req.body; // 스크립트나 프론트엔드에서 넘겨받은 4개 기업의 새 데이터

    // 데이터를 텍스트(JSON) 형식으로 예쁘게 변환해서 파일에 덮어쓰기
    fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2), 'utf-8');
    
    console.log("✅ 데이터가 data.json에 성공적으로 저장되었습니다!");
    res.json({ message: "데이터 업데이트 완료" });
  } catch (error) {
    console.error("데이터 저장 에러:", error);
    res.status(500).json({ error: "데이터를 저장하는 중 문제가 발생했습니다." });
  }
});

// =========================================================
// 서버 실행
// =========================================================
app.listen(port, () => {
  console.log(`🚀 백엔드 서버가 포트 ${port}에서 정상적으로 작동 중입니다!`);
});