# 动作指导云端资源

该目录只用于生成和整理待上传资源，已通过 `project.config.json` 的
`packOptions.ignore` 排除，不会进入微信主包或分包。

上传后保持以下目录结构：

```text
action-guide/
  anatomy/
    male_front.png
    male_back.png
    female_front.png
    female_back.png
  lottie/
    chest-press.json
    ...
  poster/
    chest-press.png
    ...
```

将 CDN 根地址填写到 `utils/config.js` 的
`ACTION_GUIDE_ASSET_BASE_URL`，例如：

```js
const ACTION_GUIDE_ASSET_BASE_URL =
  'https://static.example.edu/campus-fit/action-guide'
```

正式发布前需要在微信公众平台完成两项配置：

1. 将 CDN 域名加入 `request` 合法域名，供 Lottie JSON 加载。
2. 将同一域名加入 `downloadFile` 合法域名，供静态示意图加载。

`anatomy/`、`lottie/` 与 `poster/` 中素材均由项目自主整理或生成，不包含第三方动作图片或动画。
同目录 `poster/*.svg` 是 PNG 的矢量源文件，不上传到运行时路径亦可。
