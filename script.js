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

// 새로운 변수: 타일 공개 속도 (기본값 1000ms)
let revealSpeed = 1000;

// JSON 데이터 불러오기
fetch("data.json")
  .then((response) => response.json())
  .then((jsonData) => {
    data = jsonData;
    console.log("데이터 로드 완료:", data);
    // 최고 점수 초기화는 퀴즈 시작 시 호출
  })
  .catch((error) => {
    console.error("JSON 불러오기 실패:", error);
    displayFeedback("데이터를 불러오는 데 실패했습니다.", "failure");
    resetToCategorySelection();
  });

// 카테고리 버튼 클릭 이벤트 등록
document.addEventListener("DOMContentLoaded", () => {
  const categoryButtons = document.querySelectorAll(".category-btn");
  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedCategory = btn.dataset.category;
      console.log("선택된 카테고리:", selectedCategory);
      startQuiz(selectedCategory);
    });
  });

  // 다음 문제 버튼 클릭 이벤트 등록
  const nextQuestionBtn = document.getElementById("next-question-btn");
  if (nextQuestionBtn) {
    nextQuestionBtn.addEventListener("click", () => {
      currentQuestionIndex++;
      console.log("다음 질문 인덱스:", currentQuestionIndex);
      if (currentQuestionIndex < totalQuestions) {
        loadQuestion(currentQuestionIndex);
      } else {
        endQuiz();
      }
    });
  }

  // 기존 "처음으로" 버튼 클릭 이벤트 등록
  const startOverBtn = document.getElementById("start-over-btn");
  if (startOverBtn) {
    startOverBtn.addEventListener("click", () => {
      console.log('"처음으로" 버튼 클릭됨 (팝업 내)');
      resetQuiz();
    });
  }

  // 새로 추가된 "처음으로" 버튼 클릭 이벤트 등록
  const startOverButton = document.getElementById("start-over-button");
  if (startOverButton) {
    startOverButton.addEventListener("click", () => {
      console.log('"처음으로" 버튼 클릭됨 (퀴즈 화면 내)');
      resetQuiz();
    });
  }

  // 속도 조절 슬라이더 이벤트 등록
  const speedSlider = document.getElementById("speed-slider");
  const speedValueDisplay = document.getElementById("speed-value");

  if (speedSlider && speedValueDisplay) {
    speedSlider.addEventListener("input", () => {
      revealSpeed = parseInt(speedSlider.value);
      speedValueDisplay.textContent = revealSpeed;
      console.log(`타일 공개 속도 변경: ${revealSpeed}ms`);
      
      // 만약 타일 공개가 진행 중이라면 인터벌을 재설정
      if (revealedInterval) {
        clearInterval(revealedInterval);
        startRevealingTiles();
      }
    });
  }
});

// 창 크기 변경 시 타일 배경 업데이트
window.addEventListener("resize", () => {
  if (tileElements.length > 0) {
    updateTileBackgrounds();
  }
});

// 최고 점수 초기화 및 표시
function initializeHighScore() {
  const highScoreKey = `highScore_${selectedCategory}`;
  const highScore = parseInt(localStorage.getItem(highScoreKey)) || 0;
  document.getElementById("high-score").textContent = highScore;
}

// 퀴즈 시작 함수
function startQuiz(category) {
  // 기존 인터벌이 남아있을 경우 클리어
  if (revealedInterval) {
    clearInterval(revealedInterval);
    revealedInterval = null;
    console.log("기존 인터벌 클리어됨.");
  }

  document.getElementById("category-container").classList.add("hidden");
  document.getElementById("game-container").classList.remove("hidden");

  // 해당 카테고리의 문제들을 필터링
  const categoryQuestions = data.filter((item) => item.category === category);
  console.log(`카테고리 "${category}"의 문제 수:`, categoryQuestions.length);
  
  if (categoryQuestions.length < totalQuestions) {
    displayFeedback(`선택한 카테고리에 문제가 충분하지 않습니다. 최소 ${totalQuestions}문제가 필요합니다.`, "failure");
    resetToCategorySelection();
    return;
  }

  // 랜덤으로 10문제 선택
  questions = shuffleArray(categoryQuestions).slice(0, totalQuestions);
  console.log("선택된 질문들:", questions);
  
  currentQuestionIndex = 0;
  score = 0;
  revealedCount = 0;
  updateScore(0);
  updateProgress(0);
  updateProgressText(0);
  document.getElementById("timer-info").textContent = "이미지가 1초마다 한 칸씩 공개됩니다!";

  // 프로그레스 바 초기화
  updateProgressText(0);

  // 최고 점수 초기화
  initializeHighScore();

  // 첫 번째 문제 로드
  loadQuestion(currentQuestionIndex);
}

