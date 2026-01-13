export const get_config_default = () => {
  // 窗口
  let appWindow = null;
  // 配置文件
  let config_store = null;
  // terminal_icon
  const terminal_icon =
    "M4 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4zm0 2h16v14H4V5zm4.5 3.5a1 1 0 0 0-.7.3a1 1 0 0 0 0 1.4L9.59 12L7.8 13.8a1 1 0 1 0 1.4 1.4l2.5-2.5a1 1 0 0 0 0-1.4l-2.5-2.5a1 1 0 0 0-.7-.3zm4.5 6.5a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-4z";

  // github icon
  const github_icon =
    "M12.001 2c-5.525 0-10 4.475-10 10a9.99 9.99 0 0 0 6.837 9.488c.5.087.688-.213.688-.476c0-.237-.013-1.024-.013-1.862c-2.512.463-3.162-.612-3.362-1.175c-.113-.288-.6-1.175-1.025-1.413c-.35-.187-.85-.65-.013-.662c.788-.013 1.35.725 1.538 1.025c.9 1.512 2.337 1.087 2.912.825c.088-.65.35-1.087.638-1.337c-2.225-.25-4.55-1.113-4.55-4.938c0-1.088.387-1.987 1.025-2.687c-.1-.25-.45-1.275.1-2.65c0 0 .837-.263 2.75 1.024a9.3 9.3 0 0 1 2.5-.337c.85 0 1.7.112 2.5.337c1.913-1.3 2.75-1.024 2.75-1.024c.55 1.375.2 2.4.1 2.65c.637.7 1.025 1.587 1.025 2.687c0 3.838-2.337 4.688-4.562 4.938c.362.312.675.912.675 1.85c0 1.337-.013 2.412-.013 2.75c0 .262.188.574.688.474A10.02 10.02 0 0 0 22 12c0-5.525-4.475-10-10-10";

  // github link
  const github_link = "https://github.com/keduoli-lovely/create_file_to_link";

  //   SpaceSniffer link
  const SpaceSniffer_link =
    "https://www.uderzo.it/main_products/space_sniffer/download.html";

  // 复制 / 剪切完等待时间
  const copy_move_tiem = 500;
  let lastUpdate = 0;
  const update_time = 200;

  // 文件名冲突方案列表
  const options = [
    {
      value: "Option1",
      label: "提示冲突",
    },
    {
      value: "Option2",
      label: "强制覆盖",
    },
  ];
  // 默认配置参数
  const default_config = {
    filter_path: [
      "C:\\Windows",
      "C:\\$Recycle.Bin",
      "C:\\System Volume Information",
      "C:\\Boot",
      "C:\\EFI",
    ],
    nameRe: "Option1",
    is_link: true,
    copy_and_create_link: false,
    copy_link_name: "_link",
    over_open_folder: false,
    dark_sta: false,
    history_list: [
      // progress: 0  进度
      // currentFile: 提示/文件名
      // format: '' 状态 '' 成功， exception 错误
    ],
  };

  // 清空历史记录是否可用
  let clear_history_btn_disabled = null;
  // 记录上一次打开的目录
  let lastOpenedDir = null;

  // 处理复制文件冲突添加_link覆盖后缀的问题
  const buildLinkName = (oldPath, suffix, isFile) => {
    if (!isFile) {
      // 文件夹：直接拼接后缀
      return oldPath + suffix;
    }

    // 文件：插入后缀到扩展名前
    const lastDot = oldPath.lastIndexOf(".");
    if (lastDot === -1) {
      // 没有扩展名
      return oldPath + suffix;
    }

    const name = oldPath.slice(0, lastDot);
    const ext = oldPath.slice(lastDot);
    return name + suffix + ext;
  };

  // 处理路径长度
  function shortenByWidth(text, maxWidth, font) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = font;

    if (context.measureText(text).width <= maxWidth) return text;

    let start = 0;
    let end = text.length;
    const ratio = 0.25; // 省略号位置 总长度的 1/4 处

    while (start < end) {
      let mid = Math.floor((start + end) / 2);

      let leftLen = Math.floor(mid * ratio);
      let rightLen = mid - leftLen;

      let left = text.substring(0, leftLen);
      let right = text.substring(text.length - rightLen);

      if (context.measureText(left + "..." + right).width <= maxWidth) {
        start = mid + 1;
      } else {
        end = mid;
      }
    }

    const finalMid = start - 1;
    const finalLeftLen = Math.floor(finalMid * ratio);
    const finalRightLen = finalMid - finalLeftLen;

    return (
      text.substring(0, finalLeftLen) +
      "..." +
      text.substring(text.length - finalRightLen)
    );
  }

  return {
    appWindow,
    config_store,
    terminal_icon,
    github_icon,
    github_link,
    SpaceSniffer_link,
    copy_move_tiem,
    lastUpdate,
    update_time,
    options,
    default_config,
    clear_history_btn_disabled,
    lastOpenedDir,
    buildLinkName,
    shortenByWidth,
  };
};
