// api/weather.js
// 이 파일은 브라우저가 아닌 Vercel 서버에서 실행됩니다.

// Vercel 환경 변수에서 API 키를 가져옵니다.
const API_KEY = process.env.WEATHER_API_KEY; 

module.exports = async (req, res) => {
    // 1. 프론트엔드에서 전달받은 쿼리 파라미터를 추출
    const { city, units, endpoint } = req.query; 

    if (!city || !endpoint) {
        res.status(400).json({ error: 'City and endpoint are required' });
        return;
    }

// ⭐️ 수정 핵심: 도시 이름을 URL 인코딩 처리
    const encodedCity = encodeURIComponent(city); 

    // OWM URL 구성: 인코딩된 도시 이름을 사용
    const OWM_URL = `https://api.openweathermap.org/data/2.5/${endpoint}?q=${encodedCity},KR&appid=${API_KEY}&units=${units || 'metric'}&lang=kr`;

    try {
        // 3. 서버가 OWM API를 호출
        const response = await fetch(OWM_URL);
        const data = await response.json();
        
        // 4. OWM 응답 상태 코드를 클라이언트에 그대로 전달
        if (!response.ok) {
            res.status(response.status).json(data);
            return;
        }

        // 5. 서버가 받은 데이터를 클라이언트(브라우저)로 전달
        res.status(200).json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: 'Failed to fetch data from weather provider' });
    }
};