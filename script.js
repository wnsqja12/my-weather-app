// script.js (수정된 fetch 함수)

// 🚨 API_KEY와 BASE_URL 변수를 제거합니다. (보안 목적)
// const API_KEY = "..."; 
// const BASE_URL = "https://api.openweathermap.org/data/2.5/"; 

// 새로운 BASE_URL: Vercel 서버리스 함수 주소
const PROXY_BASE_URL = '/api/weather';

// 자주 사용할 DOM 요소 (HTML에서 id로 지정한 요소들)
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const unitToggleButton = document.getElementById('unit-toggle-button');

const cityNameDisplay = document.getElementById('city-name');
const tempDisplay = document.getElementById('temp');
const descriptionDisplay = document.getElementById('description');
const iconDisplay = document.getElementById('weather-icon');
const humidityDisplay = document.getElementById('humidity');
const windSpeedDisplay = document.getElementById('wind-speed');

const forecastContainer = document.getElementById('forecast-cards-container');
const recentButtonsContainer = document.getElementById('recent-city-buttons');

let currentUnit = 'metric'; // 'metric' (섭씨) 또는 'imperial' (화씨)

/**
 * 현재 날씨 데이터를 API에서 가져와 화면에 렌더링하는 함수
 * @param {string} city - 검색할 도시 이름
 */
// script.js (fetchCurrentWeather 함수 수정)

async function fetchCurrentWeather(city) {
    const currentWeatherUrl = `${PROXY_BASE_URL}?city=${city}&units=${currentUnit}&endpoint=weather`;
    
    try {
        const response = await fetch(currentWeatherUrl);
        
        // 3. 오류 처리 (404 Not Found 등)
        if (!response.ok) {
            const errorData = await response.json();
            let errorMessage = ''; // 오류 메시지 변수 선언
            
            // ⭐ 삼항 연산자 대신 If/Else 구문 사용 (수정된 부분)
            if (errorData.message && errorData.message.includes('not found')) {
                errorMessage = `'${city}'에 대한 날씨 정보를 찾을 수 없습니다. 도시 이름을 확인해 주세요.`;
            } else {
                errorMessage = `데이터 로드 중 오류 발생: ${errorData.message || response.statusText}`;
            }
            
            // 오류 발생 시 throw를 통해 catch 블록으로 이동
            throw new Error(errorMessage);
        }
        
        // 4. JSON 파싱
        const data = await response.json();
        
        // 5. 화면 렌더링
        renderCurrentWeather(data);
        
        // 6. 최근 검색어 저장 (검색 성공 시에만)
        saveRecentSearch(data.name); 

    } catch (error) {
        // ... (catch 블록 코드는 이전과 동일하게 유지)
        cityNameDisplay.textContent = `🚨 ${error.message}`; 
        
        // 나머지 요소 초기화 (화면을 깨끗하게 만듦)
        tempDisplay.textContent = '--°C';
        descriptionDisplay.textContent = '정보 없음';
        iconDisplay.src = '';
        humidityDisplay.textContent = '--%';
        windSpeedDisplay.textContent = '--m/s';
        
        // 확장 기능 영역 초기화
        const extensionFeatureDisplay = document.getElementById('extension-feature');
        if (extensionFeatureDisplay) {
            extensionFeatureDisplay.innerHTML = '날씨 정보를 검색해주세요.';
        }
        
        // 예보와 최근 검색어 초기화 함수 호출
        clearForecastAndRecentSearches(); 
        
        console.error("API 호출 중 오류 발생:", error);
    }
}

/**
 * 가져온 데이터를 HTML 요소에 적용하는 함수 (Render)
 */
function renderCurrentWeather(data) {
    // 데이터 추출
    const temp = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const iconCode = data.weather[0].icon;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;

    // 단위 설정
    const unitSymbol = currentUnit === 'metric' ? '°C' : '°F';
    
    // DOM 업데이트
    cityNameDisplay.textContent = data.name;
    tempDisplay.textContent = `${temp}${unitSymbol}`;
    descriptionDisplay.textContent = description;
    
    // 아이콘 설정 (OpenWeatherMap 기본 아이콘 경로)
    iconDisplay.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    iconDisplay.alt = description;
    
    humidityDisplay.textContent = `${humidity}%`;
    windSpeedDisplay.textContent = `${windSpeed}m/s`; // (단위를 imperial로 바꾸면 mph로 표시하는 로직 추가 필요)

    // 💡 시각적 변화: 날씨/시간에 따른 배경/아이콘 변화 (3단계 CSS에 추가)
    // 예: document.body.className = iconCode.includes('n') ? 'night' : 'day';
    // 이 부분은 3단계 CSS에 .night 클래스를 추가하여 구현합니다.
}

// 1. 검색 버튼 클릭 이벤트
searchButton.addEventListener('click', () => {
    const city = cityInput.value.trim(); // 공백 제거
    if (city) {
        fetchCurrentWeather(city);
        // 예보도 함께 가져옵니다.
        fetchForecast(city); 
    }
});

// 2. 도시 검색: Enter 이벤트 처리 (추가 기능)
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchButton.click(); // 버튼 클릭 이벤트 호출
    }
});

