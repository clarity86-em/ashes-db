# Ashes DB

넷러너DB처럼 카드 목록과 덱을 나란히 보며 편집하는 개인용 애쉬즈 덱 빌더입니다. 한국어 UI와 영문 카드 데이터를 사용합니다. 별도 서버·계정·데이터베이스 없이 GitHub Pages에서 실행됩니다.

## 기능

- 이름·효과 검색, 마법·종류·확장·보유 확장·전용 카드 호환 필터
- 카드 이미지와 규칙 텍스트 상세 보기
- 0/1/2/3 수량 버튼, 덱 종류별 목록, 덱 이름·메모 편집
- 피닉스본 변경, 주사위 10개 구성, First Five 선택
- 30장 / 3장 제한 / 전용 카드 합계·호환 / First Five 기본 검사
- 대전 모드에서 데이터에 기록된 Chained 카드 확인
- 관련 소환물 목록 자동 생성 (소환물은 30장에 포함하지 않음)
- 실제 기본 덱 60개 불러오기 (Red Rains 포함)
- 여러 덱 자동 저장·복제·삭제, JSON 백업/가져오기, 텍스트 내보내기
- 반응형 모바일 UI, 키보드 검색 단축키 `/`

## 실행

Node.js 22 이상:

```sh
npm ci
npm run dev
```

`http://localhost:5173`에서 열 수 있습니다. 브라우저가 ES modules와 데이터 파일을 읽어야 하므로 index.html을 file://로 직접 열면 안 됩니다. 앱 자체에는 런타임 npm 의존성이 없습니다.

```sh
npm test
npm run build
```

미리보기용 단일 HTML 파일은 `node scripts/standalone.mjs`로 생성합니다. 상위 폴더의 `Ashes_DB.html`을 직접 열면 됩니다. 카드 데이터는 내장되고, 이미지·폰트는 인터넷 연결을 사용합니다.

`dist/`를 어떤 정적 웹 호스팅에도 올릴 수 있습니다. 하위 경로 배포를 지원합니다.

## GitHub Pages

1. GitHub에서 `ashes-db` 저장소를 만듭니다.
2. 이 프로젝트를 `main` 브랜치에 올립니다.
3. 저장소 Settings → Pages → Source를 **GitHub Actions**로 설정합니다.
4. Actions의 **Check and deploy GitHub Pages**를 실행합니다. 이후 main에 push할 때 자동 배포됩니다.

예상 주소는 `https://clarity86-em.github.io/ashes-db/`이며, 실제 배포 전에는 이 URL이 활성화되지 않습니다. 다른 이름/계정에 올리면 주소도 달라집니다.

## 저장 방식

덱은 현재 기기·브라우저·도메인의 localStorage에만 저장됩니다. JSON 백업으로 기기 간 이동할 수 있습니다. 로그인, 클라우드 동기화, 공개 덱 게시판, 추천/댓글 기능은 이 버전에 포함하지 않습니다. HTTP localhost와 실제 Pages 도메인은 저장 공간이 서로 다릅니다.

손상된 저장 데이터는 자동 덮어쓰지 않고 원본 다운로드를 안내합니다. 이후 사용자가 편집하면 현재 화면의 덱 상태로 저장됩니다.

## 카드 데이터

`data/meta.json`에 기록된 Ashteki 커밋의 스냅샷입니다. 기본 Reborn/Ascendancy 데이터와 Natural Magic 확장 카드가 들어 있습니다. 미출시/지원하지 않는 데이터 파일을 자동으로 합치지 않습니다. 업데이트 후에는 달라진 카드와 규칙을 검토하세요.

```sh
npm run update-data              # 기록된 커밋으로 재생성
npm run update-data -- --latest  # upstream master에서 의도적으로 갱신
npm test
```

- 일부 소스 카드에 효과 텍스트가 없습니다. 원문 링크와 카드 이미지를 제공합니다.
- 4개 End of Argaia 기본 덱은 소스에 First Five가 없어서 사용자가 직접 선택해야 합니다.
- 소환물 개수는 데이터의 copies/연결 관계 기준입니다. 텍스트에만 있는 특수 소환 관계는 직접 확인하세요.
- 전체 대회 금지/제한/로테이션, 특수 포맷과 플레이어별 예외, First Five의 주사위 지불 가능성까지 판정하지 않습니다.
- 카드 이미지는 외부 CDN에서 불러옵니다. 오프라인에서는 텍스트 데이터와 덱 편집은 가능하지만 이미지·외부 폰트는 보장하지 않습니다.

## 개발 구조

- `src/core.js`: 검색·덱 모델·검사·입출력 (DOM과 분리)
- `src/app.js`: 브라우저 UI와 저장
- `src/styles.css`: 반응형 UI
- `test/`: 덱 규칙·가져오기 안전성·DOM 인터랙션 검사
- `scripts/`: 개발 서버, 빌드, 데이터 갱신

## 라이선스

AGPL-3.0-or-later. 카드·일러스트의 권리는 별도이며 Plaid Hat Games에 있습니다. [THIRD_PARTY.md](THIRD_PARTY.md)를 확인하세요.
