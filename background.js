// 백그라운드 서비스 워커

chrome.runtime.onInstalled.addListener(() => {
  console.log('로또 예측 분석기 확장프로그램이 설치되었습니다.');
});

// 확장프로그램 아이콘 클릭 시 (현재는 popup으로 처리됨)
chrome.action.onClicked.addListener((tab) => {
  console.log('확장프로그램 아이콘 클릭됨');
});

// 메시지 리스너 (필요시 popup과 통신)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchLottoData') {
    // 여기서 추가적인 백그라운드 작업 가능
    console.log('로또 데이터 요청 받음');
    sendResponse({ success: true });
  }
  return true;
});
