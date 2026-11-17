export const gate3Scenes=[
  {
    "id": "story_lv11",
    "level": 11,
    "chapter": 3,
    "title": "우리만의 강점",
    "cast": "선택매니저/윤정",
    "dialogue": [
      {
        "speaker": "윤정",
        "character": "yoonjeong",
        "text": "이제 우리 카페만의 강점을 생각해 볼 때구나.",
        "emotion": "happy",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "윤정",
        "character": "yoonjeong",
        "text": "많이 생산하는 길과 우리만의 메뉴·브랜드를 키우는 길이 있단다.",
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "윤정",
        "character": "yoonjeong",
        "text": "다른 가게를 따라가기보다 네 마음이 향하는 쪽을 천천히 살펴보렴.",
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "윤정",
        "character": "yoonjeong",
        "text": "어느 길이든 네가 고르렴. 나는 네가 오래 좋아할 카페였으면 좋겠구나.",
        "emotion": "happy",
        "side": "left",
        "camera": "wide",
        "sound": null
      }
    ],
    "visual": "생산 주방 vs 브랜드 진열대 대비",
    "ui": "기존 전문화 선택/상태 보기",
    "trigger": "Lv.11; 선택 완료면 결과 회상",
    "rewardVisual": "전문화 소품",
    "audio": "결정 효과",
    "emotion": "결심",
    "sourceDraftTitle": "카페만의 강점",
    "status": "implemented-review-candidate",
    "pausePolicy": "queue-after-session",
    "economyReward": 0,
    "assetIds": [
      "bg_street_stage_03",
      "cutscene_lv11"
    ],
    "skipPolicy": "mark-viewed-apply-visual",
    "replayPolicy": "album-no-side-effects",
    "direction": "세 번째 장",
    "cutscene": {
      "kind": "specialization",
      "seconds": 2
    }
  },
  {
    "id": "story_lv12",
    "level": 12,
    "chapter": 3,
    "title": "빵집 재개장",
    "cast": "미정",
    "dialogue": [
      {
        "speaker": "미정",
        "character": "mijeong",
        "text": "닫혀 있던 빵집을 청소하고, 다시 반죽을 시작했어요.",
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "미정",
        "character": "mijeong",
        "text": "함께 지켜봐 주셔서 고마워요. 드디어 빵집 문을 다시 열었어요.",
        "emotion": "happy",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "미정",
        "character": "mijeong",
        "text": "작업등이 켜지고 빵이 진열되니 정말 다시 시작하는 기분이에요.",
        "emotion": "happy",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "단골",
        "character": "regular",
        "text": "따뜻한 빵 냄새가 나요! 문 여는 날을 함께 축하해요.",
        "emotion": "happy",
        "side": "right",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "미정",
        "character": "mijeong",
        "text": "카페에서 시작된 용기가 여기까지 왔네요. 고마워요.",
        "emotion": "moved",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "윤정",
        "character": "yoonjeong",
        "text": "미정이가 차근차근 준비한 덕분이지. 우리 골목에 온기가 하나 더 켜졌구나.",
        "emotion": "happy",
        "side": "right",
        "camera": "wide",
        "sound": null
      }
    ],
    "visual": "셔터 올라감→진열창 불빛→주민 박수",
    "ui": "스토리 컷신 8초",
    "trigger": "Lv.12; 이전 사건 미열람은 요약 후 연결",
    "rewardVisual": "빵집 OPEN 단계",
    "audio": "셔터·종·박수",
    "emotion": "기쁨→감동",
    "sourceDraftTitle": "빵집 재개장",
    "status": "implemented-review-candidate",
    "pausePolicy": "queue-after-session",
    "economyReward": 0,
    "assetIds": [
      "bg_street_stage_03",
      "cutscene_lv12"
    ],
    "skipPolicy": "mark-viewed-apply-visual",
    "replayPolicy": "album-no-side-effects",
    "direction": "세 번째 장",
    "cutscene": {
      "kind": "bakery-reopen",
      "seconds": 8
    }
  },
  {
    "id": "story_lv13",
    "level": 13,
    "chapter": 3,
    "title": "골목 행사 제안",
    "cast": "서진",
    "dialogue": [
      {
        "speaker": "서진",
        "character": "seojin",
        "text": "안녕하세요, 마을 일을 돕는 서진이에요.",
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "서진",
        "character": "seojin",
        "text": "가게 앞을 정리하고 작은 골목 행사 안내를 준비하고 있어요.",
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "윤정",
        "character": "yoonjeong",
        "text": "작은 준비라도 함께하면 힘이 되는 법이지. 나도 손을 보태마.",
        "emotion": "happy",
        "side": "right",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "서진",
        "character": "seojin",
        "text": "고마워요. 이웃들이 서로 인사할 자리를 만들어 보고 싶어요.",
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": null
      }
    ],
    "visual": "거리 행사 게시판 설치",
    "ui": "행사 안내 카드; 실제 행사 기능과 혼동 금지",
    "trigger": "Lv.13",
    "rewardVisual": "행사 포스터",
    "audio": "종이 펼침",
    "emotion": "기대",
    "sourceDraftTitle": "첫 골목 행사 제안",
    "status": "implemented-review-candidate",
    "pausePolicy": "queue-after-session",
    "economyReward": 0,
    "assetIds": [
      "bg_street_stage_03",
      "cutscene_lv13"
    ],
    "skipPolicy": "mark-viewed-apply-visual",
    "replayPolicy": "album-no-side-effects",
    "direction": "세 번째 장",
    "cutscene": {
      "kind": "event-prep",
      "seconds": 2
    }
  },
  {
    "id": "story_lv14",
    "level": 14,
    "chapter": 3,
    "title": "바빠진 거리",
    "cast": "직원대표",
    "dialogue": [
      {
        "speaker": "직원대표",
        "character": "staff",
        "text": "골목 안내를 보고 구경하는 이웃이 늘었어요.",
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "단골",
        "character": "regular",
        "text": "빵집과 카페 사이로 오가니 골목이 더 반가워졌어요.",
        "emotion": "happy",
        "side": "right",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "직원대표",
        "character": "staff",
        "text": "반갑게 맞이하고 싶은데, 오래 기다리는 분을 보면 마음이 조급해져요.",
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "직원대표",
        "character": "staff",
        "text": "서로 길을 비켜 주고 맡은 일을 나누면 한결 편해질 것 같아요.",
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": null
      }
    ],
    "visual": "카페 앞 대기 인파",
    "ui": "직원 동선·구역 안내",
    "trigger": "Lv.14; 기능 미구매면 구매 강제 없음",
    "rewardVisual": "거리 인파 단계 3",
    "audio": "발걸음",
    "emotion": "걱정→결심",
    "sourceDraftTitle": "바빠지는 거리",
    "status": "implemented-review-candidate",
    "pausePolicy": "queue-after-session",
    "economyReward": 0,
    "assetIds": [
      "bg_street_stage_03",
      "cutscene_lv14"
    ],
    "skipPolicy": "mark-viewed-apply-visual",
    "replayPolicy": "album-no-side-effects",
    "direction": "세 번째 장",
    "cutscene": {
      "kind": "visitors",
      "seconds": 2
    }
  },
  {
    "id": "story_lv15",
    "level": 15,
    "chapter": 3,
    "title": "다시 열린 서점",
    "cast": "도현",
    "dialogue": [
      {
        "speaker": "도현",
        "character": "dohyeon",
        "text": "안녕하세요. 서점 주인 도현이에요. 한동안 닫힌 문 뒤에서 책을 정리했어요.",
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "도현",
        "character": "dohyeon",
        "text": "미정 씨 빵집이 다시 열린 걸 보고, 저도 셔터를 올릴 용기가 났어요.",
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "미정",
        "character": "mijeong",
        "text": "책 진열도 직접 준비하셨네요. 오늘은 저도 축하하러 왔어요.",
        "emotion": "happy",
        "side": "right",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "도현",
        "character": "dohyeon",
        "text": "이제 책장에 불이 들어왔어요. 이 골목에서 다시 책 이야기를 나누고 싶어요.",
        "emotion": "happy",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "윤정",
        "character": "yoonjeong",
        "text": "카페와 빵집, 서점이 서로를 응원하게 되었구나.",
        "emotion": "happy",
        "side": "right",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "도현",
        "character": "dohyeon",
        "text": "서두르지 않고 한 권씩 채워 갈게요. 편하게 들러 주세요.",
        "emotion": "moved",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "윤정",
        "character": "yoonjeong",
        "text": "한 권씩 채우는 그 마음이 참 좋구나. 우리도 오래 사랑받을 카페를 가꾸어 보자꾸나.",
        "emotion": "happy",
        "side": "right",
        "camera": "wide",
        "sound": null
      }
    ],
    "visual": "서점 셔터 상승·책 진열·간판 점등",
    "ui": "서점 재개장 컷신",
    "trigger": "Lv.15",
    "rewardVisual": "서점 OPEN 단계",
    "audio": "책장·종",
    "emotion": "수줍음→기쁨",
    "sourceDraftTitle": "서점 재개장",
    "status": "implemented-review-candidate",
    "pausePolicy": "queue-after-session",
    "economyReward": 0,
    "assetIds": [
      "bg_street_stage_03",
      "cutscene_lv15"
    ],
    "skipPolicy": "mark-viewed-apply-visual",
    "replayPolicy": "album-no-side-effects",
    "direction": "세 번째 장",
    "cutscene": {
      "kind": "bookshop-reopen",
      "seconds": 8
    }
  }
];
export function gate3Variant(scene,o={}){const s=structuredClone(scene);if(s.level===11){const name={mass:'대량생산형',brand:'개성·브랜드형'}[o.specialization];if(name){s.dialogue[1].text=o.specialization==='mass'?'넉넉하게 준비해 손님들을 든든히 맞이하는 길을 골랐구나.':'메뉴와 공간에 네 이야기를 담는 길을 골랐구나.';s.dialogue[2].text='고른 길에 너다운 마음이 보이는구나. 조급해하지 말고 가꾸어 보렴.';}if(['yuna','hajun','soi'].includes(o.manager)){s.dialogue=s.dialogue.map(d=>({...d,speaker:{yuna:'유나',hajun:'하준',soi:'소이'}[o.manager],character:o.manager,side:'right'}));s.dialogue[0].text={yuna:'우리 카페가 오래 이어 갈 강점을 함께 찾아보고 싶어요.',hajun:'손님과 직원이 편안하게 웃을 수 있는 카페를 함께 만들어 봐요.',soi:'메뉴와 공간에 사장님만의 이야기를 담아 보고 싶어요.'}[o.manager];s.dialogue[1].text=name?(o.specialization==='mass'?'넉넉히 준비해 손님을 맞이하려는 마음이 전해져요.':'우리만의 메뉴를 정성스럽게 가꾸려는 마음이 전해져요.'):'많은 분께 든든한 한 잔을 드리는 길도, 특별한 추억을 남기는 길도 있어요.';s.dialogue[2].text='어떤 모습이 가장 사장님다운지 천천히 생각해 보세요.';s.dialogue[3].text='결정하시면 그 길을 함께 걸을게요. 서두르지 않아도 괜찮아요.';}}return s;}