// 문제 로드 함수
function loadQuestion(index) {
  console.log(`문제 로드 시작: 인덱스 ${index}`);
  
  const question = questions[index];
  if (!question) {
    console.error(`인덱스 ${index}에 해당하는 질문이 없습니다.`);
    displayFeedback("질문을 불러오는 데 실패했습니다.", "failure");
    resetToCategorySelection();
    return;
  }

  currentAnswer = question.answer;
  console.log(`현재 정답: ${currentAnswer}`);

  // 퀴즈 정보 설정 (헤더 텍스트 간소화)
  document.getElementById("quiz-category").textContent = `이미지 맞추기 퀴즈!`;

  // 타일 그리드 초기화 및 이미지 로드 대기
  createTiles(question.image)
    .then(() => {
      // 보기 버튼 생성 (자동 생성)
      const options = generateOptions(selectedCategory, currentAnswer);
      createChoiceButtons(options);

      // 프로그레스 바 업데이트
      updateProgress(index + 1);
      updateProgressText(index + 1);

      // 타일 공개 전에 타일 숨기기 및 revealedCount 리셋
      hideAllTiles(); // 모든 타일을 숨깁니다.
      revealedCount = 0; // 공개된 타일 수 리셋
      console.log("revealedCount 리셋됨.");
      startRevealingTiles(); // 타일 공개 시작

      // 다음 문제 버튼 숨기기 (팝업 숨기기)
      document.getElementById("next-question-popup").classList.add("hidden");

      // 피드백 메시지 숨기기
      hideFeedback();
    })
    .catch((error) => {
      console.error("타일 생성 중 오류 발생:", error);
      // 추가적인 오류 처리가 필요하면 여기에 작성
    });
}

// 이미지 미리 로드 함수
function preloadImage(url) {
  console.log(`이미지 로드 시도: ${url}`);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      console.log(`이미지 로드 성공: ${url}`);
      resolve();
    };
    img.onerror = () => {
      console.error(`이미지 로드 실패: ${url}`);
      reject(new Error(`이미지 로드 실패: ${url}`));
    };
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
  console.log("타일 공개 시작.");
  revealedInterval = setInterval(() => {
    revealRandomTile();
  }, revealSpeed); // 사용자 설정 속도로 타일 공개
}

// 8x8 타일 생성
function createTiles(imagePath) {
  console.log(`타일 생성 시작: 이미지 경로 "${imagePath}"`);
  const quizGrid = document.getElementById("quiz-grid");
  quizGrid.innerHTML = "";
  tileElements = [];

  // 이미지 로드가 완료되면 타일 생성
  return preloadImage(imagePath)
    .then(() => {
      // 그리드 크기 가져오기
      const gridRect = quizGrid.getBoundingClientRect();
      const gridWidth = gridRect.width;
      const gridHeight = gridRect.height;
      const tileSize = gridWidth / 8; // 가로 기준

      // 각 타일의 배경 크기 및 위치 설정
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const tile = document.createElement("div");
          tile.classList.add("tile");
          // 타일마다 배경 위치 설정
          tile.style.backgroundImage = `url('${imagePath}')`;
          tile.style.backgroundSize = `${gridWidth}px ${gridHeight}px`;
          tile.style.backgroundPosition = `-${col * tileSize}px -${row * tileSize}px`;

          // 커버 레이어 추가
          const cover = document.createElement("div");
          cover.classList.add("cover");
          tile.appendChild(cover);

          tileElements.push(tile);
          quizGrid.appendChild(tile);
        }
      }
      console.log("타일 생성 완료.");
    })
    .catch((error) => {
      console.error("이미지 로딩 실패:", error);
      displayFeedback("이미지를 로딩하는 데 실패했습니다. 올바른 이미지를 확인해주세요.", "failure");
      resetToCategorySelection();
    });
}

// 창 크기 변경 시 타일 배경 업데이트 함수
function updateTileBackgrounds() {
  if (tileElements.length === 0) return;

  const quizGrid = document.getElementById("quiz-grid");
  const gridRect = quizGrid.getBoundingClientRect();
  const gridWidth = gridRect.width;
  const gridHeight = gridRect.height;
  const tileSize = gridWidth / 8; // 가로 기준

  tileElements.forEach((tile, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    const imagePath = tile.style.backgroundImage.slice(5, -2); // url('...')에서 URL 추출

    tile.style.backgroundSize = `${gridWidth}px ${gridHeight}px`;
    tile.style.backgroundPosition = `-${col * tileSize}px -${row * tileSize}px`;
  });
}

