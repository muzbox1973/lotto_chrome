// 팝업 UI 제어 스크립트

document.addEventListener('DOMContentLoaded', async () => {
  const fetchButton = document.getElementById('fetchData');
  const roundCountSelect = document.getElementById('roundCount');
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  const resultsDiv = document.getElementById('results');

  const dataManager = new LottoDataManager();
  let analyzer = null;
  let currentData = null;

  // 탭 전환 기능
  setupTabs();

  // 데이터 수집 버튼 클릭
  fetchButton.addEventListener('click', async () => {
    const roundCount = parseInt(roundCountSelect.value);
    await fetchAndAnalyze(roundCount);
  });

  // 저장된 데이터가 있으면 자동으로 표시
  const cached = await dataManager.loadFromStorage();
  if (cached && cached.lottoData && cached.lottoData.length > 0) {
    if (dataManager.isCacheValid(cached.lastUpdated)) {
      currentData = cached.lottoData;
      analyzer = new LottoAnalyzer(currentData);
      displayResults();
    }
  }

  /**
   * 데이터 수집 및 분석 실행
   */
  async function fetchAndAnalyze(roundCount) {
    try {
      // UI 상태 변경
      showLoading();
      hideError();
      hideResults();
      fetchButton.disabled = true;

      console.log(`${roundCount}개 회차 데이터 수집 시작...`);

      // 데이터 수집
      const data = await dataManager.fetchMultipleRounds(roundCount);

      console.log('수집된 데이터:', data);

      if (!data || data.length === 0) {
        throw new Error(`데이터를 가져올 수 없습니다.\n\n가능한 원인:\n1. 인터넷 연결 문제\n2. 동행복권 사이트 접근 제한\n3. 아직 추첨되지 않은 회차\n\n브라우저 콘솔(F12)에서 자세한 오류를 확인하세요.`);
      }

      console.log(`${data.length}개 회차 데이터 수집 완료`);

      // 데이터 저장
      await dataManager.saveToStorage(data);

      // 분석
      currentData = data;
      analyzer = new LottoAnalyzer(data);

      // 결과 표시
      hideLoading();
      displayResults();
    } catch (error) {
      hideLoading();
      showError(error.message);
      console.error('오류 발생:', error);
    } finally {
      fetchButton.disabled = false;
    }
  }

  /**
   * 분석 결과 표시
   */
  function displayResults() {
    if (!analyzer) return;

    // 예상 번호 표시
    displayPredictedNumbers();

    // 빈도 분석 표시
    displayFrequencyAnalysis();

    // 핫/콜드 분석 표시
    displayHotColdAnalysis();

    // 패턴 분석 표시
    displayPatternAnalysis();

    // 통계 정보 표시
    displayStatistics();

    showResults();
  }

  /**
   * 예상 번호 표시
   */
  function displayPredictedNumbers() {
    const container = document.getElementById('predictedNumbers');
    const numbers = analyzer.generatePrediction();

    container.innerHTML = numbers.map(num => {
      const colorClass = getNumberColorClass(num);
      return `<div class="lotto-ball ${colorClass}">${num}</div>`;
    }).join('');
  }

  /**
   * 빈도 분석 표시
   */
  function displayFrequencyAnalysis() {
    const container = document.getElementById('frequencyChart');
    const frequency = analyzer.analyzeFrequency();

    const html = `
      <div class="bar-chart">
        ${frequency.top10.map(item => {
          const percentage = (item.count / currentData.length * 100).toFixed(0);
          const colorClass = getNumberColorClass(item.number);
          return `
            <div class="bar-item">
              <div class="lotto-ball ${colorClass}" style="width: 30px; height: 30px; font-size: 14px;">${item.number}</div>
              <div class="bar-container">
                <div class="bar-fill" style="width: ${percentage}%">${item.count}회</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * 핫/콜드 분석 표시
   */
  function displayHotColdAnalysis() {
    const hotContainer = document.getElementById('hotNumbers');
    const coldContainer = document.getElementById('coldNumbers');
    const hotCold = analyzer.analyzeHotCold(10);

    // 핫 넘버
    hotContainer.innerHTML = `
      <div class="number-list">
        ${hotCold.hot.map(item => {
          const colorClass = getNumberColorClass(item.number);
          return `
            <div class="number-item">
              <div class="number ${colorClass}">${item.number}</div>
              <span class="count">${item.count}회</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // 콜드 넘버
    coldContainer.innerHTML = `
      <div class="number-list">
        ${hotCold.cold.map(item => {
          const colorClass = getNumberColorClass(item.number);
          const roundsSince = hotCold.lastAppearance[item.number];
          const roundsText = roundsSince === -1 ? '없음' : `${roundsSince}회차 전`;
          return `
            <div class="number-item">
              <div class="number ${colorClass}">${item.number}</div>
              <span class="count">${roundsText}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * 패턴 분석 표시
   */
  function displayPatternAnalysis() {
    const container = document.getElementById('patternAnalysis');
    const pattern = analyzer.analyzePattern();

    const html = `
      <div class="pattern-item">
        <div class="pattern-label">홀짝 비율</div>
        <div class="pattern-value">홀수 ${pattern.oddEven.oddPercent}% / 짝수 ${pattern.oddEven.evenPercent}%</div>
      </div>
      <div class="pattern-item">
        <div class="pattern-label">구간별 분포</div>
        <div class="pattern-value">
          1-10: ${pattern.ranges['1-10']}개 |
          11-20: ${pattern.ranges['11-20']}개 |
          21-30: ${pattern.ranges['21-30']}개 |
          31-40: ${pattern.ranges['31-40']}개 |
          41-45: ${pattern.ranges['41-45']}개
        </div>
      </div>
      <div class="pattern-item">
        <div class="pattern-label">연속 번호 출현율</div>
        <div class="pattern-value">${pattern.consecutivePercent}% (${pattern.consecutive}회/${currentData.length}회)</div>
      </div>
      <div class="pattern-item">
        <div class="pattern-label">번호 합계 범위</div>
        <div class="pattern-value">${pattern.sumRange.min} ~ ${pattern.sumRange.max} (평균: ${pattern.sumRange.avg})</div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * 통계 정보 표시
   */
  function displayStatistics() {
    const container = document.getElementById('statisticsInfo');
    const stats = analyzer.getStatistics();

    const html = `
      <div class="stat-grid">
        <div class="stat-item">
          <div class="label">분석 회차</div>
          <div class="value">${stats.totalRounds}회</div>
        </div>
        <div class="stat-item">
          <div class="label">최다 출현 번호</div>
          <div class="value">${stats.mostFrequent.number}번 (${stats.mostFrequent.count}회)</div>
        </div>
        <div class="stat-item">
          <div class="label">최소 출현 번호</div>
          <div class="value">${stats.leastFrequent.number}번 (${stats.leastFrequent.count}회)</div>
        </div>
        <div class="stat-item">
          <div class="label">평균 홀짝 비율</div>
          <div class="value">${stats.avgOddEven}</div>
        </div>
        <div class="stat-item">
          <div class="label">평균 합계</div>
          <div class="value">${stats.avgSum}</div>
        </div>
        <div class="stat-item">
          <div class="label">연속번호 출현율</div>
          <div class="value">${stats.consecutiveRate}</div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * 번호에 따른 색상 클래스 반환
   */
  function getNumberColorClass(number) {
    if (number <= 10) return 'color-1';
    if (number <= 20) return 'color-2';
    if (number <= 30) return 'color-3';
    if (number <= 40) return 'color-4';
    return 'color-5';
  }

  /**
   * 탭 전환 설정
   */
  function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');

        // 모든 탭 비활성화
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // 선택한 탭 활성화
        button.classList.add('active');
        document.getElementById(tabName).classList.add('active');
      });
    });
  }

  /**
   * UI 상태 제어 함수들
   */
  function showLoading() {
    loadingDiv.classList.remove('hidden');
  }

  function hideLoading() {
    loadingDiv.classList.add('hidden');
  }

  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }

  function hideError() {
    errorDiv.classList.add('hidden');
  }

  function showResults() {
    resultsDiv.classList.remove('hidden');
  }

  function hideResults() {
    resultsDiv.classList.add('hidden');
  }
});
