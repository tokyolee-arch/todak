# Supabase 연결 가이드

`.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 넣었다면, 아래 순서대로 진행하세요.

## 1. 테이블 생성 (마이그레이션)

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택
2. 왼쪽 메뉴 **SQL Editor** 클릭
3. **New query** 선택 후 아래 두 SQL을 **각각** 순서대로 실행

### 1) 초기 스키마

`supabase/migrations/001_initial_schema.sql` 내용 전체를 복사해 SQL Editor에 붙여넣고 **Run** 실행.

### 2) RLS 정책 (로컬/개발용)

`supabase/migrations/003_anon_policies.sql` 내용 전체를 복사해 SQL Editor에 붙여넣고 **Run** 실행.

- 이미 001을 실행한 적이 있다면 001은 건너뛰고 **003만** 실행해도 됩니다.
- 001 실행 시 "relation already exists"가 나오면 테이블이 이미 있는 것이므로 003만 실행하면 됩니다.

---

## 2. Storage 버킷 (녹음 파일용, 선택)

통화 녹음 업로드를 쓰려면:

1. **Storage** → **New bucket**
2. Name: `recordings`
3. Public bucket: **OFF** (비공개 권장)
4. 생성 후 필요하면 해당 버킷에 대한 정책 추가

---

## 3. 로컬에서 앱 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후 **시작하기**를 누르면, 앱이 자동으로 `users` 테이블에 로컬 테스트용 사용자 한 명을 만들고 홈/온보딩이 동작합니다.

---

## 4. 나중에 할 수 있는 것

- **Supabase Auth** 연동: 로그인/회원가입 후 `auth.users`와 `public.users` 동기화, RLS 정책을 `auth.uid()` 기준으로 변경
- **Service Role Key**: Edge Function·Cron·서버 전용 API에서만 사용하고, `.env.local`에 넣은 값은 클라이언트에 노출되지 않도록 유지
