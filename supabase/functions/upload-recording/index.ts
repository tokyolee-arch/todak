import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { conversationId, audioBlob } = (await req.json()) as {
      conversationId: string;
      audioBlob?: string; // base64 or blob reference
    };

    if (!conversationId) {
      throw new Error("conversationId is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Storage에 녹음 파일 업로드 (base64인 경우 디코드)
    const fileName = `${conversationId}.webm`;
    let body: Uint8Array | string = audioBlob ?? "";

    if (typeof audioBlob === "string" && audioBlob.startsWith("data:")) {
      const base64 = audioBlob.split(",")[1];
      if (base64) {
        body = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      }
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("recordings")
      .upload(fileName, body, {
        contentType: "audio/webm",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    await supabase
      .from("conversations")
      .update({
        recording_url: uploadData.path,
      })
      .eq("id", conversationId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
