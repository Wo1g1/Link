# Link

링크 / 일정 / 알림 세 탭으로 구성된 정적 페이지. 서버 없이 GitHub Pages로 동작한다.

## 수정 방법

`data/` 폴더의 JSON 파일만 고치고 커밋하면 1~2분 뒤 반영된다. 이 레포는 퍼블릭이라 파일 내용은 누구나 볼 수 있다.

- `data/links.json`: `label`(이름), `short`(아이콘 자리 2글자), `url`(http/https만 허용)
- `data/events.json`: `date`(YYYY-MM-DD), `title`, 선택 항목 `memo`, `endDate`(여러 날 일정)
- `data/notices.json`: `date`(YYYY-MM-DD), `title`, `body`. 최신순으로 표시된다. 아직 안 본 알림 개수가 탭에 배지로 뜨고, 알림 탭을 열면 사라진다. 읽음 상태는 방문자 브라우저에만 저장되며, 날짜나 제목이 바뀐 알림은 새 알림으로 취급된다.

달력의 년도 선택 범위는 올해 기준 -5년 ~ +10년이고, 일정이 그 밖에 있으면 자동으로 넓어진다.

JSON은 마지막 항목 뒤에 쉼표를 두면 안 된다.

## 로컬 확인

`fetch`로 데이터를 읽기 때문에 파일을 직접 열면 안 되고 서버가 필요하다.

```
python3 -m http.server 8000
```

## 배포

GitHub 저장소 Settings > Pages에서 배포할 브랜치와 `/ (root)`를 지정한다.
