// 전역 변수
let tileElements = [];
let revealedInterval = null;
let revealedCount = 0;
let score = 0;
let currentAnswer = "";
let data = [];
let selectedCategory = "";
let questions = [];
let currentQuestionIndex = 0;
const totalQuestions = 10;

// JSON 데이터 불러오기
fetch("data.json")
  .then((response) => response.json())
  .then((jsonData) => {
    data = jsonData;
    initializeHighScore(); // 최고 점수 초기화
  })
  .catch((error) => {
    console.error("JSON 불러오기 실패:", error);
  });

// 카테고리 버튼 클릭 이벤트 등록
document.addEventListener("DOMContentLoaded", () => {
  const categoryButtons = document.querySelectorAll(".category-btn");
  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedCategory = btn.dataset.category;
      startQuiz(selectedCategory);
    });
  });

  // 다음 문제 버튼 클릭 이벤트 등록
  const nextQuestionBtn = document.getElementById("next-question-btn");
  nextQuestionBtn.addEventListener("click", () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < totalQuestions) {
      loadQuestion(currentQuestionIndex);
    } else {
      endQuiz();
    }
  });
});

// 최고 점수 초기화 및 표시
function initializeHighScore() {
  const highScore = localStorage.getItem('highScore') || 0;
  document.getElementById("high-score").textContent = highScore;
}

// 퀴즈 시작 함수
function startQuiz(category) {
  document.getElementById("category-container").classList.add("hidden");
  document.getElementById("game-container").classList.remove("hidden");

  // 해당 카테고리의 문제들을 필터링
  const categoryQuestions = data.filter((item) => item.category === category);
  if (categoryQuestions.length < totalQuestions) {
    displayFeedback("선택한 카테고리에 문제가 충분하지 않습니다. 최소 10문제가 필요합니다.", "failure");
    resetToCategorySelection();
    return;
  }

  // 랜덤으로 10문제 선택
  questions = shuffleArray(categoryQuestions).slice(0, totalQuestions);
  currentQuestionIndex = 0;
  score = 0;
  revealedCount = 0;
  updateScore(0);
  updateProgress(0);
  updateProgressText(0);
  document.getElementById("timer-info").textContent = "이미지가 2초마다 한 칸씩 공개됩니다!";

  // 프로그레스 바 초기화
  updateProgressText(0);

  // 첫 번째 문제 로드
  loadQuestion(currentQuestionIndex);
}

// 문제 로드 함수
function loadQuestion(index) {
  const question = questions[index];
  currentAnswer = question.answer;

  // 퀴즈 정보 설정
  document.getElementById("quiz-category").textContent = `[${capitalizeFirstLetter(selectedCategory)}] 이미지 맞추기 퀴즈! (문제 ${index + 1} / ${totalQuestions})`;

  // 타일 그리드 초기화
  createTiles(question.image);

  // 보기 버튼 생성 (자동 생성)
  const options = generateOptions(selectedCategory, currentAnswer);
  createChoiceButtons(options);

  // 프로그레스 바 업데이트
  updateProgress(index + 1);
  updateProgressText(index + 1);

  // 타일 공개 전에 잠시 이미지 전체 공개 (2초)
  setTimeout(() => {
    hideAllTiles(); // 모든 타일을 숨깁니다.
    startRevealingTiles(); // 타일 공개 시작
  }, 2000); // 2초 후에 타일 숨김

  // 다음 문제 버튼 숨기기
  document.getElementById("next-question-btn").classList.add("hidden");

  // 피드백 메시지 숨기기
  hideFeedback();
}

// 이미지 미리 로드 함수
function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = resolve;
    img.onerror = reject;
  });
}

// 모든 타일 숨기기 함수
function hideAllTiles() {
  tileElements.forEach((tile) => {
    tile.classList.remove("revealed");
  });
}

// 타일 공개 시작 함수
function startRevealingTiles() {
  // 2초마다 랜덤 타일 공개
  revealedInterval = setInterval(() => {
    revealRandomTile();
  }, 2000); // 2초 간격으로 타일 공개
}

// 8x8 타일 생성
function createTiles(imagePath) {
  const quizGrid = document.getElementById("quiz-grid");
  quizGrid.innerHTML = "";
  tileElements = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      // 타일마다 배경 위치 설정
      tile.style.backgroundImage = `url('${imagePath}')`;
      tile.style.backgroundPosition = `-${col * 50}px -${row * 50}px`; // 타일 크기 50px 가정
      tile.style.backgroundSize = `400px 400px`; // 전체 이미지 크기

      // 커버 레이어 추가
      const cover = document.createElement("div");
      cover.classList.add("cover");
      tile.appendChild(cover);

      tileElements.push(tile);
      quizGrid.appendChild(tile);
    }
  }
}

// 랜덤 타일 공개
function revealRandomTile() {
  // 아직 공개되지 않은 타일 목록
  const unrevealedTiles = tileElements.filter((tile) => !tile.classList.contains("revealed"));

  // 모두 공개되었다면 멈춤
  if (unrevealedTiles.length === 0) {
    clearInterval(revealedInterval);
    displayFeedback("모든 타일이 공개되었습니다!", "failure");
    document.getElementById("next-question-btn").classList.remove("hidden");
    return;
  }

  // 무작위 타일 하나 선택
  const randomTile = unrevealedTiles[Math.floor(Math.random() * unrevealedTiles.length)];
  randomTile.classList.add("revealed");

  revealedCount++;
}

