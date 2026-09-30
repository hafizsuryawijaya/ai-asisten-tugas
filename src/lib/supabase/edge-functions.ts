import { createClient } from "@/lib/supabase/client";

export async function invokeEdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  const supabase = createClient();

  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  });

  if (error) {
    console.error(`[Edge Function ${functionName} Error]:`, error);
    throw new Error(error.message || `Gagal mengeksekusi fungsi ${functionName}.`);
  }

  if (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string") {
    throw new Error((data as { error: string }).error);
  }

  return data as T;
}
