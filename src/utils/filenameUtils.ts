// 处理复制文件冲突添加_link覆盖后缀的问题
export const buildLinkName = (oldPath: string, suffix: string, isFile: boolean): string => {
  if (!isFile) return oldPath + suffix;

  const lastDot = oldPath.lastIndexOf(".");
  if (lastDot === -1) return oldPath + suffix;

  const name = oldPath.slice(0, lastDot);
  const ext = oldPath.slice(lastDot);
  return name + suffix + ext;
};

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  } else if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  } else if (bytes >= 1024) {
    return (bytes / 1024).toFixed(2) + " KB";
  }
  return bytes + " B";
};

// 处理路径长度，超出宽度时截断并加省略号
export const shortenByWidth = (text: string, maxWidth: number, font = "16px sans-serif"): string => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  context.font = font;

  if (context.measureText(text).width <= maxWidth) return text;

  let start = 0;
  let end = text.length;
  const ratio = 0.25;

  while (start < end) {
    const mid = Math.floor((start + end) / 2);
    const leftLen = Math.floor(mid * ratio);
    const rightLen = mid - leftLen;

    const left = text.substring(0, leftLen);
    const right = text.substring(text.length - rightLen);

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
};
