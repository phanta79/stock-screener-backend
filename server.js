require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const app = express();
const PORT = 5000; 

app.use(cors());
app.use(express.json());

let db; // 데이터베이스를 담을 변수

// 1. 데이터베이스 초기화 및 샘플 데이터 삽입 함수
async function initDB() {
  // 'database.sqlite'라는 파일 형태로 DB를 생성하고 엽니다.
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // 주식 데이터를 담을 'stocks' 테이블(표) 만들기
  await db.exec(`
    CREATE TABLE IF NOT EXISTS stocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      opProfit_25 REAL,
      netIncome_25 REAL,
      totalAssets REAL,
      currentLiabilities REAL
    )
  `);

  // 테스트를 위해 기존 데이터를 싹 지우고 새롭게 샘플 데이터를 넣습니다.
  await db.exec('DELETE FROM stocks');
  
  // DART에서 뽑아냈던 진짜 삼성전자 데이터 + 검색 테스트용 가짜 데이터 삽입
  const insertQuery = `INSERT INTO stocks (name, opProfit_25, netIncome_25, totalAssets, currentLiabilities) VALUES (?, ?, ?, ?, ?)`;
  await db.run(insertQuery, ['삼성전자', 41234.8, 38124.1, 302341.2, 73412.5]);
  await db.run(insertQuery, ['갑자상회', 24.4, 80.5, 500.0, 150.0]);
  await db.run(insertQuery, ['을축전자', 205.4, 650.2, 3500.5, 1200.0]);
  await db.run(insertQuery, ['병인반도체', 25.8, 95.0, 800.0, 300.0]);

  console.log("✅ 데이터베이스 세팅 및 샘플 데이터 삽입 완료!");
}

// 서버가 켜질 때 DB 초기화 함수 실행
initDB();

// 2. 프론트엔드가 데이터를 요청할 때 DB에서 꺼내주는 API
app.get('/api/stocks', async (req, res) => {
  try {
    // stocks 테이블에 있는 모든 데이터를 가져옵니다.
    const allStocks = await db.all('SELECT * FROM stocks');
    res.json(allStocks); // 프론트엔드로 전송
  } catch (error) {
    res.status(500).json({ error: "DB에서 데이터를 가져오는 데 실패했습니다." });
  }
});

app.listen(PORT, () => {
  console.log(`백엔드 서버 대기 중: http://localhost:${PORT}`);
});