// 랜덤 타일 공개
function revealRandomTile() {
  // 아직 공개되지 않은 타일 목록
  const unrevealedTiles = tileElements.filter((tile) => !tile.classList.contains("revealed"));

  // 모두 공개되었다면 멈춤 및 -500점 감점
  if (unrevealedTiles.length === 0) {
    clearInterval(revealedInterval);
    revealedInterval = null;
    console.log("모든 타일 공개됨. -500점 감점.");
    // 모든 타일이 공개되었으므로 -500점 감점 및 피드백 표시
    updateScore(-500);
    displayFeedback(`시간이 초과되었습니다! 정답은 "${currentAnswer}"입니다. -500점`, "failure");
    // "다음 문제" 버튼 팝업 표시
    document.getElementById("next-question-popup").classList.remove("hidden");
    return;
  }

  // 무작위 타일 하나 선택
  const randomTile = unrevealedTiles[Math.floor(Math.random() * unrevealedTiles.length)];
  randomTile.classList.add("revealed");

  revealedCount++;
  console.log(`타일 공개됨. 총 공개된 타일 수: ${revealedCount}`);
}

// 보기 옵션 생성 함수 (자동 생성)
function generateOptions(category, correctAnswer) {
  console.log(`보기 옵션 생성: 카테고리 "${category}", 정답 "${correctAnswer}"`);
  // 해당 카테고리의 모든 답변 수집
  const allAnswers = data
    .filter((item) => item.category === category)
    .map((item) => item.answer);

  // 중복 제거
  const uniqueAnswers = Array.from(new Set(allAnswers));

  // 정답을 제외한 나머지 답변들
  const incorrectAnswers = uniqueAnswers.filter(answer => answer !== correctAnswer);
  console.log(`오답 후보 (${incorrectAnswers.length}개):`, incorrectAnswers);

  // 충분한 수의 오답이 있는지 확인
  if (incorrectAnswers.length < 7) {
    console.error("보기 옵션을 생성할 충분한 오답이 없습니다.");
    displayFeedback("보기 옵션을 생성할 충분한 오답이 없습니다.", "failure");
    resetToCategorySelection();
    return [correctAnswer]; // 최소한 정답 하나는 보장
  }

  // 무작위로 7개의 오답 선택
  const shuffledIncorrect = shuffleArray(incorrectAnswers);
  const selectedIncorrect = shuffledIncorrect.slice(0, 7);
  console.log("선택된 오답:", selectedIncorrect);

  // 정답과 오답을 합침
  const options = [...selectedIncorrect, correctAnswer];

  // 옵션 섞기
  const shuffledOptions = shuffleArray(options);
  console.log("섞인 보기 옵션:", shuffledOptions);
  
  return shuffledOptions;
}

// 보기 버튼 생성
function createChoiceButtons(options) {
  const choicesContainer = document.getElementById("choices-buttons");
  if (!choicesContainer) {
    console.error("보기 버튼 컨테이너를 찾을 수 없습니다.");
    displayFeedback("보기 버튼을 찾을 수 없습니다.", "failure");
    return;
  }
  choicesContainer.innerHTML = "";

  options.forEach((option) => {
    const button = document.createElement("button");
    button.classList.add("choice-btn");
    button.textContent = option;
    button.addEventListener("click", () => checkAnswer(option));
    choicesContainer.appendChild(button);
  });

  console.log("보기 버튼 생성 완료.");
}

// 정답 체크
function checkAnswer(selectedOption) {
  console.log(`선택된 보기: "${selectedOption}"`);

  // 이미 타이머 멈췄다면(문제 끝났다면) 함수 종료
  if (!revealedInterval) {
    console.warn("타이머가 멈췄습니다. 정답 체크를 종료합니다.");
    return;
  }

  // 타일 공개 중지
  clearInterval(revealedInterval);
  revealedInterval = null;
  console.log("타일 공개 인터벌 중지됨.");

  // 모든 타일 공개
  tileElements.forEach((tile) => {
    tile.classList.add("revealed");
  });

  // 정답 여부에 따라 피드백 메시지 표시
  if (selectedOption === currentAnswer) {
    // 오픈된 타일이 적을수록(빨리 맞출수록) 높은 점수
    // 예: (64 - revealedCount) * 10
    const points = (64 - revealedCount) * 10;
    console.log(`정답! 점수 증가: +${points}점`);
    updateScore(points);
    displayFeedback(`정답입니다! +${points}점`, "success");
  } else {
    // 틀렸을 때 -500점
    console.log(`오답! 점수 감소: -500점`);
    updateScore(-500);
    displayFeedback(`틀렸습니다! 정답은 "${currentAnswer}"입니다. -500점`, "failure");
  }

  // "다음 문제" 버튼 팝업 표시
  document.getElementById("next-question-popup").classList.remove("hidden");
}

