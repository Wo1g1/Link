# Link

링크 / 일정 / 알림 세 탭으로 구성된 정적 페이지. 서버 없이 GitHub Pages로 동작한다.

## 수정 방법

`data/` 폴더의 JSON 파일만 고치고 커밋하면 1~2분 뒤 반영된다. 이 레포는 퍼블릭이라 파일 내용은 누구나 볼 수 있다.

- `data/links.json`: 항목마다 `label`, `icon`(`instagram`/`naver`/`gmail`), `type`을 적는다.
  - `type: "url"`: `url`(http/https만 허용). 누르면 "이동하시겠습니까?" 확인 후 새 창으로 열린다.
  - `type: "email"`: `emails` 배열에 `{ "label": "설명", "address": "주소" }`를 원하는 만큼 넣는다. 누르면 모달에 주소 목록과 복사 버튼이 뜬다.
  - 아이콘은 `js/icons.js`에 있다.
- `data/events.json`: `date`(YYYY-MM-DD), `title`, 선택 항목 `time`(시간 표시 문구), `memo`, `endDate`(여러 날 일정), `place`(장소명 또는 주소. 넣으면 그 일정 아래에 구글맵 지도가 표시된다)
- `data/holidays.json`: `date`(YYYY-MM-DD), `name`. 공휴일은 달력에서 날짜가 빨간색으로 표시되고, 날짜를 누르면 이름이 나온다. 현재 2026년 8월 ~ 2027년 2월까지 들어 있다.
- `data/notices.json`: `date`(YYYY-MM-DD), `title`, `body`. 최신순으로 제목만 표시되고, 누르면 모달에 내용(`body`)과 날짜가 나온다. 줄바꿈은 `\n`으로 쓴다.

달력의 년도 선택 범위는 올해 기준 -5년 ~ +10년이고, 일정이 그 밖에 있으면 자동으로 넓어진다.

JSON은 마지막 항목 뒤에 쉼표를 두면 안 된다.

## 로컬 확인

`fetch`로 데이터를 읽기 때문에 파일을 직접 열면 안 되고 서버가 필요하다.

```
python3 -m http.server 8000
```

## 배포

GitHub 저장소 Settings > Pages에서 배포할 브랜치와 `/ (root)`를 지정한다.
