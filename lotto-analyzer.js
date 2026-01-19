// 로또 번호 분석 모듈

class LottoAnalyzer {
  constructor(data) {
    this.data = data; // 여러 회차의 로또 데이터 배열
    this.allNumbers = this.extractAllNumbers();
  }

  /**
   * 모든 회차에서 나온 번호들을 추출
   */
  extractAllNumbers() {
    const numbers = [];
    this.data.forEach(round => {
      numbers.push(...round.numbers);
    });
    return numbers;
  }

  /**
   * 빈도 분석: 각 번호가 나온 횟수 계산
   */
  analyzeFrequency() {
    const frequency = {};

    // 1-45까지 초기화
    for (let i = 1; i <= 45; i++) {
      frequency[i] = 0;
    }

    // 빈도 계산
    this.allNumbers.forEach(num => {
      frequency[num]++;
    });

    // 빈도순으로 정렬
    const sorted = Object.entries(frequency)
      .map(([num, count]) => ({ number: parseInt(num), count }))
      .sort((a, b) => b.count - a.count);

    return {
      frequency,
      top10: sorted.slice(0, 10),
      bottom10: sorted.slice(-10).reverse()
    };
  }

  /**
   * 핫/콜드 넘버 분석
   */
  analyzeHotCold(recentRounds = 10) {
    const recentData = this.data.slice(0, recentRounds);
    const recentNumbers = [];

    recentData.forEach(round => {
      recentNumbers.push(...round.numbers);
    });

    // 최근 빈도
    const recentFrequency = {};
    for (let i = 1; i <= 45; i++) {
      recentFrequency[i] = 0;
    }

    recentNumbers.forEach(num => {
      recentFrequency[num]++;
    });

    // 핫 넘버 (최근 자주 나온 번호)
    const hot = Object.entries(recentFrequency)
      .map(([num, count]) => ({ number: parseInt(num), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 콜드 넘버 (최근 안 나온 번호)
    const cold = Object.entries(recentFrequency)
      .map(([num, count]) => ({ number: parseInt(num), count }))
      .sort((a, b) => a.count - b.count)
      .slice(0, 10);

    // 마지막 출현 회차 계산
    const lastAppearance = {};
    for (let i = 1; i <= 45; i++) {
      lastAppearance[i] = -1;
    }

    this.data.forEach((round, index) => {
      round.numbers.forEach(num => {
        if (lastAppearance[num] === -1) {
          lastAppearance[num] = index;
        }
      });
    });

    return { hot, cold, lastAppearance };
  }

  /**
   * 패턴 분석
   */
  analyzePattern() {
    const patterns = {
      oddEven: { odd: 0, even: 0 },
      ranges: {
        '1-10': 0,
        '11-20': 0,
        '21-30': 0,
        '31-40': 0,
        '41-45': 0
      },
      consecutive: 0,
      sumRange: { min: Infinity, max: -Infinity, avg: 0 }
    };

    let totalSum = 0;

    this.data.forEach(round => {
      const numbers = round.numbers;

      // 홀짝 비율
      numbers.forEach(num => {
        if (num % 2 === 0) {
          patterns.oddEven.even++;
        } else {
          patterns.oddEven.odd++;
        }
      });

      // 구간별 분포
      numbers.forEach(num => {
        if (num <= 10) patterns.ranges['1-10']++;
        else if (num <= 20) patterns.ranges['11-20']++;
        else if (num <= 30) patterns.ranges['21-30']++;
        else if (num <= 40) patterns.ranges['31-40']++;
        else patterns.ranges['41-45']++;
      });

      // 연속 번호 체크
      for (let i = 0; i < numbers.length - 1; i++) {
        if (numbers[i + 1] - numbers[i] === 1) {
          patterns.consecutive++;
          break;
        }
      }

      // 합계 범위
      const sum = numbers.reduce((a, b) => a + b, 0);
      totalSum += sum;
      patterns.sumRange.min = Math.min(patterns.sumRange.min, sum);
      patterns.sumRange.max = Math.max(patterns.sumRange.max, sum);
    });

    patterns.sumRange.avg = Math.round(totalSum / this.data.length);

    // 비율 계산
    const totalRounds = this.data.length;
    patterns.oddEven.oddPercent = ((patterns.oddEven.odd / this.allNumbers.length) * 100).toFixed(1);
    patterns.oddEven.evenPercent = ((patterns.oddEven.even / this.allNumbers.length) * 100).toFixed(1);
    patterns.consecutivePercent = ((patterns.consecutive / totalRounds) * 100).toFixed(1);

    return patterns;
  }

  /**
   * 종합 통계 정보
   */
  getStatistics() {
    const frequency = this.analyzeFrequency();
    const pattern = this.analyzePattern();

    return {
      totalRounds: this.data.length,
      mostFrequent: frequency.top10[0],
      leastFrequent: frequency.bottom10[0],
      avgOddEven: `홀수 ${pattern.oddEven.oddPercent}% / 짝수 ${pattern.oddEven.evenPercent}%`,
      avgSum: pattern.sumRange.avg,
      sumRange: `${pattern.sumRange.min} ~ ${pattern.sumRange.max}`,
      consecutiveRate: `${pattern.consecutivePercent}%`
    };
  }

  /**
   * 예상 번호 생성 (여러 기법 조합)
   */
  generatePrediction() {
    const frequency = this.analyzeFrequency();
    const hotCold = this.analyzeHotCold(10);
    const pattern = this.analyzePattern();

    // 점수 기반 선택
    const scores = {};
    for (let i = 1; i <= 45; i++) {
      scores[i] = 0;
    }

    // 1. 빈도 점수 (상위 20개에 가중치)
    frequency.top10.forEach((item, index) => {
      scores[item.number] += (10 - index) * 2;
    });

    // 2. 핫 넘버 점수
    hotCold.hot.forEach((item, index) => {
      scores[item.number] += (10 - index) * 1.5;
    });

    // 3. 콜드 넘버 약간의 가중치 (역발상)
    hotCold.cold.slice(0, 5).forEach((item, index) => {
      scores[item.number] += (5 - index) * 0.5;
    });

    // 4. 구간별 균형 맞추기
    const rangeWeights = {
      '1-10': 1.2,
      '11-20': 1.2,
      '21-30': 1.2,
      '31-40': 1.2,
      '41-45': 1.0
    };

    Object.entries(scores).forEach(([num, score]) => {
      const n = parseInt(num);
      if (n <= 10) scores[n] *= rangeWeights['1-10'];
      else if (n <= 20) scores[n] *= rangeWeights['11-20'];
      else if (n <= 30) scores[n] *= rangeWeights['21-30'];
      else if (n <= 40) scores[n] *= rangeWeights['31-40'];
      else scores[n] *= rangeWeights['41-45'];
    });

    // 5. 홀짝 균형 고려
    const oddEvenBalance = pattern.oddEven.odd / pattern.oddEven.even;
    Object.entries(scores).forEach(([num, score]) => {
      const n = parseInt(num);
      if (n % 2 === 0 && oddEvenBalance > 1.2) {
        scores[n] *= 1.1; // 짝수 우대
      } else if (n % 2 === 1 && oddEvenBalance < 0.8) {
        scores[n] *= 1.1; // 홀수 우대
      }
    });

    // 점수순 정렬
    const sorted = Object.entries(scores)
      .map(([num, score]) => ({ number: parseInt(num), score }))
      .sort((a, b) => b.score - a.score);

    // 상위에서 선택하되 약간의 랜덤성 추가
    const candidates = sorted.slice(0, 15);
    const selected = [];

    // 상위 6개를 기본으로 선택하되, 일부는 랜덤하게
    for (let i = 0; i < 6; i++) {
      if (i < 3) {
        // 상위 3개는 확정
        selected.push(candidates[i].number);
      } else {
        // 나머지는 상위 15개 중에서 랜덤
        const randomIndex = Math.floor(Math.random() * candidates.length);
        const candidate = candidates[randomIndex].number;
        if (!selected.includes(candidate)) {
          selected.push(candidate);
        } else {
          i--; // 중복이면 다시
        }
      }
    }

    return selected.sort((a, b) => a - b);
  }

  /**
   * 여러 세트의 예상 번호 생성
   */
  generateMultiplePredictions(count = 3) {
    const predictions = [];
    for (let i = 0; i < count; i++) {
      predictions.push(this.generatePrediction());
    }
    return predictions;
  }
}

// 전역에서 사용 가능하도록 export
window.LottoAnalyzer = LottoAnalyzer;
