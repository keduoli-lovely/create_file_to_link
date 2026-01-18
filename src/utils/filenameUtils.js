// utils/filenameUtils.js

// 处理复制文件冲突添加_link覆盖后缀的问题
export const buildLinkName = (oldPath, suffix, isFile) => {
  if (!isFile) return oldPath + suffix;

  const lastDot = oldPath.lastIndexOf(".");
  if (lastDot === -1) return oldPath + suffix;

  const name = oldPath.slice(0, lastDot);
  const ext = oldPath.slice(lastDot);
  return name + suffix + ext;
};

// 处理路径长度，超出宽度时截断并加省略号
export const shortenByWidth = (text, maxWidth, font) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = font;

  if (context.measureText(text).width <= maxWidth) return text;

  let start = 0;
  let end = text.length;
  const ratio = 0.25;

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
};
