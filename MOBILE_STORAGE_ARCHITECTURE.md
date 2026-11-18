# 햇살마을 모바일 저장 구조 — IndexedDB 전환

## 원인과 기존 검증의 한계
build20261118-4는 카페·스토리·플레이어·학습 기록을 전용 접두어로 localStorage에 저장했다. 무손실 압축은 적용되어 있었지만 localStorage는 GitHub Pages URL 경로별이 아니라 같은 출처의 모든 프로젝트가 약5MiB 제한을 공유한다. 새 카페 checkpoint가4KB 정도로 줄어도 남은 공간이 없으면 쓸 수 없다.

지난 검증은 약40KB 여유가 남은 조건까지 확인했으며 완전히 가득 찬 경우를 해결하지 못했다. 이번에는 실제 native localStorage를 채워 한 글자의 새 키 쓰기도 QuotaExceededError가 되는 조건에서 build4를 다시 실행했다. 기존 플레이어와 프롤로그가 있는 상태의 iframe 신규 카페 시작에서 STORAGE_FULL을 재현했다. 다른 게임 데이터는 합성 sentinel이며 학생 데이터는 사용하지 않았다.

## 새로운 영구 저장
- 데이터베이스: sunshine-independent-test-v1/durable-storage
- IndexedDB 버전1 / object store state
- current: sunshine-idb-snapshot/1, schemaVersion1, revision, rows, SHA-256
- previous: 직전 확정 snapshot
- migration: 기존 원본의 SHA-256/키 수/이전 완료 시각/원본 보존 여부

rows는 기존 전용 namespace의 키·무손실 값이다. 카페 schemaVersion1, 이야기 version1, 플레이어 UUID, 기존 JSON 백업 format은 변경하지 않는다. 카페·스토리·플레이어·해당 프로필의 학습 기록이 같은 snapshot에 담긴다. current/previous/migration은 한 IDB readwrite 트랜잭션에서 갱신하며 oncomplete와 readback 검증 뒤에만 확정한다. 카페 createdAt와 플레이어 UUID/lastLevel, 이야기 profile/해금 순서를 확인한다.

기존 양립하는 동기식 게임 API는 공유 메모리 facade로 연결한다. 이 메모리는 영구 저장이 아니다. setItem이라는 이름이 남아 있어도 실제 native localStorage에 쓰지 않는다. 부모와 iframe은 같은 broker를 사용하므로 각자 다른 캐시를 쓰지 않는다. native Storage.prototype을 사용하는 공급 모듈도 같은 facade로 연결한다.

변경은 한 JS turn 안에서 합쳐지고 직렬 IDB 저장 queue로 처리된다. 저장 중에는 상위/iframe 모두 입력과 게임 진행을 차단하고 ‘저장 확인 중’을 표시한다. 첫 영업은 확정 저장을 await한 뒤에만 표시한다. 이야기 완료/통합 백업/복원/명시적인 저장 후 나가기도 확정 완료를 기다린다. 실패하면 기존 정상 DB record를 유지하고 플레이를 멈추며 재시도 또는 마지막 정상 저장을 다시 여는 선택지를 제공한다.

## 이전
앱 소유권 lock을 먼저 확보한다. DB current가 없을 때만 원래 namespace의 localStorage를 읽는다. 전체 값의 codec/필수 구조/프로필을 검증하고 IDB에 복제한 뒤 SHA-256 및 재읽기를 확인한다. 이미 유효한 current가 있으면 오래된 localStorage를 다시 가져와 새 진행을 덮어쓰지 않는다. 기존 localStorage는 자동 삭제·축소·변경하지 않는다. 다른 게임/School Quest 키도 건드리지 않는다.

createdAt가 아직 null인 기존 플레이어는 같은 namespace의 유일한 정상 카페와 연결할 수 있다. 서로 다른 non-null 카페·플레이어 또는 다른 UUID의 스토리는 자동 병합하지 않고 거부한다. 잘못된/지원하지 않는 구형 데이터는 원본을 보존하고 경고한다.

