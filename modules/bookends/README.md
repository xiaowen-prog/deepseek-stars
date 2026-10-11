# Codex 开头与结尾 · 已接入版本

基线：Grokbot d07894f，2026-10-11。修改集中在 modules/bookends/，index.html 和 src/main.js 有最小接入变更。未修改 src/data.js、src/objects.js 或中段视觉参数。

## 运行

在 deepseek-story 目录运行 `python3 -m http.server 4180 --bind 127.0.0.1`，访问 http://127.0.0.1:4180/ 。本地 vendored Three.js 和 GSAP，无 npm 安装。字体仍有在线加载，可使用 CSS 后备字体。

- `?replay`：本次强制播放开场。
- `?skip`：直接进入故事。
- `?t=2.8`：固定开屏编排进度到穿越阶段（粒子仍运动），便于视觉检查。
- `?t=4.6`：检查鲸轮廓。
- 常规进入播放约 6.2 秒，sessionStorage 记忆完成状态。

## 交付

0101 闪烁光标、深度读数、加速光轨、粒子鲸轮廓、首页标题、重播；第十二幕自动聚合鲸、向远处游离；终章统一 slogan 和行动入口，增加重新探索。

## 接口

createOpening(host)、createEnding(host)。host: renderer、positions（鲸点云数组）、quality、mount（opening DOM）、onComplete。

Opening: prepare / play(time) / skip / active / update({time}) / renderIdle(time) / resize({width,height}) / dispose。
Ending: prepare / setProgress(0..1) / update({time}) / resize / dispose。

宿主 GSAP ticker 是唯一帧调度；沿用唯一 renderer。模块有独立 scene/camera，宿主按当前范围选择直接渲染模块或 composer，不更改 renderer 曝光和色彩配置。没有独立帧循环，无新依赖。

接入范围：开屏 active 时渲染 opening；故事 seg<0.35 保留弱鲸背景；seg>=11.85 切换 ending，进度=(seg-11.85)/3.15；中段原 composer 保留。第十二幕事实卡片仍由宿主提供。

## Grokbot 集成注意

不要重新覆盖 main.js 的 bookends import、tick 渲染选择和底部 adapter。不要整份回写旧 main.js；把中段变化合并到当前基线。重播先复位宿主滚动与 smoothP，再调用 opening.play 当前时钟；结束由 onComplete 唯一出口解锁。页面隐藏暂停动画时钟。

默认首页文案“机器，能思考吗？”仍待用户最后定稿；config.js 供最终调整，HTML 应同步。结尾文案已改为“探索未知之境”。

## 限制

此版是原创光轨实现，未直接移植 InfiniteTubes shader；主要还原穿越、加减速和粒子显形的节奏。开场鲸来自已有平面标志点云，非真实游动鲸 3D 模型。结尾沿用宿主三个停留节点，下一轮可在用户看过后合并为更短收束。中段导航 hash、整站音频以及中段交互由 Grokbot 继续维护。未测设备帧率，不声明 60fps 达标。


## 实际验证记录（2026-10-11）

- 桌面浏览器：穿越阶段、鲸轮廓、自然结束、2025 章节、slogan、最终行动入口均实际观察。
- 390×844 浏览器视口：开屏、首页、终章、重新探索已实际运行；这不是手机实机性能测试。
- 已观察的版本控制台没有 error/warn；所有新模块与宿主通过 Node 语法检查，git diff --check 通过。
- 修改过鲸尺寸/形体亮度与长按进度后，重新检查终章接入。减少动态效果、WebGL 失败有代码降级，但未模拟相关浏览器条件；帧率与低性能设备未测。
- qa/ 保存桌面穿越与 slogan 截图。冻结开屏参数只冻结编排阶段，光轨仍在运动。

声音未新增，沿用宿主后续统一接入；没有发布或覆盖线上版本。
