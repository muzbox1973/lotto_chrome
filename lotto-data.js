// 로또 데이터 수집 및 관리 모듈

class LottoDataManager {
  constructor() {
    // JSON API 사용
    this.apiUrl = 'https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=';
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
   * 특정 회차의 당첨 번호 가져오기 (JSON API 사용)
   */
  async fetchRoundData(round) {
    try {
      const url = `${this.apiUrl}${round}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // returnValue가 'success'인지 확인
      if (data.returnValue !== 'success') {
        console.log(`${round}회차: 아직 추첨되지 않았습니다.`);
        return null;
      }

      return this.parseJsonData(data);
    } catch (error) {
      console.error(`${round}회차 데이터 가져오기 실패:`, error);
      return null;
    }
  }

  /**
   * JSON 데이터 파싱
   */
  parseJsonData(data) {
    try {
      const numbers = [
        data.drwtNo1,
        data.drwtNo2,
        data.drwtNo3,
        data.drwtNo4,
        data.drwtNo5,
        data.drwtNo6
      ];

      const bonusNumber = data.bnusNo;
      const round = data.drwNo;
      const drawDate = data.drwNoDate;

      if (numbers.every(num => !isNaN(num) && num > 0)) {
        return {
          round: round,
          numbers: numbers.sort((a, b) => a - b),
          bonusNumber: bonusNumber,
          drawDate: drawDate
        };
      }

      return null;
    } catch (error) {
      console.error('JSON 파싱 오류:', error);
      return null;
    }
  }

  /**
   * 최신 유효 회차 찾기 (실제 데이터가 있는 회차)
   */
  async findLatestValidRound() {
    let estimatedRound = await this.getLatestRound();

    // 추정 회차부터 역으로 최대 10회차까지 확인
    for (let i = 0; i < 10; i++) {
      const round = estimatedRound - i;
      const data = await this.fetchRoundData(round);
      if (data) {
        console.log(`최신 회차 발견: ${round}회`);
        return round;
      }
    }

    // 찾지 못한 경우 보수적으로 더 이전 회차 반환
    return estimatedRound - 10;
  }

  /**
   * 여러 회차의 데이터 가져오기
   */
  async fetchMultipleRounds(count) {
    // 최신 유효 회차 찾기
    const latestRound = await this.findLatestValidRound();
    console.log(`${latestRound}회차부터 ${count}개 회차 데이터 수집 시작`);

    const results = [];

    // 순차적으로 데이터 가져오기 (병렬보다 안정적)
    for (let i = 0; i < count; i++) {
      const round = latestRound - i;
      if (round > 0) {
        const data = await this.fetchRoundData(round);
        if (data) {
          results.push(data);
          console.log(`${round}회차 데이터 수집 완료`);
        } else {
          console.log(`${round}회차 데이터 없음`);
        }
      }
    }

    // 회차순으로 정렬 (최신순)
    results.sort((a, b) => b.round - a.round);

    console.log(`총 ${results.length}개 회차 데이터 수집 완료`);
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
