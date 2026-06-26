import { ref } from "vue";
import { defineStore } from "pinia";
import type { FilterResult } from "@/types";

export const useDragStore = defineStore("DragStore", () => {
  // 拖拽文件动画
  const drag_file_show = ref<boolean>(false);
  const drag_loding_show = ref<boolean>(true);
  // 拖拽冲突提示
  const drag_error = ref<boolean>(false);
  const drag_fileList_data = ref<FilterResult | null>(null);
  const drag_fileMerge = ref<boolean>(false);

  return {
    drag_file_show,
    drag_loding_show,
    drag_error,
    drag_fileList_data,
    drag_fileMerge,
  };
});