// 보기 옵션 생성 함수 (자동 생성)
function generateOptions(category, correctAnswer) {
  // 해당 카테고리의 모든 답변 수집
  const allAnswers = data
    .filter((item) => item.category === category)
    .map((item) => item.answer);

  // 중복 제거
  const uniqueAnswers = Array.from(new Set(allAnswers));

  // 정답을 제외한 나머지 답변들
  const incorrectAnswers = uniqueAnswers.filter(answer => answer !== correctAnswer);

  // 충분한 수의 오답이 있는지 확인
  if (incorrectAnswers.length < 7) {
    displayFeedback("보기 옵션을 생성할 충분한 오답이 없습니다.", "failure");
    resetToCategorySelection();
    return [correctAnswer]; // 최소한 정답 하나는 보장
  }

  // 무작위로 7개의 오답 선택
  const shuffledIncorrect = shuffleArray(incorrectAnswers);
  const selectedIncorrect = shuffledIncorrect.slice(0, 7);

  // 정답과 오답을 합침
  const options = [...selectedIncorrect, correctAnswer];

  // 옵션 섞기
  return shuffleArray(options);
}

// 보기 버튼 생성
function createChoiceButtons(options) {
  const choicesContainer = document.getElementById("choices-buttons");
  choicesContainer.innerHTML = "";

  options.forEach((option) => {
    const button = document.createElement("button");
    button.classList.add("choice-btn");
    button.textContent = option;
    button.addEventListener("click", () => checkAnswer(option));
    choicesContainer.appendChild(button);
  });
}

// 정답 체크
function checkAnswer(selectedOption) {
  // 이미 타이머 멈췄다면(문제 끝났다면) 함수 종료
  if (!revealedInterval) return;

  // 타일 공개 중지
  clearInterval(revealedInterval);
  revealedInterval = null;

  // 모든 타일 공개
  tileElements.forEach((tile) => {
    tile.classList.add("revealed");
  });

  // 정답 여부에 따라 피드백 메시지 표시
  if (selectedOption === currentAnswer) {
    // 오픈된 타일이 적을수록(빨리 맞출수록) 높은 점수
    // 예: (64 - revealedCount) * 10
    const points = (64 - revealedCount) * 10;

    updateScore(points);
    displayFeedback(`정답입니다! +${points}점`, "success");
  } else {
    // 틀렸을 때 -500점
    updateScore(-500);
    displayFeedback(`틀렸습니다! 정답은 "${currentAnswer}"입니다. -500점`, "failure");
  }

  // 다음 문제 버튼 표시
  document.getElementById("next-question-btn").classList.remove("hidden");
}

// 점수 업데이트
function updateScore(points) {
  score += points;
  
  // 점수가 음수가 되지 않도록 처리
  if (score < 0) score = 0;

  const scoreElement = document.getElementById("score-value");
  scoreElement.textContent = score;

  // 최고 점수 업데이트 (현재 점수가 최고 점수보다 클 경우)
  let highScore = parseInt(localStorage.getItem('highScore')) || 0;
  if (score > highScore) {
    localStorage.setItem('highScore', score);
    highScore = score;
    displayFeedback("최고 점수를 갱신했습니다!", "update");
  }
  document.getElementById("high-score").textContent = highScore;

  // 점수 업데이트 애니메이션
  scoreElement.classList.add("highlight");
  setTimeout(() => {
    scoreElement.classList.remove("highlight");
  }, 500);
}

// 퀴즈 종료
function endQuiz() {
  // 모든 타일 공개
  tileElements.forEach((tile) => {
    tile.classList.add("revealed");
  });

  document.getElementById("timer-info").textContent = "퀴즈가 종료되었습니다. 다른 카테고리를 선택해보세요!";

  // 다음 문제 버튼 숨기기
  document.getElementById("next-question-btn").classList.add("hidden");

  // 피드백 메시지 표시
  displayFeedback("퀴즈를 완료하셨습니다!", "success");
}

// 배열 섞기 함수 (Fisher-Yates 알고리즘)
function shuffleArray(array) {
  const shuffled = array.slice(); // 배열 복사
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 첫 글자 대문자 변환 함수
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// 프로그레스 바 업데이트 함수
function updateProgress(current) {
  const progressBar = document.getElementById("progress-bar");
  progressBar.value = current;
}

function updateProgressText(current) {
  const progressText = document.getElementById("progress-text");
  progressText.textContent = `${current} / ${totalQuestions}`;
}

// 피드백 메시지 표시 함수
function displayFeedback(message, type) {
  const feedbackDiv = document.getElementById("feedback-message");
  feedbackDiv.textContent = message;
  feedbackDiv.className = ""; // 초기화
  feedbackDiv.classList.add(type); // success, failure, update 클래스 추가
  feedbackDiv.classList.remove("hidden");
}

function hideFeedback() {
  const feedbackDiv = document.getElementById("feedback-message");
  feedbackDiv.classList.add("hidden");
}

// 카테고리 선택 화면으로 리셋 함수
function resetToCategorySelection() {
  document.getElementById("game-container").classList.add("hidden");
  document.getElementById("category-container").classList.remove("hidden");
}