// 3. 단위 전환 이벤트 (섭씨 ↔ 화씨)
unitToggleButton.addEventListener('click', () => {
    // 현재 단위를 반대로 전환
    currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
    
    // 버튼 텍스트 업데이트
    unitToggleButton.textContent = currentUnit === 'metric' ? '°C / °F' : '°F / °C';
    
    // 현재 표시된 도시 이름으로 날씨를 다시 로드
    const currentCity = cityNameDisplay.textContent;
    if (currentCity && currentCity !== '날씨 정보를 로딩 중...' && !currentCity.startsWith('오류:')) {
        fetchCurrentWeather(currentCity);
        fetchForecast(currentCity); 
    } else {
        alert('먼저 도시를 검색해 주세요.');
    }
});

// 페이지 로드 시 기본 도시 날씨 표시 (예: 서울)
document.addEventListener('DOMContentLoaded', () => {
    fetchCurrentWeather('Seoul');
    fetchForecast('Seoul');
    loadRecentSearches(); // LocalStorage에서 최근 검색어 로드
});

/**
 * 5일 예보 데이터를 가져와 렌더링하는 함수
 */
async function fetchForecast(city) {
    const forecastUrl = `${PROXY_BASE_URL}?city=${city}&units=${currentUnit}&endpoint=forecast`;
    try {
        const response = await fetch(forecastUrl);
        if (!response.ok) throw new Error('예보 데이터를 가져올 수 없습니다.');
        
        const data = await response.json();
        renderForecast(data);

    } catch (error) {
        console.error("예보 API 호출 중 오류 발생:", error);
    }
}

function renderForecast(data) {
    forecastContainer.innerHTML = ''; // 기존 카드 모두 지우기
    
    // 5일 예보 데이터는 data.list 배열에 있습니다.
    // 3시간 간격 데이터 40개 중에서, 매일의 정오(12시) 데이터만 추출하여 5개 카드를 만듭니다.
    const uniqueDays = [];
    const forecastList = data.list.filter(item => {
        const date = new Date(item.dt * 1000); // UNIX 타임을 밀리초로 변환
        const day = date.getDate();
        
        // 1. 매일 12시 데이터만 선택
        if (!uniqueDays.includes(day) && date.getHours() === 12) {
            uniqueDays.push(day);
            return true;
        }
        return false;
    }).slice(0, 5); // 혹시 6개가 잡힐 경우를 대비해 5개로 제한

    const unitSymbol = currentUnit === 'metric' ? '°C' : '°F';
    
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString('ko-KR', { weekday: 'short' }); // 요일 (예: 월, 화)
        const temp = Math.round(item.main.temp);
        const iconCode = item.weather[0].icon;
        
        const cardHTML = `
            <div class="forecast-card" data-city="${data.city.name}">
                <h4>${dayName}</h4>
                <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="아이콘">
                <p class="forecast-temp">${temp}${unitSymbol}</p>
                <p>${item.weather[0].description}</p>
            </div>
        `;
        forecastContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// script.js (기존 코드 아래에 추가)

// --- 4. 최근 검색어 (LocalStorage) 기능 구현 ---

const MAX_RECENT_CITIES = 5;

/**
 * 도시 이름을 LocalStorage에 저장하고 화면을 업데이트합니다.
 * @param {string} city - 검색에 성공한 도시 이름
 */
function saveRecentSearch(city) {
    // 1. LocalStorage에서 기존 목록 불러오기 (없으면 빈 배열 시작)
    let cities = JSON.parse(localStorage.getItem('recentCities') || '[]');
    
    // 2. 중복 제거 (이미 목록에 있다면 기존 위치에서 제거)
    cities = cities.filter(c => c.toLowerCase() !== city.toLowerCase());
    
    // 3. 맨 앞에 새 도시 추가
    cities.unshift(city);
    
    // 4. 최대 5개로 유지
    cities = cities.slice(0, MAX_RECENT_CITIES);
    
    // 5. LocalStorage에 저장
    localStorage.setItem('recentCities', JSON.stringify(cities));
    
    // 6. 화면 업데이트
    renderRecentSearches(cities);
}

/**
 * LocalStorage에서 도시 목록을 불러와 버튼을 화면에 표시합니다.
 */
function loadRecentSearches() {
    let cities = JSON.parse(localStorage.getItem('recentCities') || '[]');
    renderRecentSearches(cities);
}

/**
 * 최근 검색어 버튼을 동적으로 생성하여 화면에 표시하고 클릭 이벤트를 연결합니다.
 * @param {string[]} cities - 도시 이름 배열
 */
function renderRecentSearches(cities) {
    recentButtonsContainer.innerHTML = ''; // 기존 버튼 모두 제거
    
    cities.forEach(city => {
        const button = document.createElement('button');
        button.textContent = city;
        button.className = 'recent-city-button'; 
        
        // 버튼 클릭 시 해당 도시로 검색 실행
        button.addEventListener('click', () => {
            cityInput.value = city; // 입력창에 도시 이름 채우기
            searchButton.click();   // 검색 버튼 클릭 이벤트 발생 (검색 실행)
        });
        
        recentButtonsContainer.appendChild(button);
    });
}

// script.js (함수 정의 영역에 추가)

/**
 * 날씨 검색 실패 시 예보 영역을 초기화하는 함수
 */
function clearForecastAndRecentSearches() {
    forecastContainer.innerHTML = ''; // 예보 카드 영역 초기화
    
    // 이외에 공기질 등 다른 동적 영역이 있다면 여기에 초기화 코드를 추가합니다.
}