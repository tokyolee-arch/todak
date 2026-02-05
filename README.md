# TODAK - 부모님과의 소통을 돕는 AI 비서

Next.js + Supabase 기반 모바일 웹 애플리케이션

## 기술 스택

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS**
- **shadcn/ui** (button, card, input, dialog, select, tabs, badge, avatar, toast)
- **Supabase** (Auth, Database, Storage)
- **Zustand** (상태 관리)
- **date-fns**, **lucide-react**

## 프로젝트 구조

```
src/
├── app/              # 페이지 (홈, onboarding, call, history, settings)
├── components/       # ui, common, features (home, call, history)
├── lib/
│   ├── supabase/     # client.ts, types.ts
│   ├── store/        # authStore, parentsStore, conversationsStore
│   ├── ai/           # analyzeConversation.ts
│   └── utils.ts
├── types/            # index.ts
└── styles/           # globals.css

supabase/migrations/  # 001_initial_schema.sql
```

## 시작하기

1. **의존성 설치**

   ```bash
   npm install
   ```

2. **환경 변수**

   ```bash
   cp .env.local.example .env.local
   ```

   Supabase 대시보드에서 URL, anon key, service role key를 복사해 `.env.local`에 넣습니다.

3. **개발 서버 실행**

   ```bash
   npm run dev
   ```

   [http://localhost:3000](http://localhost:3000) 에서 확인

## 실행 후 확인 사항

1. `npm run dev` 실행 시 Next.js 앱이 정상 작동
2. Tailwind CSS 스타일 적용 (TODAK 브랜드 컬러: brown, beige, green, cream, orange)
3. shadcn/ui 컴포넌트 사용 가능 (홈의 «시작하기» 버튼 등)
4. Supabase 연결 준비 완료 (환경 변수만 설정하면 사용 가능)

## 디자인

- TODAK 브랜드 컬러, 18px/24px/32px 폰트 크기
- 모바일 최적화, 48px 터치 영역

# todak
