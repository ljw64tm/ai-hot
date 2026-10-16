// 这个行业的分类体系：类别、标签词表、机构（主体）名录，以及防止张冠李戴的身份词典。
// 模型按这里的词表打标签，主题页（topics.json）按标签归类，筛选栏按类别分组。
// 换行业时：类别的 key 会出现在网址里（/all?category=…），上线后就不要再改；标签和名录可以随时增减。

/**
 * 网页上的类别（筛选栏、卡片角标、RSS 分类订阅）。key 是网址和接口里的身份，上线后不要改。
 * section 是日报里的分节标题（几个类别可以共用一节，按这里的顺序排）；guide 告诉结构抽取模型这一类收什么、
 * 和相邻类别的边界在哪（总的归类原则写在 prompts/structure.md 里）。
 * commentary 标出评论类（观点类内容沉淀在对应主题类别里，不再单列类别）。
 * 没归上类的资料在日报里放进第一个 key 为 industry 的类别所在的节（没有就放最后一节）。
 * feedLabel 是分类 RSS 标题里的名字（不写就用 label）。公开接口、RSS 和 MCP 里要把一类并进另一类发布，写在站点设置里（site/site.ts 的 PUBLIC_CATEGORIES）。
 */
export const CATEGORIES = [
  { key: "sycophancy-spending", label: "谄媚与炫耀消费", feedLabel: "AI 谄媚与炫耀性消费", section: "AI 谄媚与炫耀性消费", guide: "本站最核心的方向：AI 的谄媚、迎合、过度肯定如何通过提升用户的心理特权感（中介）影响消费决策，尤其是地位性、炫耀性与奢侈品消费，自我概念清晰度在其中起调节作用——AI 怎样放大虚荣、强化身份焦虑、助推攀比与面子消费，用户又怎样利用或追逐 AI 的迎合来为自己的消费决策寻求肯定与心理满足。文章必须同时涉及 AI 的迎合行为和消费/购买行为，只论其中一方的归 ai-sycophancy 或 conspicuous。" },
  { key: "ai-sycophancy", label: "AI谄媚", feedLabel: "AI 谄媚", section: "AI 谄媚与人的行为", guide: "AI 谄媚（sycophancy）本身，不涉及消费：模型迎合、附和、过度肯定的倾向如何被测量和诱发，它如何影响人的判断、信心、依赖、纠错与决策质量，包括提升心理特权感、受自我概念清晰度调节；用户的反馈如何反过来塑造模型的迎合行为；以及由此带来的信任、成瘾、伦理与治理争议。涉及消费或购买决策的归 sycophancy-spending。" },
  { key: "conspicuous", label: "炫耀性消费", feedLabel: "炫耀性消费", section: "炫耀性消费", guide: "炫耀性消费与地位性消费本身，不涉及 AI：为显示身份、地位或品味而消费的动机与后果，包括心理特权感如何驱动这类消费、自我概念清晰度如何调节这层关系；奢侈品、品牌标识与社交平台上的炫耀行为，地位竞争与嫉妒、社会比较、面子与炫耀的关系，以及过度消费、负债与福祉的代价。涉及 AI 或算法如何影响这类消费的归 sycophancy-spending。" },
  { key: "industry", label: "政策与行业", feedLabel: "政策与行业", section: "政策与行业", guide: "与 AI 谄媚、炫耀性消费直接相关的政策与行业动态：AI 公司调整模型迎合倾向的产品与训练策略、消费者保护与广告监管对 AI 说服或操纵消费者的治理、平台对炫耀性展示与攀比式营销规则的变化，以及相关的资金与人事变化。不涉及这两个主题的通用科技或消费行业新闻不归这里。" },
] as const satisfies ReadonlyArray<{ key: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

/**
 * 这个行业最受关注的一类发布（AI 行业是新模型）：日报报头的“N 个新模型”、改分类后修订已出的报告都按它数。
 * category 是类别，tag 是标签，两者都对上才算；unit 接在数字后面。
 * 心理学没有这样一类发布，所以设成 null，报头不显示这个数。
 */
export const RELEASE: { category: string; tag: string; unit: string } | null = null;

/** 周报月报的总述可以直接写、不必在报道里找到出处的行业通用词（小写）。站名会自动算进去。 */
export const PLAIN_TERMS: readonly string[] = ["人工智能", "ai", "机器学习", "大模型", "算法", "谄媚", "心理特权感", "自我概念清晰度", "炫耀性消费", "奢侈品", "效应量", "元分析"];

/**
 * 内容理解一步给每篇资料判的“内容类型”（写在 prompts/content-understanding.md 里，改了类型要同步改那份提示词）。
 * 评分提示词（prompts/selection-score.md）按类型给五个维度不同的权重。
 */
export const ITEM_TYPES = ["sycophancy_spending_study", "ai_sycophancy_study", "conspicuous_consumption_study", "research_paper", "industry_event", "review_or_guideline", "opinion_analysis", "explainer"] as const;

// ── 标签词表 ────────────────────────────────────────────────────────────────────────────

/** 每篇资料的第一个标签必须是这些“分类标签”之一。 */
export const CATEGORY_TAGS = [
  "谄媚消费", "AI谄媚", "炫耀性消费", "行业动态", "政策/监管", "科普/解读", "评测/综述", "论文/研究", "非心理学/其他", "观点/评论",
] as const;

/** 可选的主题标签。 */
export const TOPIC_TAGS = [
  "消费决策", "判断/偏差", "机器学习", "算法建议", "人机协作", "算法公平", "AI说服/操纵", "AI谄媚", "心理特权感", "自我概念清晰度", "地位/炫耀", "奢侈品/品牌",
] as const;

/** 可选的实体标签（期刊与学会）。 */
export const ENTITY_TAGS = ["Nature"] as const;

/** 模型常写的近义词，统一成词表里的写法。 */
export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  人工智能: "机器学习", ai: "机器学习", 大模型: "机器学习", 语言模型: "机器学习", llm: "机器学习", 深度学习: "机器学习", 算法: "算法建议",
  判断与决策: "判断/偏差", 决策偏差: "判断/偏差", 启发式: "判断/偏差", 认知偏差: "判断/偏差",
  消费者行为: "消费决策", 消费行为: "消费决策", 消费心理: "消费决策", 购买决策: "消费决策",
  信任: "人机协作", 人机交互: "人机协作", 人机协同: "人机协作", 算法厌恶: "算法建议", 算法信任: "算法建议", 推荐算法: "算法建议", 决策支持: "算法建议",
  算法偏见: "算法公平", 公平性: "算法公平", 偏见: "算法公平", 可解释性: "算法公平",
  谄媚: "AI谄媚", 迎合: "AI谄媚", 奉承: "AI谄媚", 附和: "AI谄媚", 讨好: "AI谄媚", 取悦: "AI谄媚", sycophancy: "AI谄媚", 过度肯定: "AI谄媚",
  特权感: "心理特权感", 资格感: "心理特权感", entitlement: "心理特权感",
  自我概念清晰性: "自我概念清晰度", 自我清晰度: "自我概念清晰度",
  炫耀: "炫耀性消费", 炫耀消费: "炫耀性消费", 地位消费: "炫耀性消费", 奢侈品: "奢侈品/品牌", 品牌标识: "奢侈品/品牌", 地位竞争: "地位/炫耀", 社会比较: "地位/炫耀", 面子: "地位/炫耀",
  说服: "AI说服/操纵", 操纵: "AI说服/操纵", 信息操纵: "AI说服/操纵", 虚假信息: "AI说服/操纵", 深度伪造: "AI说服/操纵",
  论文: "论文/研究", 研究: "论文/研究", paper: "论文/研究", papers: "论文/研究", 学术研究: "论文/研究", 元分析: "论文/研究", meta分析: "论文/研究",
  系统综述: "评测/综述", 综述: "评测/综述", 指南: "评测/综述", 专家共识: "评测/综述", 重复验证: "评测/综述",
  政策: "政策/监管", 监管: "政策/监管", 法规: "政策/监管", 立法: "政策/监管", 伦理: "政策/监管",
  行业: "行业动态", 动态: "行业动态", 机构动态: "行业动态", 学会: "行业动态", 资金: "行业动态", 人事: "行业动态",
  科普: "科普/解读", 解读: "科普/解读", 辟谣: "科普/解读", 大众心理: "科普/解读",
  观点: "观点/评论", 评论: "观点/评论", 访谈: "观点/评论", 社论: "观点/评论",
};

