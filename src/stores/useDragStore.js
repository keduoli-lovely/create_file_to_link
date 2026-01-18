// stores/useDragStore.js
import { ref } from "vue";
import { defineStore } from "pinia";

export const useDragStore = defineStore("DragStore", () => {
  // 拖拽文件动画
  const drag_file_show = ref(false);
  const drag_loding_show = ref(true);
  // 拖拽冲突提示
  const drag_error = ref(false);
  const drag_fileList_data = ref(null);
  const drag_fileMerge = ref(false);

  return {
    drag_file_show,
    drag_loding_show,
    drag_error,
    drag_fileList_data,
    drag_fileMerge,
  };
});