## 저장 보호와 복원
revision 비교로 오래된 writer를 거부한다. checksum/codec/스키마/프로필 검증 실패는 새 Lv1 데이터로 대체하지 않는다. current 손상 시 자동으로 이전 시점으로 돌아가지 않으며, 사용자 확인 뒤 검증된 previous를 새 트랜잭션으로 복구한다. 손상된 원본 record도 previous에 남는다.

통합 JSON 복원은 inspect/파일 SHA·스키마·프로필 확인/사용자 확인 이후 메모리 batch에 적용한다. 성공하면 전체 snapshot을 한 트랜잭션으로 확정한다. 중간 예외·abort에서는 이전 map과 DB가 유지된다. commit 뒤 readback 실패 같은 결과 미확정 상태는 성공으로 안내하지 않고 rollback/보존 상태를 명시한다.

기존 localStorage 기반 journal을 읽는 함수는 호환을 위해 남아 있지만 새 복원은 IDB 원자적 batch이므로 journal 안에 전체 저장을 다시 중복 기록하지 않는다. 동일한 값의 재쓰기와 없는 키 삭제는 저장을 만들지 않는다. previous만 한 개 유지하며 무한한 snapshot 목록을 만들지 않는다. 기존 게임의 필요한 학습 아카이브/보호 사본은 임의 삭제하지 않는다.

## 종료와 재접속
정상 플레이 중 checkpoint를 미리 저장한다. pagehide 시 flush는 보조 시도이며 브라우저 강제 종료에서 비동기 완료를 보장하지 않는다. 성공이라고 표시한 마지막 confirmed snapshot은 원자적으로 보존된다. 미완료 쓰기는 이전 confirmed 상태로 재접속한다. 명시적인 ‘저장하고 나가기’는 flush 완료 뒤 이동한다.

sessionStorage는 전용 prefix로 구분하여 가능한 경우 원래 세션 저장에 반영하고, 접근 불가일 때 비영구 UI 메모리로 대체한다. 카페·학습·스토리 핵심 영구 상태는 sessionStorage 성공에 의존하지 않는다.

## 오류
- localStorage가 완전히 참: native 쓰기를 하지 않으므로 IDB 정상 저장으로 진행
- IndexedDB quota: INDEXEDDB_FULL, 이전 정상 저장 유지, 영업 차단
- SecurityError: STORAGE_BLOCKED
- abort: STORAGE_ABORTED 또는 STORAGE_INTERRUPTED
- 체크섬/codec 손상: STORAGE_DAMAGED
- 스키마/프로필/경합: 구분된 STORAGE_SCHEMA/PROFILE/CONFLICT
- 확인 불가: STORAGE_UNCONFIRMED, 저장 성공으로 처리하지 않음

## 변하지 않은 부분
경제/레벨/구매/생산량/은행 문항/스토리·컷신·사진·엔딩 정책은 변경하지 않았다. 기존 RC2 원본755파일, 공식 카페, Mega RC1, School Quest, 다른 게임의 배포·데이터는 별도다. QB3 격리 최적화 프로젝트의 변경을 이 테스트판에 섞지 않았다.

## 한계
실제 갤럭시 Android Chrome은 직접 사용하지 않았다. Chromium 모바일 emulation과 실제 native localStorage quota로 검증한다. IndexedDB 자체가 차단되거나 출처 저장 공간/디스크까지 모두 부족하면 안전하게 중단한다. 브라우저가 사이트 데이터를 지우면 IndexedDB도 지워질 수 있으므로 JSON 통합 백업이 계속 필요하다.

기존 build4는 새 IndexedDB 진행을 읽지 못한다. 롤백 시 IDB 호환 reader를 유지한 역패치 또는 유효한 통합 JSON이 필요하며, 구버전으로 단순 전체 복귀하면 오래된 localStorage 화면이 보일 수 있다. 기존 데이터 삭제로 해결하지 않는다.
