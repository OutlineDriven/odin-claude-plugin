# Plain Korean: 출처와 적용 범위

확인일: 2026-09-05.

## 근거 자료

### Plain English Campaign

[Free guides](https://www.plainenglish.co.uk/free-guides)의
*How to write in plain English*를 확인했다.
독자에게 맞는 말과 구성, 명료한 행동 표현을 참고했다.
가이드 원문, 예문, 대체 어휘 목록은 이 패키지에 복제하지 않았다.

### Digital.gov

[Writing for understanding](https://digital.gov/guides/plain-language/writing)은
주체와 행동이 드러나는 글쓰기를 다룬다.
[Test for understanding](https://digital.gov/guides/plain-language/test)은
실제 독자의 이해를 시험하는 방법을 다룬다.
이 스킬의 자체 점검을 실제 독자 시험과 구분했다.

### Australian Government Style Manual

[Plain language and word choice](https://www.stylemanual.gov.au/writing-and-designing-content/clear-language-and-writing-style/plain-language-and-word-choice)는
익숙한 표현과 필요한 전문 용어의 설명을 다룬다.
쉽게 쓰기와 전문 개념을 없애기를 구분하는 데 참고했다.

### Agent Skills

[Specification](https://agentskills.io/specification)의 디렉터리 구조와
YAML frontmatter 형식을 따른다. 버전 등 추가 정보는 `metadata` 안에 둔다.
구조 검사는 실제 에이전트의 활성화나 출력 품질 검증과 다르다.

## 이 패키지에서 별도로 설계한 것

`PK-` 규칙, 한국어 예문, 작업 모드, 보호 문자열, 미확정 사항 처리,
평가 입력은 이 패키지의 독립적인 구현이다.
영어 가이드 전체를 순서대로 번역하거나 한국어 규범으로 공인한 것이 아니다.

특히 한국어 주어 생략, 조사와 어미, 자연스러운 높임말을 고려했다.
영어의 인칭대명사 사용이나 문장 길이 수치를 그대로 강제하지 않는다.
이 지침의 목적은 한글 전용 순화나 전문 용어 제거가 아니다.

## 사용 시 경계

문체 개선은 사실 확인, 법적 효력 검토, 안전성 검증을 대신하지 않는다.
원문이 잘못되었을 가능성을 발견하면 교정 결과와 별도로 알린다.
출처를 확인하지 않은 사실을 문체 교정 과정에서 몰래 수정하거나 보강하지 않는다.
