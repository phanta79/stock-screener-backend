// updateData.js

// 👇 1. 발급받으신 DART API 키를 작은따옴표 안에 넣으세요.
const API_KEY = '3be9c00724c3f12c9ae89a80bc392cafef9b0404'; 

// 👇 2. 렌더(Render) 백엔드 주소로 변경하세요. (끝에 /api/stocks 필수!)
const BACKEND_URL = 'https://stock-backend-2dck.onrender.com/api/stocks'; 

const companies = [
  { name: '삼성전자', corp_code: '00126380' },
  { name: 'SK하이닉스', corp_code: '00164779' },
  { name: '에코프로비엠', corp_code: '01170962' },
  { name: '레인보우로보틱스', corp_code: '01308723' }
];

async function fetchDartData() {
  const results = [];
  const year = '2025'; 
  const reportCode = '11011'; 

  console.log("🚚 DART에서 재무 데이터를 가져오는 중...");

  for (const company of companies) {
    try {
      // 1차 시도: 기본값인 '연결재무제표(CFS)' 요청
      let url = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${API_KEY}&corp_code=${company.corp_code}&bsns_year=${year}&reprt_code=${reportCode}`;
      let response = await fetch(url);
      let data = await response.json();

      // 💡 핵심 추가: 만약 연결재무제표가 없어서 013 에러가 났다면?
      if (data.status === '013') {
        console.log(`⚠️ ${company.name} 연결재무제표 없음. 개별재무제표(OFS)로 재검색합니다...`);
        // 주소 맨 끝에 '&fs_div=OFS'를 붙여서 개별재무제표로 다시 요청!
        url = `${url}&fs_div=OFS`;
        response = await fetch(url);
        data = await response.json();
      }

      // 정상적으로 데이터를 찾았을 경우 (상태코드 000)
      if (data.status === '000') {
        const list = data.list;

        const getVal = (accountName) => {
          const item = list.find(x => x.account_nm === accountName);
          return item ? Number(item.thstrm_amount.replace(/,/g, '')) : 0;
        };

        const revenue = getVal('매출액');
        const opProfit = getVal('영업이익');
        const currentAssets = getVal('유동자산');
        const currentLiabilities = getVal('유동부채');
        const totalLiabilities = getVal('부채총계');
        const totalEquity = getVal('자본총계');
        const capital = getVal('자본금');

        const currentRatio = currentLiabilities ? ((currentAssets / currentLiabilities) * 100).toFixed(2) : 0;
        const debtRatio = totalEquity ? ((totalLiabilities / totalEquity) * 100).toFixed(2) : 0;
        const reserveRatio = capital ? (((totalEquity - capital) / capital) * 100).toFixed(2) : 0;

        results.push({
          name: company.name,
          매출액: revenue,
          영업이익: opProfit,
          유동비율: Number(currentRatio),
          부채비율: Number(debtRatio),
          유보율: Number(reserveRatio)
        });
        
        console.log(`✅ ${company.name} 데이터 파싱 및 계산 완료!`);
      } else {
        console.log(`❌ ${company.name} 최종 데이터 없음 (상태코드: ${data.status})`);
      }
    } catch (error) {
      console.error(`❌ ${company.name} 가져오기 실패:`, error.message);
    }
  }

  // 3. 완성된 데이터를 내 렌더 백엔드로 쏘기 (POST)
  if (results.length > 0) {
    console.log("\n🚀 계산된 데이터를 백엔드 서버로 전송합니다...");
    try {
      const postRes = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results)
      });
      
      if(postRes.ok) {
         console.log("🎉 백엔드 데이터 채워넣기 완벽하게 성공! 이제 Vercel 화면에서 검색해보세요.");
      } else {
         console.log("❌ 백엔드 전송 실패 (상태코드):", postRes.status);
      }
    } catch(e) {
      console.log("❌ 백엔드 전송 에러:", e.message);
    }
  }
}

fetchDartData();