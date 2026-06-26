import { listen } from "@tauri-apps/api/event";
import { storeToRefs } from "pinia";
import { useProgressStore } from "@/stores/useProgressStore";
import { get_config_default } from "@/config";
import type { FileProgressPayload, UnlistenFn } from "@/types";

export function useProgress() {
  const { update_time } = get_config_default();
  let lastUpdate = 0;
  const ProgressStore = useProgressStore();
  const { progress, currentFile } = storeToRefs(ProgressStore);

  let unlistenProgress: UnlistenFn | null = null;

  async function listen_Progress(): Promise<UnlistenFn> {
    unlistenProgress = await listen<FileProgressPayload>("file-progress", (event) => {
      const now = Date.now();
      if (now - lastUpdate > update_time) {
        progress.value = event.payload.percent;
        currentFile.value = event.payload.src;
        lastUpdate = now;
        console.log(
          `文件 ${event.payload.src} 进度: ${event.payload.percent}%`,
        );
      }
    });
    return unlistenProgress;
  }

  // Return cleanup function that composes can use to unregister
  const cleanup = (): void => {
    if (unlistenProgress) {
      unlistenProgress();
      unlistenProgress = null;
    }
  };

  return {
    listen_Progress,
    cleanup,
  };
}
