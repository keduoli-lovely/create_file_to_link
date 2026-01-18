import { ref, computed } from "vue";
import { defineStore, storeToRefs } from "pinia";
import { useConfigStore } from "@/stores/useConfigStore";

export const useHistoryStore = defineStore("HistoryStore", () => {
  const { config_res } = storeToRefs(useConfigStore());
  const Temporary_history_list = ref([]); // 当前进度的数据
  const Temporary_history_list_sta = ref(false); // 当前迁移数据的显示与隐藏

  // 清空历史记录是否可用
  const clear_history_btn_disabled = computed(() => {
    return (
      Temporary_history_list.value.length === 0 &&
      (config_res.value?.history_list?.length ?? 0) === 0 &&
      Temporary_history_list_sta.value === false
    );
  });
  // 记录上一次打开的目录
  let lastOpenedDir = ref(null);

  return {
    Temporary_history_list,
    Temporary_history_list_sta,
    clear_history_btn_disabled,
    lastOpenedDir,
  };
});
