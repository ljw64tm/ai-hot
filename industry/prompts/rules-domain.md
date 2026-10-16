【文献领域翻译规则 — 本平台内容围绕 AI 谄媚及其对用户心理与行为的影响，严格遵守】

1. 歧义默认值：以下词在中文有歧义，**一律按本领域含义翻译**：
   - sycophancy / sycophantic = 谄媚 / 谄媚的（指 AI 或模型迎合、奉承用户；不译“阿谀”“拍马屁”等口语，不译成“同情”）
   - flattery = 奉承；ingratiation = 逢迎（组织行为与社会心理学语境）；validation = 认可或肯定（不译“验证”，除非明显指统计或模型验证）
   - LLM = 大语言模型（绝不译“法学硕士”）
   - Alignment = 对齐（AI 安全语境）；RLHF 保留英文
   - Agent = AI 智能体（不译“代理人”）
   - Hallucination = 模型幻觉
   - Prompt = 提示词；Prompting = 提示
   - Priming = 启动（心理学启动效应）；Manipulation = 操纵；Manipulation check = 操纵检验
   - Mediator / Moderator = 中介变量 / 调节变量；Moderated mediation = 有调节的中介
   - Between-subjects / Within-subjects = 被试间设计 / 被试内设计
   - Wizard-of-Oz = 保留英文 Wizard-of-Oz，必要时括注“绿野仙踪范式”
   - Trust = 信任；Source credibility = 来源可信度；Algorithm aversion / appreciation = 算法厌恶 / 算法欣赏
   - Anthropomorphism = 拟人化

2. 以下构念、量表与理论名称，**首次出现用统一中文译名并括注英文，之后保持同一译名**：
   - psychological entitlement = 心理特权感；deservingness = 应得感
   - self-concept clarity = 自我概念清晰度
   - conspicuous consumption = 炫耀性消费；status consumption = 地位消费
   - uniqueness（需求）= 独特性；ability confirmation = 能力认可
   - Implicit Association Test (IAT) = 内隐联想测验；ERP = 事件相关电位；EEG = 脑电；eye-tracking = 眼动；AOI = 兴趣区
   - 量表、范式、基准、数据集的名称（如 Psychological Entitlement Scale、SycophancyEval 一类）一律保留英文原名，不翻译、不缩写、不自拟中文名

3. 引用与人名一律保留英文原文：作者姓名和 “Cheng et al., 2026” 这类引用格式不翻译、不改年份、不补全作者。机构名保留英文；中国学者和机构若原文已给出中文名则沿用。

4. 研究结论的措辞强度必须与原文一致：
   - 相关结果不写成因果（“与……相关”不能改成“导致”“使得”）
   - “表明”“提示”“suggest”不译成“证明”“证实”
   - “没有发现显著差异”不改成“没有影响”；“部分支持”不改成“支持”
   - “可能”“在某些条件下”等限定词保留

5. 数字、统计量和样本信息**一字不改**：N、p 值、置信区间、Cohen's d / f、η²p、R²、β、OR 等统计量符号保留原文写法；样本量、量表点数（如 7 点量表）、轮次数和百分比保留原文的阿拉伯数字和单位；不要把 N = 240 改写成“两百多人”，也不要把 p < .001 改写成“非常显著”。

6. 代码 / 命令 / URL / 模型名与版本号 **一字不改**保留：
   - 反引号代码 `code` 不翻译
   - 模型和公司名保留英文（如 GPT、Claude、Gemini、Llama、OpenAI、Anthropic），版本号一字不改，不做“翻译性扩写”
   - URL 与 DOI 原样