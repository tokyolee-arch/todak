// Notifications Cron: 주기 실행으로 알림 대상 조회 후 notifications 테이블에 삽입
// 호출 방법:
// 1) Supabase Dashboard → Database → Extensions → pg_cron, pg_net 활성화
// 2) SQL Editor에서 예시 (매일 19:00 KST = 10:00 UTC):
//    select cron.schedule('notifications-daily', '0 10 * * *', $$
//      select net.http_post(
//        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notifications-cron',
//        headers := '{"Content-Type":"application/json","Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
//        body := '{}'::jsonb,
//        timeout_milliseconds := 30000
//      ) as request_id;
//    $$);

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors() });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const toInsert: Array<{
      user_id: string;
      parent_id: string | null;
      action_id: string | null;
      type: "action_due" | "call_incomplete" | "periodic" | "event_trigger";
      title: string;
      message: string;
      scheduled_for: string;
    }> = [];

    // 이미 오늘 생성된 알림 (중복 방지)
    const { data: existing } = await supabase
      .from("notifications")
      .select("user_id, action_id, parent_id, type")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const existingSet = new Set(
      (existing ?? []).map(
        (n) => `${n.user_id}:${n.action_id ?? ""}:${n.parent_id ?? ""}:${n.type}`
      )
    );

    // 사용자별 설정 조회 (user_settings + parents로 user_id 목록)
    const { data: settingsRows } = await supabase
      .from("user_settings")
      .select("user_id, notification_action_due, notification_call_incomplete, notification_periodic");

    const settings = new Map(
      (settingsRows ?? []).map((s: { user_id: string; notification_action_due: boolean; notification_call_incomplete: boolean; notification_periodic: boolean }) => [
        s.user_id,
        {
          actionDue: s.notification_action_due ?? true,
          callIncomplete: s.notification_call_incomplete ?? true,
          periodic: s.notification_periodic ?? true,
        },
      ])
    );

    // 부모님 목록 (user_id별)
    const { data: parentsRows } = await supabase
      .from("parents")
      .select("id, user_id, name");

    const parentsByUser = new Map<string, Array<{ id: string; name: string }>>();
    for (const p of parentsRows ?? []) {
      const list = parentsByUser.get(p.user_id) ?? [];
      list.push({ id: p.id, name: p.name });
      parentsByUser.set(p.user_id, list);
    }

    // 1) 액션 마감 알림: due_date <= 오늘, completed = false
    const { data: overdueActions } = await supabase
      .from("actions")
      .select("id, parent_id, topic, due_date")
      .eq("completed", false)
      .lte("due_date", today);

    for (const a of overdueActions ?? []) {
      const parent = (parentsRows ?? []).find((p: { id: string }) => p.id === a.parent_id);
      if (!parent) continue;
      const opts = settings.get(parent.user_id);
      if (!opts?.actionDue) continue;
      const key = `${parent.user_id}:${a.id}::action_due`;
      if (existingSet.has(key)) continue;
      const parentList = parentsByUser.get(parent.user_id);
      const parentName = parentList?.find((x) => x.id === a.parent_id)?.name ?? "부모님";
      toInsert.push({
        user_id: parent.user_id,
        parent_id: a.parent_id,
        action_id: a.id,
        type: "action_due",
        title: "할 일 알림",
        message: `${parentName} 관련: ${a.topic} (마감일: ${a.due_date})`,
        scheduled_for: new Date().toISOString(),
      });
      existingSet.add(key);
    }

    // 2) 미완료 통화 알림: started_at 있음, ended_at 없음, 1시간 이상 경과
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: incompleteConvs } = await supabase
      .from("conversations")
      .select("id, parent_id, started_at")
      .is("ended_at", null)
      .lt("started_at", oneHourAgo);

    for (const c of incompleteConvs ?? []) {
      const parent = (parentsRows ?? []).find((p: { id: string }) => p.id === c.parent_id);
      if (!parent) continue;
      const opts = settings.get(parent.user_id);
      if (!opts?.callIncomplete) continue;
      const key = `${parent.user_id}::${c.parent_id}:call_incomplete`;
      if (existingSet.has(key)) continue;
      const parentName = parentsByUser.get(parent.user_id)?.find((x) => x.id === c.parent_id)?.name ?? "부모님";
      toInsert.push({
        user_id: parent.user_id,
        parent_id: c.parent_id,
        action_id: null,
        type: "call_incomplete",
        title: "통화 미완료",
        message: `${parentName}와(과)의 통화가 기록되지 않았어요. 통화를 마쳤다면 앱에서 완료 처리해 주세요.`,
        scheduled_for: new Date().toISOString(),
      });
      existingSet.add(key);
    }

    // 3) 주기 연락 알림: 마지막 대화가 min_contact_interval_days 초과
    const { data: parentsWithInterval } = await supabase
      .from("parents")
      .select("id, user_id, name, min_contact_interval_days");

    for (const p of parentsWithInterval ?? []) {
      const opts = settings.get(p.user_id);
      if (!opts?.periodic) continue;
      const key = `${p.user_id}:${p.id}:periodic`;
      if (existingSet.has(key)) continue;

      const { data: lastConv } = await supabase
        .from("conversations")
        .select("ended_at")
        .eq("parent_id", p.id)
        .not("ended_at", "is", null)
        .order("ended_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastEnd = lastConv?.ended_at ? new Date(lastConv.ended_at) : null;
      const intervalDays = p.min_contact_interval_days ?? 14;
      const dueDate = lastEnd
        ? new Date(lastEnd.getTime() + intervalDays * 24 * 60 * 60 * 1000)
        : new Date(0);
      if (dueDate > new Date()) continue; // 아직 연락 주기 전

      toInsert.push({
        user_id: p.user_id,
        parent_id: p.id,
        action_id: null,
        type: "periodic",
        title: "연락해 보세요",
        message: `${p.name}님과 ${lastEnd ? "마지막 연락 후 " + intervalDays + "일이 지났어요." : "아직 연락 기록이 없어요."}`,
        scheduled_for: new Date().toISOString(),
      });
      existingSet.add(key);
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from("notifications").insert(
        toInsert.map((row) => ({
          ...row,
          sent_at: new Date().toISOString(),
        }))
      );
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ ok: true, inserted: toInsert.length }),
      { status: 200, headers: { ...cors(), "Content-Type": "application/json" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...cors(), "Content-Type": "application/json" } }
    );
  }
});

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}
