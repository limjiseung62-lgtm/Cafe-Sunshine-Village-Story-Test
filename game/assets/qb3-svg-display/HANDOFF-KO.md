# 카페 담당 Codex 인수 — QB3 RC1 SVG 표시 수정 후보

원본 RC1 및 CAFE-V32-QB3-PERFORMANCE-20261118은 변경하지 않았습니다. 이 패키지는 **표시 sidecar**이며 문제은행 운영판, 문항 승인 또는 게임 배포를 대체하지 않습니다.

## 적용 순서

1. 최종 ZIP과 manifest의 SHA-256을 FINAL-CHECKPOINT.json으로 확인합니다. 의존 RC1 manifest는 `2947f91645686b9fc3b13bae9aa4c7f26e6180e1c623c91da5f935efe4a361fb`입니다. 성능 최적화 파생 인덱스는 기존 `a23834b755692bf58abca868a595e3c4f67c198f7852bbef3c6b044fd52953a9`를 유지합니다.
2. 게임 담당 저장소의 격리 사본에만 sidecar 디렉터리를 추가합니다. source RC의 행, render.svg, contentHash, renderHash, semanticConditionKey를 덮어쓰지 않습니다. 새 display SVG의 해시는 별도 display-pins.json에 있습니다.
3. 기존 RC 승인 행 검증 후, 표시 직전에 `createSVGDisplayResolver`를 사용합니다. pins 파일은 패키지 manifest의 파일 해시로 먼저 확인합니다. `baseURL`은 패키지 루트입니다. `safeCommonDiagram`에는 게임의 **기존 함수 그대로**를 전달합니다.

```js
const displays = createSVGDisplayResolver({
  pins: verifiedDisplayPins,
  baseURL: new URL('./svg-display/', import.meta.url),
  safeCommonDiagram // 기존 보안 함수
});
// canonical q는 기존 승인 loader가 검증한 원본입니다.
const display = await displays.resolve(q, { signal });
const diagram = compactCommonDiagram(display); // 기존 가벼운 압축도 유지
if (diagram && !safeCommonDiagram(diagram)) throw Error('SVG_DISPLAY_REJECTED');
// diagram만 이미지 표시용 어댑터에 전달. q.render.svg를 교체하지 않음.
```

핀에 없는 ID는 원본을 그대로 반환합니다. 이 동작은 공급 승인이 아닙니다. 기존 문항 승인 가드와 표시 안전 검사를 생략하면 안 됩니다. 대상이 아닌 기존 큰 SVG 8개는 기존 `compactCommonDiagram`으로 계속 처리합니다.

## 최소 변경 지점

- `commonLearningCatalog.ts`: `commonQuestion`에 표시 전용 SVG 인자를 추가하고, 선택 범위 preflight/load 루프의 각 실제 행을 위 resolver로 준비한 다음 기존 안전 검사와 변환을 실행합니다. 기존 검증 불가 문항을 다른 문제로 바꾸지 않습니다.
- `megaEntry.ts`: async 출제 경로의 `commonQuestion` 호출 전에 해당 q의 표시본을 resolve합니다. 원본 조건/학습 기록/보상 처리 순서는 유지합니다.
- `commonCafeResults.ts`: 오답노트 목록, 독립 도전, 문제지 HTML 내보내기의 도형 표시에도 동일 resolver를 사용합니다. renderDiagram에는 표시본을 전달합니다. 학습 결과 PNG의 점수·정답률·오답 상태 데이터는 원본 엔진 값 그대로 사용합니다.
- `renewalTutorialUi.ts`: 승인 문제를 사용하는 연습 화면이 같은 변환기를 호출하면 동일 표시 인자를 사용합니다. 연습 보상 정책은 변경하지 않습니다.
- 저장/재시작 시 표시 캐시는 재생성 가능하지만 canonical 학습 이력은 그대로 복원합니다. 표시본 또는 캐시 인덱스를 중복 판정 키로 사용하지 않습니다.

이는 게임 담당자용 최소 변경 명세입니다. 이번 작업에서는 위 게임 파일 및 카페 성능 최적화본을 실제 수정하지 않았습니다.

## 성능 및 오류 처리

기존 범위별 청크, 동시 2개, 16MiB 직렬화 청크 LRU, 승인 검증 재사용은 그대로 둡니다. 새 resolver는 요청한 SVG만 fetch하고 4MiB 직렬화 표시 캐시를 사용합니다. 초기화 시 SVG 요청은 0건입니다. manifest/핀 메타데이터 로드는 SVG 전수 생성과 다릅니다. `clear()`는 표시 캐시만 비우며 학생 학습 기록을 삭제하지 않습니다.

화면 세대/범위가 바뀌면 기존 AbortSignal을 전달합니다. 파일 없음, 해시 불일치, 보안 검사 실패는 명시적인 표시 준비 실패로 처리하고 임의 후보 전환·무한 재시도·원본 가드 완화를 하지 않습니다.

runtime은 `display-resolver.mjs`와 사전 검증된 display 파일을 사용합니다. `svg-display-compact.mjs`는 같은 결과를 재생성하는 공통 출력 처리 코드이며 시작 시 전체 문제에 실행하지 않습니다. 두 경로를 중복 실행하지 않습니다.

## 남은 게임 담당 검증

교체 후 실제 카페 GROWTH 출제, 오답/쌍둥이/독립2, 저장 파일 재시작, 결과 PNG·문제지 HTML, 로딩 실패 및 보상 중복을 격리 게임에서 확인합니다. 이번 증빙은 전수 실제 브라우저 SVG 렌더와 기존 렌더러/엔진 계약 검사이며 **최신 카페 전체 브라우저 E2E 또는 실물 기기 검사로 표현하지 않습니다.**

롤백은 표시 sidecar 호출과 표시 전용 인자만 이전 상태로 되돌립니다. 원본 RC1과 학습 기록은 보존되므로 문항/저장 데이터 마이그레이션은 필요하지 않습니다. 표시 차단 원인이 재현되면 소리 없이 출제하지 말고 기존 실패 UI를 유지합니다. 공개 배포 및 productionReady 변경은 이번 인수에 포함되지 않습니다.
