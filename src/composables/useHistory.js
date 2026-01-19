import { storeToRefs } from "pinia";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useConfigStore } from "@/stores/useConfigStore";
import { useProgressStore } from "@/stores/useProgressStore";

export function useHistory() {
  const { Temporary_history_list, Temporary_history_list_sta } =
    storeToRefs(useHistoryStore());
  const { config_res } = storeToRefs(useConfigStore());
  const { set_progress_data } = useProgressStore();

  // 清空 Temporary_history_list / config_res.value.history_list
  const clear_history_list = () => {
    console.log("-----------清空记录------------");
    try {
      Temporary_history_list.value.length = 0;
      config_res.value.history_list.length = 0;
      console.log(
        "info: clear over",
        Temporary_history_list.value,
        config_res.value.history_list,
      );
    } catch (error) {
      Temporary_history_list.value = [];
      config_res.value.history_list = [];
      console.log("info: ", error);
    }

    set_progress_data();
    Temporary_history_list_sta.value = false;
  };

  return {
    clear_history_list,
  };
}
