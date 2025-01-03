// 전역 변수
let tileElements = [];
let revealedInterval = null;
let revealedCount = 0;
let startTime = 0;
let score = 0;
let currentAnswer = "";
let data = [];
let selectedCategory = "";

// JSON 데이터 불러오기
fetch("data.json")
  .then((response) => response.json())
  .then((jsonData) => {
    data = jsonData;
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
});

// 퀴즈 시작 함수
function startQuiz(category) {
  document.getElementById("category-container").classList.add("hidden");
  document.getElementById("game-container").classList.remove("hidden");

  // 해당 카테고리의 문제들을 필터링
  const questions = data.filter((item) => item.category === category);
  // 랜덤으로 한 문제 선택
  const randomIndex = Math.floor(Math.random() * questions.length);
  const question = questions[randomIndex];

  // 전역 변수에 저장
  currentAnswer = question.answer;

  // 퀴즈 정보 설정
  document.getElementById("quiz-category").textContent = `[${category}] 이미지 맞추기 퀴즈!`;
  
  // 타일 그리드 초기화
  createTiles(question.image);

  // 보기 버튼 생성
  createChoiceButtons(question.options);

  // 점수 및 타이머 초기화
  score = 0;
  revealedCount = 0;
  startTime = Date.now();
  updateScore(0);
  document.getElementById("timer-info").textContent = "이미지가 5초마다 한 칸씩 공개됩니다!";

  // 5초마다 랜덤 타일 오픈
  revealedInterval = setInterval(() => {
    revealRandomTile(question.image);
  }, 5000);
}

// 8x8 타일 생성
function createTiles(imagePath) {
  const quizGrid = document.getElementById("quiz-grid");
  quizGrid.innerHTML = "";
  tileElements = [];

  for (let i = 0; i < 64; i++) {
    const tile = document.createElement("div");
    tile.classList.add("tile");
    // 배경 이미지는 추후 reveal 시점에 추가
    tileElements.push(tile);
    quizGrid.appendChild(tile);
  }
}

// 랜덤 타일 공개
function revealRandomTile(imagePath) {
  // 아직 공개되지 않은 타일 목록
  const unrevealedTiles = tileElements.filter((tile) => !tile.classList.contains("revealed"));

  // 모두 공개되었다면 멈춤
  if (unrevealedTiles.length === 0) {
    clearInterval(revealedInterval);
    return;
  }

  // 무작위 타일 하나 선택
  const randomTile = unrevealedTiles[Math.floor(Math.random() * unrevealedTiles.length)];
  randomTile.classList.add("revealed");
  randomTile.style.backgroundImage = `url('${imagePath}')`;

  revealedCount++;
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

  // 정답이면
  if (selectedOption === currentAnswer) {
    // 오픈된 타일이 적을수록(빨리 맞출수록) 높은 점수
    // 예: (64 - revealedCount) * 10
    const points = (64 - revealedCount) * 10;

    updateScore(points);

    alert(`정답입니다! +${points}점 획득!\n총 점수: ${score}점`);
    endQuiz();
  } else {
    alert("틀렸습니다! 다시 시도해보세요.");
  }
}

// 점수 업데이트
function updateScore(points) {
  score += points;
  document.getElementById("score-value").textContent = score;
}

// 퀴즈 종료
function endQuiz() {
  // 타일 공개 타이머 종료
  clearInterval(revealedInterval);
  revealedInterval = null;

  // 모든 타일 공개
  tileElements.forEach((tile) => {
    tile.classList.add("revealed");
  });

  document.getElementById("timer-info").textContent = "퀴즈가 종료되었습니다. 다른 카테고리를 선택해보세요!";
}
