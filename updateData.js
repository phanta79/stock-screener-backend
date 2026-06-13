// updateData.js
// 👇 1. 발급받으신 DART API 키
const API_KEY = '3be9c00724c3f12c9ae89a80bc392cafef9b0404'; 
// 👇 2. 렌더(Render) 진짜 백엔드 주소 (끝에 /api/stocks 필수!)
const BACKEND_URL = 'https://stock-backend-2dck.onrender.com/api/stocks'; 

// 💡 [핵심] 여기에 원하는 재무 항목을 마음대로 적어보세요! (DART 주요계정 기준)
// 예: '당기순이익', '자산총계', '자본금' 등 아무거나 추가해도 프론트엔드에 자동으로 뜹니다.
const TARGET_VARS = ['매출액', '영업이익', '당기순이익', '자산총계', '부채총계']; 

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

  console.log("🚚 DART에서 선택한 변수들의 재무 데이터를 가져오는 중...");

  for (const company of companies) {
    try {
      let url = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${API_KEY}&corp_code=${company.corp_code}&bsns_year=${year}&reprt_code=${reportCode}`;
      let response = await fetch(url);
      let data = await response.json();

      if (data.status === '013') {
        url = `${url}&fs_div=OFS`;
        response = await fetch(url);
        data = await response.json();
      }

      if (data.status === '000') {
        const list = data.list;
        const getVal = (accountName) => {
          const item = list.find(x => x.account_nm === accountName);
          return item ? Number(item.thstrm_amount.replace(/,/g, '')) : 0;
        };

        // 💡 배열에 적은 변수 이름 그대로 데이터를 쏙쏙 뽑아냅니다.
        const companyData = { name: company.name };
        TARGET_VARS.forEach(v => {
          companyData[v] = getVal(v);
        });

        results.push(companyData);
        console.log(`✅ ${company.name} 수집 완료!`);
      } else {
        console.log(`❌ ${company.name} 데이터 없음`);
      }
    } catch (error) {
      console.error(`❌ ${company.name} 에러:`, error.message);
    }
  }

  if (results.length > 0) {
    console.log("\n🚀 몽고DB(Render 백엔드)로 데이터를 전송합니다...");
    try {
      const postRes = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results)
      });
      
      if(postRes.ok) {
         console.log("🎉 몽고DB 저장 완벽 성공! 이제 프론트엔드를 업데이트하세요.");
      }
    } catch(e) {
      console.log("❌ 백엔드 전송 에러:", e.message);
    }
  }
}

fetchDartData();