// ── 机构与期刊 ──────────────────────────────────────────────────────────────────────────

/**
 * 机构主题：id → 显示名、卡片上显示的标签（null 表示只用 entity:<id> 归类）、别名。
 * aliases 给结构抽取模型看，也是“标题里点了它的名”时用来匹配的写法；otherNames 是其它常见称呼。
 *
 * 注意：aliases 一个都不能少（包括 name 本身），否则这个机构在主题页的标题匹配会失效。
 */
export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[]; otherNames?: string[] }> = {
  nature: { name: "Nature Machine Intelligence", displayTag: "Nature", aliases: ["Nature Machine Intelligence", "Nature"], otherNames: [] },
  "journal-of-economic-psychology": { name: "Journal of Economic Psychology", displayTag: null, aliases: ["Journal of Economic Psychology", "Journal of Economic Psychology (JOEP)"], otherNames: [] },
  "frontiers-behavioral-economics": { name: "Frontiers in Behavioral Economics", displayTag: null, aliases: ["Frontiers in Behavioral Economics"], otherNames: [] },
  jbdm: { name: "Journal of Behavioral Decision Making", displayTag: null, aliases: ["Journal of Behavioral Decision Making", "JBDM"], otherNames: [] },
  "journal-of-consumer-psychology": { name: "Journal of Consumer Psychology", displayTag: null, aliases: ["Journal of Consumer Psychology", "JCP"], otherNames: [] },
  "journal-of-business-research": { name: "Journal of Business Research", displayTag: null, aliases: ["Journal of Business Research", "JBR"], otherNames: [] },
  "journal-of-retailing": { name: "Journal of Retailing", displayTag: null, aliases: ["Journal of Retailing"], otherNames: [] },
  "journal-of-consumer-research": { name: "Journal of Consumer Research", displayTag: null, aliases: ["Journal of Consumer Research", "JCR"], otherNames: [] },
  "journal-of-personality-and-social-psychology": { name: "Journal of Personality and Social Psychology", displayTag: null, aliases: ["Journal of Personality and Social Psychology", "JPSP"], otherNames: [] },
};

