export const gate2Scenes=[
  {
    "id": "story_lv06",
    "level": 6,
    "chapter": 2,
    "title": "더 넓은 자리",
    "cast": "윤정",
    "dialogue": [
      {
        "speaker": "윤정",
        "text": "카페가 조금 좁아 보이는구나.",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "cafe",
        "sound": "bell"
      },
      {
        "speaker": "윤정",
        "text": "증축 자격은 Lv.5부터 열렸단다.",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "cafe",
        "sound": null
      },
      {
        "speaker": "윤정",
        "text": "공간을 넓히는 건 네가 돈을 모아 직접 결정하렴.",
        "character": "yoonjeong",
        "emotion": "happy",
        "side": "left",
        "camera": "cafe",
        "sound": null
      }
    ],
    "visual": "카페 밖 화분·좁은 테이블 연출",
    "ui": "유료 증축 화면 연결",
    "trigger": "Lv.6; 구매 여부 분기",
    "rewardVisual": "화분 2개",
    "audio": "화분 놓는 소리",
    "emotion": "기쁨",
    "sourceDraftTitle": "좁아진 카페",
    "status": "implemented-review-candidate",
    "pausePolicy": "queue-after-session",
    "economyReward": 0,
    "assetIds": [
      "bg_street_stage_02",
      "cutscene_lv06"
    ],
    "skipPolicy": "mark-viewed-apply-visual",
    "replayPolicy": "album-no-side-effects",
    "direction": "두 번째 장",
    "cutscene": {
      "seconds": 2,
      "kind": "pots"
    }
  },
  {
    "id": "story_lv07",
    "level": 7,
    "chapter": 2,
    "title": "우리 카페의 색깔",
    "cast": "윤정",
    "dialogue": [
      {
        "speaker": "윤정",
        "text": "카페마다 어울리는 분위기가 다르단다.",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": "bell"
      },
      {
        "speaker": "윤정",
        "text": "정원, 베이커리, 디저트 중 어떤 모습이 좋겠니?",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "wide",
        "sound": null
      },
      {
        "speaker": "윤정",
        "text": "서두르지 않아도 돼. 선택은 신중하게 하렴.",
        "character": "yoonjeong",
        "emotion": "happy",
        "side": "left",
        "camera": "wide",
        "sound": null
      }
    ],
    "visual": "세 카페 외관 비교 컷",
    "ui": "기존 분기 선택 UI로 안전한 이동",
    "trigger": "Lv.7; 선택 미완료면 선택 UI, 완료면 회상",
    "rewardVisual": "선택한 외관 반영",
    "audio": "반짝임·선택 효과",
    "emotion": "기대",
    "sourceDraftTitle": "우리 카페의 모습",
    "status": "implemented-review-candidate",
    "pausePolicy": "queue-after-session",
    "economyReward": 0,
    "assetIds": [
      "bg_street_stage_02",
      "cutscene_lv07"
    ],
    "skipPolicy": "mark-viewed-apply-visual",
    "replayPolicy": "album-no-side-effects",
    "direction": "두 번째 장",
    "cutscene": {
      "seconds": 2,
      "kind": "branches"
    }
  },
  {
    "id": "story_lv08",
    "level": 8,
    "chapter": 2,
    "title": "골목에 퍼지는 이야기",
    "cast": "단골",
    "dialogue": [
      {
        "speaker": "단골",
        "text": "요즘 이 골목이 조금 밝아졌어요.",
        "character": "regular",
        "emotion": "neutral",
        "side": "right",
        "camera": "cafe",
        "sound": "bell"
      },
      {
        "speaker": "단골",
        "text": "다른 동네 친구도 카페를 궁금해하더라고요.",
        "character": "regular",
        "emotion": "neutral",
        "side": "right",
        "camera": "cafe",
        "sound": null
      },
      {
        "speaker": "단골",
        "text": "손님들의 반응을 살펴보면 도움이 될 거예요.",
        "character": "regular",
        "emotion": "happy",
        "side": "right",
        "camera": "cafe",
        "sound": null
      }
    ],
    "visual": "거리 행인·작은 리뷰 표지",
    "ui": "리뷰·손님 반응 안내",
    "trigger": "Lv.8",
    "rewardVisual": "거리 인파 단계 2",
    "audio": "카페 소음",
    "emotion": "기쁨",
    "sourceDraftTitle": "동네에 퍼지는 소문",
    "status": "implemented-review-candidate",
    "pausePolicy": "queue-after-session",
    "economyReward": 0,
    "assetIds": [
      "bg_street_stage_02",
      "cutscene_lv08"
    ],
    "skipPolicy": "mark-viewed-apply-visual",
    "replayPolicy": "album-no-side-effects",
    "direction": "두 번째 장",
    "cutscene": {
      "seconds": 2,
      "kind": "reviews"
    }
  },
  {
    "id": "story_lv09",
    "level": 9,
    "chapter": 2,
    "title": "바쁠수록 천천히",
    "cast": "윤정",
    "dialogue": [
      {
        "speaker": "윤정",
        "text": "손님이 많아지면 놓치는 것도 생긴단다.",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "door",
        "sound": "bell"
      },
      {
        "speaker": "윤정",
        "text": "재고와 직원 상태를 한 번 살펴보렴.",
        "character": "yoonjeong",
        "emotion": "worried",
        "side": "left",
        "camera": "door",
        "sound": null
      },
      {
        "speaker": "윤정",
        "text": "문제를 풀어 음식을 만들 수 있다는 것도 잊지 말고.",
        "character": "yoonjeong",
        "emotion": "happy",
        "side": "left",
        "camera": "door",
        "sound": null
      }
    ],
    "visual": "주방 재고 표지·시계",
    "ui": "재고·직원 점검",
    "trigger": "Lv.9; 매니저 있으면 매니저 변주",
    "rewardVisual": "재고 알림 시각 강조",
    "audio": "시계 틱",
    "emotion": "차분함",
    "sourceDraftTitle": "운영의 고민",
    "status": "implemented-review-candidate",
    "pausePolicy": "queue-after-session",
    "economyReward": 0,
    "assetIds": [
      "bg_street_stage_02",
      "cutscene_lv09"
    ],
    "skipPolicy": "mark-viewed-apply-visual",
    "replayPolicy": "album-no-side-effects",
    "direction": "두 번째 장",
    "cutscene": {
      "seconds": 2,
      "kind": "stock"
    }
  },
  {
    "id": "story_lv10",
    "level": 10,
    "chapter": 2,
    "title": "함께하는 카페",
    "cast": "선택매니저/윤정",
    "dialogue": [
      {
        "speaker": "선택매니저/윤정",
        "text": "혼자 모든 일을 하지 않아도 괜찮아요.",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "cafe",
        "sound": "bell"
      },
      {
        "speaker": "선택매니저/윤정",
        "text": "함께할 사람이 생기면 카페도 더 멀리 갈 수 있죠.",
        "character": "yoonjeong",
        "emotion": "neutral",
        "side": "left",
        "camera": "cafe",
        "sound": null
      },
      {
        "speaker": "선택매니저/윤정",
        "text": "우리 동네를 더 따뜻하게 만들어 봐요.",
        "character": "yoonjeong",
        "emotion": "happy",
        "side": "left",
        "camera": "cafe",
        "sound": null
      }
    ],
    "visual": "매니저가 있으면 등장, 없으면 윤정",
    "ui": "매니저 조언 또는 첫 증축 안내",
    "trigger": "Lv.10; 매니저 영입은 첫 유료 증축 완료 후 별도 이벤트",
    "rewardVisual": "파트너 앨범 카드",
    "audio": "문 종·대화",
    "emotion": "미소",
    "sourceDraftTitle": "함께할 파트너",
    "status": "implemented-review-candidate",
    "pausePolicy": "queue-after-session",
    "economyReward": 0,
    "assetIds": [
      "bg_street_stage_02",
      "cutscene_lv10"
    ],
    "skipPolicy": "mark-viewed-apply-visual",
    "replayPolicy": "album-no-side-effects",
    "direction": "두 번째 장",
    "cutscene": {
      "seconds": 2,
      "kind": "neighbors"
    }
  }
];
export const managers={yuna:{name:'유나',field:'전략·매출·투자 분석',intro:'차근차근 모은 돈으로 더 큰 꿈을 설계해요. 중요한 선택은 사장님이 해요.'},hajun:{name:'하준',field:'직원·손님·서비스',intro:'손님과 직원의 이야기에 귀 기울일게요. 함께 편안한 카페를 만들어요.'},soi:{name:'소이',field:'메뉴·인테리어·브랜드',intro:'새 공간에 우리만의 색을 담아요. 사장님의 아이디어를 함께 키워요!'}};
export const managerScene={id:'story_manager_arrival',level:0,title:'우리 카페에 매니저가 찾아왔어요!',chapter:2,trigger:'첫 유료 증축 공사 완료·실제 영입 상태 관찰',economyReward:0,dialogue:[{speaker:'윤정',text:'공사를 마친 새 공간에 함께할 파트너들이 찾아왔구나. 선택은 네가 직접 하는 거란다.',character:'yoonjeong',emotion:'happy',side:'left',camera:'cafe'},...Object.entries(managers).map(([id,m])=>({speaker:m.name,text:m.intro,character:id,emotion:'neutral',side:id==='hajun'?'left':'right',camera:'cafe'})),{speaker:'윤정',text:'지금 결정하지 않아도 괜찮아. 기존 매니저 영입 화면에서 선택하거나 나중으로 미룰 수 있단다.',character:'yoonjeong',emotion:'neutral',side:'left',camera:'wide'}]};
export function sceneVariant(scene,o={}){const s=structuredClone(scene);if(s.level===6&&o.space>1){s.dialogue[0].text='돈을 모아 넓힌 공간이 생겼구나. 수고했어!';s.dialogue[1].text='이미 마련한 자리를 살펴보고 손님과 직원이 편하게 다닐 길을 남겨 두렴.';s.dialogue[2].text='다음 증축도 필요할 때 직접 결정하면 된단다.';}if(s.level===7&&o.branch){const name={garden:'정원',bakery:'베이커리',dessert:'디저트'}[o.branch];s.dialogue[1].text='네가 고른 '+name+' 카페의 색깔이 보이는구나.';s.dialogue[2].text=o.branchActive?'선택한 분위기를 살리면서 네 방식대로 가꾸어 보렴.':'선택은 저장되었어. 기존 손님과 서빙이 끝나면 안전하게 바뀔 거란다.';}if(s.level===10&&!managers[o.manager])s.dialogue=s.dialogue.map((d,i)=>({...d,speaker:'윤정',text:['혼자 모든 일을 하지 않아도 괜찮단다.','함께할 사람이 생기면 카페도 더 멀리 갈 수 있지.','우리 동네를 더 따뜻하게 만들어 보자꾸나.'][i]}));if([9,10].includes(s.level)&&managers[o.manager]){const m=managers[o.manager];s.dialogue=s.dialogue.map(d=>({...d,speaker:m.name,character:o.manager,emotion:s.level===9?'worried':'neutral',side:'right'}));if(s.level===9){s.dialogue[0].text={yuna:'바쁜 날일수록 매출만 보지 말고 재고와 투자 여력을 함께 살펴요.',hajun:'손님이 기다리는 곳과 직원의 이동 길을 함께 살펴볼까요?',soi:'메뉴 재고와 공간의 분위기를 함께 살펴보면 우리 카페의 색이 살아나요.'}[o.manager];}if(s.level===9){s.dialogue[1].text={yuna:'재고와 직원 비용을 확인하고 다음 투자를 함께 비교해 봐요.',hajun:'직원이 지나갈 길과 손님 대기를 함께 점검해 봐요.',soi:'메뉴가 품절되기 전에 진열과 재고를 함께 살펴봐요.'}[o.manager];s.dialogue[2].text='문제를 풀어 음식을 생산하고, 필요한 운영은 사장님이 직접 결정해 주세요.';}if(s.level===10)s.dialogue[1].text={yuna:'다음 투자는 비용을 확인하고 사장님이 직접 결정해요.',hajun:'손님과 직원이 편안한 카페를 함께 만들어 가요.',soi:'우리만의 메뉴와 공간으로 골목에 따뜻한 인상을 남겨요.'}[o.manager];}return s;}