// 점수 업데이트
function updateScore(points) {
  score += points;
  console.log(`현재 점수: ${score}`);

  const scoreElement = document.getElementById("score-value");
  scoreElement.textContent = score;

  // 현재 카테고리에 해당하는 최고 점수 키 생성
  const highScoreKey = `highScore_${selectedCategory}`;

  // 기존 최고 점수 가져오기
  let highScore = parseInt(localStorage.getItem(highScoreKey)) || 0;
  console.log(`기존 최고 점수 (${highScoreKey}): ${highScore}`);

  if (score > highScore) {
    localStorage.setItem(highScoreKey, score);
    highScore = score;
    console.log("최고 점수 갱신됨:", highScore);
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
  console.log("퀴즈 종료.");
  // 모든 타일 공개
  tileElements.forEach((tile) => {
    tile.classList.add("revealed");
  });

  document.getElementById("timer-info").textContent = "퀴즈가 종료되었습니다. 다른 카테고리를 선택해보세요!";

  // "다음 문제" 버튼 팝업 숨기기
  document.getElementById("next-question-popup").classList.add("hidden");

  // 퀴즈 완료 팝업 표시
  document.getElementById("start-over-popup").classList.remove("hidden");

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
  console.log(`프로그레스 바 업데이트: ${current} / ${totalQuestions}`);
}

function updateProgressText(current) {
  const progressText = document.getElementById("progress-text");
  progressText.textContent = `${current} / ${totalQuestions}`;
  console.log(`프로그레스 텍스트 업데이트: ${progressText.textContent}`);
}

// 피드백 메시지 표시 함수
function displayFeedback(message, type) {
  const feedbackDiv = document.getElementById("feedback-message");
  feedbackDiv.textContent = message;
  feedbackDiv.className = ""; // 초기화
  feedbackDiv.classList.add(type); // success, failure, update 클래스 추가
  feedbackDiv.classList.remove("hidden");
  console.log(`피드백 표시 [${type}]: ${message}`);
}

function hideFeedback() {
  const feedbackDiv = document.getElementById("feedback-message");
  feedbackDiv.classList.add("hidden");
  console.log("피드백 숨김.");
}

// 카테고리 선택 화면으로 리셋 함수
function resetToCategorySelection() {
  console.log("카테고리 선택 화면으로 리셋.");
  // 인터벌 클리어
  if (revealedInterval) {
    clearInterval(revealedInterval);
    revealedInterval = null;
    console.log("인터벌 클리어됨.");
  }

  document.getElementById("game-container").classList.add("hidden");
  document.getElementById("category-container").classList.remove("hidden");
}

// 퀴즈 리셋 함수 (재사용 가능)
function resetQuiz() {
  console.log("퀴즈 리셋 시작.");
  // 인터벌 클리어
  if (revealedInterval) {
    clearInterval(revealedInterval);
    revealedInterval = null;
    console.log("인터벌 클리어됨.");
  }

  // 모든 타일 숨기기
  hideAllTiles();

  // 모든 타일의 'revealed' 클래스 제거
  tileElements.forEach(tile => tile.classList.remove("revealed"));
  console.log("모든 타일 숨김 및 'revealed' 클래스 제거됨.");

  // 모든 팝업 숨기기
  document.getElementById("next-question-popup").classList.add("hidden");
  document.getElementById("start-over-popup").classList.add("hidden");
  console.log("모든 팝업 숨김.");

  // 퀴즈 게임 화면 숨기기
  document.getElementById("game-container").classList.add("hidden");

  // 카테고리 선택 화면 보이기
  document.getElementById("category-container").classList.remove("hidden");
  console.log("카테고리 선택 화면 보임.");

  // 점수 및 진행 상황 리셋
  score = 0;
  revealedCount = 0;
  updateScore(0);
  updateProgress(0);
  updateProgressText(0);
  hideFeedback();
  console.log("점수 및 진행 상황 리셋됨.");
}