/**
 * 身份词典：摘要和标题里出现的机构，必须在原文里也出现过，否则退回原标题、丢掉摘要（防止模型张冠李戴）。
 * 心理学没有“公司发布产品”那种归属问题，但常见把某项研究的结论挂到有名的期刊上，这里只列会被反复提到的。
 */
export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "nature", name: "Nature Machine Intelligence", patterns: [/nature machine intelligence/i] },
  { id: "journal-of-economic-psychology", name: "Journal of Economic Psychology", patterns: [/journal of economic psychology/i] },
  { id: "jbdm", name: "Journal of Behavioral Decision Making", patterns: [/journal of behavioral decision making|\bJBDM\b/i] },
  { id: "journal-of-consumer-psychology", name: "Journal of Consumer Psychology", patterns: [/journal of consumer psychology|\bJCP\b/i] },
  { id: "journal-of-business-research", name: "Journal of Business Research", patterns: [/journal of business research|\bJBR\b/i] },
  { id: "journal-of-retailing", name: "Journal of Retailing", patterns: [/\bjournal of retailing\b/i] },
  { id: "frontiers-behavioral-economics", name: "Frontiers in Behavioral Economics", patterns: [/frontiers in behavioral economics/i] },
  { id: "journal-of-consumer-research", name: "Journal of Consumer Research", patterns: [/journal of consumer research|\bJCR\b/i] },
  { id: "journal-of-personality-and-social-psychology", name: "Journal of Personality and Social Psychology", patterns: [/journal of personality and social psychology|\bJPSP\b/i] },
];

/** 这些域名上的文章，发布方就是对应的机构（托管平台如 PLOS、Frontiers、arXiv 不算）。 */
export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "nature", domains: ["nature.com"] },
];

/** 原文里的这些写法也算提到了对应机构。 */
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "nature", pattern: /@NatureMachIntell\b/i },
];
