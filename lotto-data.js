// 로또 데이터 수집 및 관리 모듈

class LottoDataManager {
  constructor() {
    this.baseUrl = 'https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do';
  }

  /**
   * 최신 회차 번호 가져오기
   */
  async getLatestRound() {
    try {
      // 현재 날짜를 기준으로 대략적인 최신 회차 계산
      // 로또는 2002년 12월 7일에 1회차 시작
      const startDate = new Date('2002-12-07');
      const today = new Date();
      const diffTime = Math.abs(today - startDate);
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      return diffWeeks;
    } catch (error) {
      console.error('최신 회차 계산 오류:', error);
      return 1200; // 기본값
    }
  }

  /**
   * 특정 회차의 당첨 번호 가져오기
   */
  async fetchRoundData(round) {
    try {
      const url = `${this.baseUrl}?srchLtEpsd=${round}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      return this.parseHtml(html, round);
    } catch (error) {
      console.error(`${round}회차 데이터 가져오기 실패:`, error);
      return null;
    }
  }

  /**
   * HTML 파싱하여 당첨 번호 추출
   */
  parseHtml(html, round) {
    try {
      // HTML에서 당첨 번호 추출
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 번호가 표시되는 요소 찾기 (실제 웹사이트 구조에 맞게 수정 필요)
      const numbers = [];

      // 당첨번호 추출 (span.ball_645 클래스 사용)
      const ballElements = doc.querySelectorAll('.num.win .ball_645');

      if (ballElements.length >= 6) {
        for (let i = 0; i < 6; i++) {
          const num = parseInt(ballElements[i].textContent.trim());
          if (!isNaN(num)) {
            numbers.push(num);
          }
        }
      }

      // 보너스 번호 추출
      let bonusNumber = null;
      const bonusElement = doc.querySelector('.num.bonus .ball_645');
      if (bonusElement) {
        bonusNumber = parseInt(bonusElement.textContent.trim());
      }

      // 추첨일 추출
      const dateElement = doc.querySelector('.desc');
      let drawDate = '';
      if (dateElement) {
        const dateMatch = dateElement.textContent.match(/\d{4}년 \d{2}월 \d{2}일/);
        if (dateMatch) {
          drawDate = dateMatch[0];
        }
      }

      if (numbers.length === 6) {
        return {
          round: round,
          numbers: numbers.sort((a, b) => a - b),
          bonusNumber: bonusNumber,
          drawDate: drawDate
        };
      }

      return null;
    } catch (error) {
      console.error('HTML 파싱 오류:', error);
      return null;
    }
  }

  /**
   * 여러 회차의 데이터 가져오기
   */
  async fetchMultipleRounds(count) {
    const latestRound = await this.getLatestRound();
    const promises = [];
    const results = [];

    for (let i = 0; i < count; i++) {
      const round = latestRound - i;
      if (round > 0) {
        promises.push(
          this.fetchRoundData(round).then(data => {
            if (data) {
              results.push(data);
            }
          })
        );
      }
    }

    await Promise.all(promises);

    // 회차순으로 정렬 (최신순)
    results.sort((a, b) => b.round - a.round);

    return results;
  }

  /**
   * 로컬 스토리지에 데이터 저장
   */
  async saveToStorage(data) {
    try {
      await chrome.storage.local.set({
        lottoData: data,
        lastUpdated: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('저장 오류:', error);
      return false;
    }
  }

  /**
   * 로컬 스토리지에서 데이터 불러오기
   */
  async loadFromStorage() {
    try {
      const result = await chrome.storage.local.get(['lottoData', 'lastUpdated']);
      return result;
    } catch (error) {
      console.error('불러오기 오류:', error);
      return null;
    }
  }

  /**
   * 캐시된 데이터가 유효한지 확인 (24시간)
   */
  isCacheValid(lastUpdated) {
    if (!lastUpdated) return false;

    const now = new Date();
    const updated = new Date(lastUpdated);
    const hoursDiff = (now - updated) / (1000 * 60 * 60);

    return hoursDiff < 24;
  }
}

// 전역에서 사용 가능하도록 export
window.LottoDataManager = LottoDataManager;
