import{gate6Scenes}from'./gate6-scenes.mjs';
import{gate5Scenes}from'./gate5-scenes.mjs';
import{gate4Scenes}from'./gate4-scenes.mjs';
import{gate3Scenes}from'./gate3-scenes.mjs';
import{gate2Scenes,managerScene}from'./gate2-scenes.mjs';
export const gateCap=30;
export const scenes=[
  {
    "id": "story_prologue",
    "level": 0,
    "chapter": 1,
    "title": "다시, 햇살마을",
    "economyReward": 0,
    "trigger": "새 카페 시작 전 또는 구저장 합류",
    "dialogue": [
      {
        "speaker": "나레이션",
        "text": "한때는 웃음소리가 가득했던 햇살마을.",
        "character": null,
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "나레이션",
        "text": "요즘 골목에는 닫힌 문이 더 많아졌어요.",
        "character": null,
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "윤정",
        "text": "어서 오렴. 이 골목을 기억하니?",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "윤정",
        "text": "여기는 이웃들이 쉬어 가던 작은 카페란다.",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "cafe",
        "sound": null
      },
      {
        "speaker": "윤정",
        "text": "한동안 문을 닫아 두었더니 조용해졌구나.",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "cafe",
        "sound": null
      },
      {
        "speaker": "윤정",
        "text": "하지만 다시 따뜻한 불빛을 켤 수 있을 거야.",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "cafe",
        "sound": null
      },
      {
        "speaker": "윤정",
        "text": "이 카페의 열쇠를 네게 맡겨도 될까?",
        "character": "yoonjeong",
        "emotion": "determined",
        "side": "left",
        "camera": "cafe",
        "sound": "key"
      },
      {
        "speaker": "플레이어",
        "text": "작은 한 잔부터 시작해 볼게요.",
        "character": null,
        "emotion": "neutral",
        "side": "left",
        "camera": "cafe",
        "sound": null
      },
      {
        "speaker": "윤정",
        "text": "문제를 풀면 카페의 음식을 만들 수 있단다.",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "door",
        "sound": null
      },
      {
        "speaker": "윤정",
        "text": "준비한 음식은 손님께 직접 서빙해 보렴.",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "door",
        "sound": null
      },
      {
        "speaker": "윤정",
        "text": "직원을 채용하면 함께 일할 수도 있지.",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "door",
        "sound": null
      },
      {
        "speaker": "윤정",
        "text": "지금은 이 작은 카페에서 천천히 시작하자.",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "door",
        "sound": null
      },
      {
        "speaker": "나레이션",
        "text": "다시, 햇살마을. 우리의 첫 번째 불빛.",
        "character": null,
        "emotion": "neutral",
        "side": "left",
        "camera": "door",
        "sound": null
      }
    ]
  },
  {
    "id": "story_lv01",
    "level": 1,
    "chapter": 1,
    "title": "카페의 열쇠",
    "cast": "윤정",
    "dialogue": [
      {
        "speaker": "윤정",
        "text": "첫 손님께 음료를 잘 전했구나. 정말 수고했어!",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "door",
        "sound": null
      },
      {
        "speaker": "윤정",
        "text": "네가 준비한 한 잔이 손님께 닿았어. 차근차근 해낸 거란다.",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "door",
        "sound": null
      },
      {
        "speaker": "윤정",
        "text": "잘했어. 네 첫 서빙 덕분에 햇살마을에 따뜻한 불빛이 켜졌구나.",
        "character": "yoonjeong",
        "emotion": "happy",
        "side": "left",
        "camera": "door",
        "sound": "bell"
      }
    ],
    "visual": "낡은 카페 정면→문 열림→간판 점등",
    "ui": "첫 문제→생산→서빙 안내",
    "trigger": "첫 실제 서빙 완료",
    "rewardVisual": "간판 점등·첫 사진",
    "audio": "문 종·따뜻한 피아노",
    "emotion": "기대→미소",
    "sourceDraftTitle": "카페 재개장",
    "status": "design-draft",
    "pausePolicy": "queue-after-session",
    "economyReward": 0,
    "assetIds": [
      "bg_street_stage_01",
      "cutscene_lv01"
    ],
    "skipPolicy": "mark-viewed-apply-visual",
    "replayPolicy": "album-no-side-effects",
    "direction": "첫 서빙을 마치고 돌아본 이야기",
    "cutscene": {
      "seconds": 5,
      "lighting": true,
      "bakeryRepair": false
    }
  },
  {
    "id": "story_lv02",
    "level": 2,
    "chapter": 1,
    "title": "돌아온 손님",
    "cast": "단골",
    "dialogue": [
      {
        "speaker": "단골",
        "text": "어? 이 카페가 다시 열었네요!",
        "character": "regular",
        "emotion": "surprised",
        "side": "left",
        "camera": "cafe",
        "sound": null
      },
      {
        "speaker": "단골",
        "text": "골목에 카페 불빛이 켜져 있으니 참 반갑네요.",
        "character": "regular",
        "emotion": "neutral",
        "side": "left",
        "camera": "cafe",
        "sound": null
      },
      {
        "speaker": "단골",
        "text": "앞으로도 종종 들를게요.",
        "character": "regular",
        "emotion": "happy",
        "side": "left",
        "camera": "cafe",
        "sound": null
      }
    ],
    "visual": "카페 앞 한 명의 행인과 단골",
    "ui": "재방문 이야기 카드",
    "trigger": "Lv.2 달성",
    "rewardVisual": "거리 행인 +1",
    "audio": "발걸음·문 종",
    "emotion": "놀람→기쁨",
    "sourceDraftTitle": "다시 찾아온 단골",
    "status": "design-draft",
    "pausePolicy": "queue-after-session",
    "economyReward": 0,
    "assetIds": [
      "bg_street_stage_01",
      "cutscene_lv02"
    ],
    "skipPolicy": "mark-viewed-apply-visual",
    "replayPolicy": "album-no-side-effects",
    "direction": "",
    "cutscene": {
      "seconds": 3,
      "lighting": true,
      "bakeryRepair": false
    }
  },
  {
    "id": "story_lv03",
    "level": 3,
    "chapter": 1,
    "title": "첫 번째 소문",
    "cast": "단골",
    "dialogue": [
      {
        "speaker": "단골",
        "text": "친구에게 이곳 이야기를 해도 될까요?",
        "character": "regular",
        "emotion": "neutral",
        "side": "left",
        "camera": "cafe",
        "sound": null
      },
      {
        "speaker": "단골",
        "text": "우리 동네에 다시 모일 곳이 생겼다고요.",
        "character": "regular",
        "emotion": "neutral",
        "side": "left",
        "camera": "cafe",
        "sound": null
      },
      {
        "speaker": "단골",
        "text": "사장님도 오늘의 미션을 살펴보세요.",
        "character": "regular",
        "emotion": "happy",
        "side": "left",
        "camera": "cafe",
        "sound": null
      }
    ],
    "visual": "카페 앞 두 주민이 대화",
    "ui": "기존 미션 버튼 강조",
    "trigger": "Lv.3 달성; 미션 미완료여도 진행",
    "rewardVisual": "주민 대화 소품",
    "audio": "말풍선 효과",
    "emotion": "기쁨",
    "sourceDraftTitle": "첫 응원과 소문",
    "status": "design-draft",
    "pausePolicy": "queue-after-session",
    "economyReward": 0,
    "assetIds": [
      "bg_street_stage_01",
      "cutscene_lv03"
    ],
    "skipPolicy": "mark-viewed-apply-visual",
    "replayPolicy": "album-no-side-effects",
    "direction": "",
    "cutscene": {
      "seconds": 3,
      "lighting": true,
      "bakeryRepair": false
    }
  },
  {
    "id": "story_lv04",
    "level": 4,
    "chapter": 1,
    "title": "함께 일할 사람",
    "cast": "직원대표",
    "dialogue": [
      {
        "speaker": "직원대표",
        "text": "손님이 조금씩 늘었어요.",
        "character": "staff",
        "emotion": "neutral",
        "side": "left",
        "camera": "cafe",
        "sound": null
      },
      {
        "speaker": "직원대표",
        "text": "사장님, 직원이 있으면 서빙이 한결 편해질 거예요.",
        "character": "staff",
        "emotion": "neutral",
        "side": "left",
        "camera": "cafe",
        "sound": null
      },
      {
        "speaker": "직원대표",
        "text": "직원 채용은 이미 Lv.3부터 가능하니 필요할 때 선택해요.",
        "character": "staff",
        "emotion": "happy",
        "side": "left",
        "camera": "cafe",
        "sound": null
      }
    ],
    "visual": "구인 안내판·카페 내부 직원 동선",
    "ui": "직원 관리 버튼 강조",
    "trigger": "Lv.4 달성; 고용 강제 없음",
    "rewardVisual": "직원 안내 카드",
    "audio": "종이 펼침",
    "emotion": "기대",
    "sourceDraftTitle": "혼자서 바쁜 가게",
    "status": "design-draft",
    "pausePolicy": "queue-after-session",
    "economyReward": 0,
    "assetIds": [
      "bg_street_stage_01",
      "cutscene_lv04"
    ],
    "skipPolicy": "mark-viewed-apply-visual",
    "replayPolicy": "album-no-side-effects",
    "direction": "",
    "cutscene": {
      "seconds": 3,
      "lighting": true,
      "bakeryRepair": false
    }
  },
  {
    "id": "story_lv05",
    "level": 5,
    "chapter": 1,
    "title": "옆 빵집의 불빛",
    "cast": "미정",
    "dialogue": [
      {
        "speaker": "미정",
        "text": "안녕하세요, 옆 빵집을 운영하던 미정이에요.",
        "character": "mijeong",
        "emotion": "worried",
        "side": "right",
        "camera": "bakery",
        "sound": null
      },
      {
        "speaker": "미정",
        "text": "손님이 줄어 문을 닫을까 고민했어요.",
        "character": "mijeong",
        "emotion": "worried",
        "side": "right",
        "camera": "bakery",
        "sound": null
      },
      {
        "speaker": "미정",
        "text": "그런데 여기 불이 켜진 걸 보니 저도 다시 해 보고 싶네요.",
        "character": "mijeong",
        "emotion": "happy",
        "side": "right",
        "camera": "bakery",
        "sound": "hope"
      },
      {
        "speaker": "윤정",
        "text": "문을 여는 날은 미정 씨가 정하면 돼요. 우리는 여기서 응원할게요.",
        "character": "yoonjeong",
        "emotion": "happy",
        "side": "left",
        "camera": "bakery",
        "sound": null
      },
      {
        "speaker": "미정",
        "text": "고마워요. 오늘은 셔터를 닦고 작업등부터 켜 볼게요. 아직 문을 열 준비는 더 필요해요.",
        "character": "mijeong",
        "emotion": "determined",
        "side": "right",
        "camera": "bakery",
        "sound": "hope"
      }
    ],
    "visual": "닫힌 빵집·정비 안내문 부착",
    "ui": "마을 변화 첫 소개",
    "trigger": "Lv.5 달성",
    "rewardVisual": "빵집 정비 상태",
    "audio": "잔잔한 현악",
    "emotion": "걱정→희망",
    "sourceDraftTitle": "빵집 사장의 고민",
    "status": "design-draft",
    "pausePolicy": "queue-after-session",
    "economyReward": 0,
    "assetIds": [
      "bg_street_stage_01",
      "cutscene_lv05"
    ],
    "skipPolicy": "mark-viewed-apply-visual",
    "replayPolicy": "album-no-side-effects",
    "direction": "",
    "cutscene": {
      "seconds": 3,
      "lighting": true,
      "bakeryRepair": true
    }
  }
];
scenes.push(...gate2Scenes,managerScene,...gate3Scenes,...gate4Scenes,...gate5Scenes,...gate6Scenes);
export const sceneById=id=>scenes.find(s=>s.id===id);
