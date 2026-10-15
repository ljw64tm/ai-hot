// 这个行业的分类体系：类别、标签词表、机构（主体）名录，以及防止张冠李戴的身份词典。
// 模型按这里的词表打标签，主题页（topics.json）按标签归类，筛选栏按类别分组。
// 换行业时：类别的 key 会出现在网址里（/all?category=…），上线后就不要再改；标签和名录可以随时增减。

/**
 * 网页上的类别（筛选栏、卡片角标、RSS 分类订阅）。key 是网址和接口里的身份，上线后不要改。
 * section 是日报里的分节标题（几个类别可以共用一节，按这里的顺序排）；guide 告诉结构抽取模型这一类收什么、
 * 和相邻类别的边界在哪（总的归类原则写在 prompts/structure.md 里）。
 * commentary 标出评论类（观点类内容沉淀在心理健康、行业等类别里，不再单列类别）。
 * 没归上类的资料在日报里放进第一个 key 为 industry 的类别所在的节（没有就放最后一节）。
 * feedLabel 是分类 RSS 标题里的名字（不写就用 label）。公开接口、RSS 和 MCP 里要把一类并进另一类发布，写在站点设置里（site/site.ts 的 PUBLIC_CATEGORIES）。
 */
export const CATEGORIES = [
  { key: "research", label: "研究", feedLabel: "心理学研究", section: "研究与发现", guide: "以新发现和实验证据为核心的心理学论文与研究报道：认知、社会、发展、人格、神经机制、元分析与可重复性。人工智能只是研究工具、测量方法或刺激材料，而且与人的行为、判断或选择无关时，归研究；把人的判断、选择或决策作为研究对象的实验研究归决策。" },
  { key: "decision", label: "决策", feedLabel: "人工智能与经济决策", section: "人工智能与经济决策", guide: "这个站的核心方向：人的判断、选择与决策，以及人工智能在其中的作用。人的偏好与选择研究（风险与不确定性、跨期选择、损失厌恶、启发式与偏差、框架效应、消费与金融决策、博弈与谈判）；把机器学习、大模型或算法纳入决策场景的研究，包括算法建议与人机协作、自动决策的信任与依赖、算法厌恶与公平感知、AI 生成信息的说服与操纵、AI 对劳动与消费决策的影响。纯算法性能不归这一类；市场层面的策略、平台治理和监管归心理行业。" },
  { key: "ai-sycophancy", label: "AI谄媚", feedLabel: "AI 谄媚", section: "AI 谄媚与人的行为", guide: "AI 谄媚（sycophancy）及相近的人机互动现象：模型迎合、附和、过度肯定的倾向如何被测量和诱发，它如何影响人的判断、信心、依赖、纠错与决策质量；用户的反馈如何反过来塑造模型的迎合行为；以及由此带来的信任、成瘾、伦理与治理争议。重点是 AI 的迎合行为与人的反应，把人机关系当作研究对象。" },
  { key: "conspicuous", label: "炫耀性消费", feedLabel: "炫耀性消费", section: "炫耀性消费", guide: "炫耀性消费与地位性消费的心理学：为显示身份、地位或品味而消费的动机与后果，奢侈品、品牌标识与社交平台上的炫耀行为，地位竞争与嫉妒、社会比较、面子与炫耀的关系，以及过度消费、负债与福祉的代价。" },
  { key: "assessment", label: "测评", feedLabel: "心理测评", section: "测量与评估", guide: "测量工具本身：量表与诊断工具的编制、修订与验证，信效度与常模，心理测量方法与统计模型，以及工具使用带来的公平与伦理争议。工具在某项研究里的结论不算测评。" },
  { key: "applied", label: "应用", feedLabel: "心理应用", section: "应用实践", guide: "把心理学用在工作与生活里：职场与组织、教育与学习、运动与健康、人机交互与产品设计、公共安全。重点是真实场景里的做法与效果，不是实验室发现本身；与经济和消费有关的决策研究归决策或炫耀性消费。" },
  { key: "wellbeing", label: "心理健康", feedLabel: "心理健康", section: "心理健康与公共卫生", guide: "面向公众的心理健康：流行率与负担、筛查与预防、自杀与危机干预、青少年与老年等重点人群、数字心理服务与自助工具、社会支持与污名。议题层面的政策与资源分配归心理行业。" },
  { key: "industry", label: "心理行业", feedLabel: "行业动态", section: "行业与政策", guide: "已发生的行业与公共事务：心理健康政策与立法、监管与执业规范、市场与企业动向、机构与学会的举措、资金与项目、人事、真实服务事故及其调查进展；也包括人工智能应用的监管与伦理治理。研究方法本身的问题归研究。" },
] as const satisfies ReadonlyArray<{ key: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

/**
 * 这个行业最受关注的一类发布（AI 行业是新模型）：日报报头的“N 个新模型”、改分类后修订已出的报告都按它数。
 * category 是类别，tag 是标签，两者都对上才算；unit 接在数字后面。
 * 心理学没有这样一类发布，所以设成 null，报头不显示这个数。
 */
export const RELEASE: { category: string; tag: string; unit: string } | null = null;

/** 周报月报的总述可以直接写、不必在报道里找到出处的行业通用词（小写）。站名会自动算进去。 */
export const PLAIN_TERMS: readonly string[] = ["心理学", "人工智能", "ai", "机器学习", "大模型", "算法", "认知", "心理健康", "随机对照试验", "效应量", "元分析", "谄媚", "炫耀性消费"];

/**
 * 内容理解一步给每篇资料判的“内容类型”（写在 prompts/content-understanding.md 里，改了类型要同步改那份提示词）。
 * 评分提示词（prompts/selection-score.md）按类型给五个维度不同的权重。
 */
export const ITEM_TYPES = ["decision_study", "ai_decision_study", "ai_sycophancy_study", "conspicuous_consumption_study", "clinical_trial", "assessment_instrument", "practice_method", "research_paper", "industry_event", "review_or_guideline", "opinion_analysis", "explainer"] as const;

// ── 标签词表 ────────────────────────────────────────────────────────────────────────────

/** 每篇资料的第一个标签必须是这些“分类标签”之一。 */
export const CATEGORY_TAGS = [
  "决策研究", "AI与决策", "AI谄媚", "炫耀性消费", "临床研究", "测量/评估", "实践方法", "论文/研究", "行业动态", "政策/监管", "科普/解读", "评测/综述", "非心理学/其他", "观点/评论",
] as const;

/** 可选的主题标签。 */
export const TOPIC_TAGS = [
  "经济决策", "风险/不确定性", "跨期选择", "消费决策", "金融决策", "博弈/谈判", "判断/偏差", "机器学习", "算法建议", "人机协作", "算法公平", "AI说服/操纵", "AI谄媚", "地位/炫耀", "奢侈品/品牌",
  "认知", "记忆/学习", "情绪", "人格", "社会心理", "发展", "儿童青少年", "老年", "神经科学", "心理测量", "心理治疗", "临床", "焦虑", "抑郁", "睡眠", "职场/组织", "教育", "健康心理", "文化/跨文化",
] as const;

/** 可选的实体标签（期刊与学会）。 */
export const ENTITY_TAGS = ["心理学报", "Nature", "Psychological Science", "PLOS", "Frontiers", "PsyPost"] as const;

/** 模型常写的近义词，统一成词表里的写法。 */
export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  人工智能: "机器学习", ai: "机器学习", 大模型: "机器学习", 语言模型: "机器学习", llm: "机器学习", 深度学习: "机器学习", 算法: "算法建议",
  行为经济学: "经济决策", 决策: "经济决策", 判断与决策: "判断/偏差", 决策偏差: "判断/偏差", 启发式: "判断/偏差", 认知偏差: "判断/偏差",
  风险决策: "风险/不确定性", 不确定性: "风险/不确定性", 概率判断: "风险/不确定性", 跨期决策: "跨期选择", 时间偏好: "跨期选择", 延迟折扣: "跨期选择",
  消费者行为: "消费决策", 消费行为: "消费决策", 消费心理: "消费决策", 投资决策: "金融决策", 金融行为: "金融决策", 财务决策: "金融决策",
  博弈: "博弈/谈判", 谈判: "博弈/谈判", 合作行为: "博弈/谈判", 社会困境: "博弈/谈判", 信任: "人机协作",
  人机交互: "人机协作", 人机协同: "人机协作", 算法厌恶: "算法建议", 算法信任: "算法建议", 推荐算法: "算法建议", 决策支持: "算法建议",
  算法偏见: "算法公平", 公平性: "算法公平", 偏见: "算法公平", 可解释性: "算法公平",
  谄媚: "AI谄媚", 迎合: "AI谄媚", 奉承: "AI谄媚", 附和: "AI谄媚", 讨好: "AI谄媚", 取悦: "AI谄媚", sycophancy: "AI谄媚", 过度肯定: "AI谄媚",
  炫耀: "炫耀性消费", 炫耀消费: "炫耀性消费", 地位消费: "炫耀性消费", 奢侈品: "奢侈品/品牌", 品牌标识: "奢侈品/品牌", 地位竞争: "地位/炫耀", 社会比较: "地位/炫耀", 面子: "地位/炫耀",
  说服: "AI说服/操纵", 操纵: "AI说服/操纵", 信息操纵: "AI说服/操纵", 虚假信息: "AI说服/操纵", 深度伪造: "AI说服/操纵",
  认知心理: "认知", 记忆: "记忆/学习", 学习: "记忆/学习", 情绪调节: "情绪", 情感: "情绪", 性格: "人格",
  社会心理学: "社会心理", 社会认知: "社会心理", 发展心理学: "发展", 儿童: "儿童青少年", 青少年: "儿童青少年", 老龄化: "老年",
  脑科学: "神经科学", 认知神经科学: "神经科学", 心理测量学: "心理测量", 量表: "心理测量",
  认知行为疗法: "心理治疗", cbt: "心理治疗", 心理干预: "心理治疗", 心理咨询: "心理治疗",
  精神卫生: "临床", 临床心理学: "临床", 抑郁症: "抑郁", 焦虑症: "焦虑", 失眠: "睡眠", 睡眠障碍: "睡眠",
  组织行为: "职场/组织", 职场心理: "职场/组织", 工作压力: "职场/组织", 职业倦怠: "职场/组织", 教育心理: "教育", 学习科学: "教育",
  健康行为: "健康心理", 身心健康: "健康心理", 跨文化: "文化/跨文化",
  论文: "论文/研究", 研究: "论文/研究", paper: "论文/研究", papers: "论文/研究", 学术研究: "论文/研究", 元分析: "论文/研究", meta分析: "论文/研究",
  系统综述: "评测/综述", 综述: "评测/综述", 指南: "评测/综述", 专家共识: "评测/综述", 重复验证: "评测/综述",
  量表验证: "测量/评估", 量表编制: "测量/评估", 工具验证: "测量/评估", 评估工具: "测量/评估",
  治疗效果: "临床研究", 随机对照试验: "临床研究", rct: "临床研究", 临床试验: "临床研究", 疗效: "临床研究", 干预研究: "临床研究", 队列研究: "临床研究",
  行为实验: "决策研究", 实验研究: "决策研究", 选择实验: "决策研究", 现场实验: "决策研究", 助推: "决策研究", nudge: "决策研究",
  算法决策: "AI与决策", 智能决策: "AI与决策", 大模型决策: "AI与决策", ai决策: "AI与决策", 自动化决策: "AI与决策",
  政策: "政策/监管", 监管: "政策/监管", 法规: "政策/监管", 立法: "政策/监管", 伦理: "政策/监管",
  行业: "行业动态", 动态: "行业动态", 机构动态: "行业动态", 学会: "行业动态", 资金: "行业动态", 人事: "行业动态",
  教程: "实践方法", 方法: "实践方法", 实践: "实践方法", 技巧: "实践方法", 干预方案: "实践方法", 工具包: "实践方法",
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
  "china-journal": { name: "心理学报", displayTag: "心理学报", aliases: ["心理学报", "Acta Psychologica Sinica"], otherNames: [] },
  nature: { name: "Nature 系列期刊", displayTag: "Nature", aliases: ["Nature Machine Intelligence", "Nature Mental Health", "Nature Human Behaviour", "Nature"], otherNames: [] },
  "journal-of-economic-psychology": { name: "Journal of Economic Psychology", displayTag: null, aliases: ["Journal of Economic Psychology", "Journal of Economic Psychology (JOEP)"], otherNames: [] },
  obhdp: { name: "Organizational Behavior and Human Decision Processes", displayTag: null, aliases: ["Organizational Behavior and Human Decision Processes", "OBHDP"], otherNames: [] },
  "cognition-journal": { name: "Cognition", displayTag: null, aliases: ["Cognition", "Cognition (journal)"], otherNames: [] },
  "frontiers-behavioral-economics": { name: "Frontiers in Behavioral Economics", displayTag: null, aliases: ["Frontiers in Behavioral Economics"], otherNames: [] },
  "frontiers-psychology": { name: "Frontiers in Psychology", displayTag: "Frontiers", aliases: ["Frontiers in Psychology"], otherNames: [] },
  jbdm: { name: "Journal of Behavioral Decision Making", displayTag: null, aliases: ["Journal of Behavioral Decision Making", "JBDM"], otherNames: [] },
  "springer-jru": { name: "Journal of Risk and Uncertainty", displayTag: null, aliases: ["Journal of Risk and Uncertainty"], otherNames: [] },
  "management-science": { name: "Management Science", displayTag: null, aliases: ["Management Science"], otherNames: [] },
  "information-systems-research": { name: "Information Systems Research", displayTag: null, aliases: ["Information Systems Research", "ISR"], otherNames: [] },
  "psych-science": { name: "Psychological Science（APS）", displayTag: "Psychological Science", aliases: ["Psychological Science", "Association for Psychological Science", "APS", "心理科学协会"], otherNames: [] },
  plos: { name: "PLOS", displayTag: "PLOS", aliases: ["PLOS ONE", "PLOS Mental Health", "PLOS"], otherNames: [] },
  psypost: { name: "PsyPost", displayTag: "PsyPost", aliases: ["PsyPost"], otherNames: [] },
  "psychology-today": { name: "Psychology Today", displayTag: null, aliases: ["Psychology Today"], otherNames: [] },
};

/**
 * 身份词典：摘要和标题里出现的机构，必须在原文里也出现过，否则退回原标题、丢掉摘要（防止模型张冠李戴）。
 * 心理学没有“公司发布产品”那种归属问题，但常见把某项研究的结论挂到有名的期刊上，这里只列会被反复提到的。
 */
export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "china-journal", name: "心理学报", patterns: [/心理学报|acta psychologica sinica/i] },
  { id: "nature", name: "Nature 系列期刊", patterns: [/nature machine intelligence|nature mental health|nature human behaviour|nature neuroscience/i] },
  { id: "journal-of-economic-psychology", name: "Journal of Economic Psychology", patterns: [/journal of economic psychology/i] },
  { id: "obhdp", name: "Organizational Behavior and Human Decision Processes", patterns: [/organizational behavior and human decision processes|\bOBHDP\b/] },
  { id: "cognition-journal", name: "Cognition", patterns: [/\bCognition\b/] },
  { id: "jbdm", name: "Journal of Behavioral Decision Making", patterns: [/journal of behavioral decision making|\bJBDM\b/i] },
  { id: "springer-jru", name: "Journal of Risk and Uncertainty", patterns: [/journal of risk and uncertainty/i] },
  { id: "management-science", name: "Management Science", patterns: [/\bManagement Science\b/] },
  { id: "information-systems-research", name: "Information Systems Research", patterns: [/information systems research/i] },
  { id: "psych-science", name: "Psychological Science（APS）", patterns: [/psychological science|association for psychological science|心理科学协会/i] },
  { id: "frontiers-behavioral-economics", name: "Frontiers in Behavioral Economics", patterns: [/frontiers in behavioral economics/i] },
];

/** 这些域名上的文章，发布方就是对应的机构（托管平台如 PLOS、Frontiers、arXiv 不算）。 */
export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "china-journal", domains: ["journal.psych.ac.cn", "psych.ac.cn"] },
  { entityId: "nature", domains: ["nature.com"] },
  { entityId: "psych-science", domains: ["psychologicalscience.org"] },
  { entityId: "management-science", domains: ["pubsonline.informs.org"] },
  { entityId: "information-systems-research", domains: ["pubsonline.informs.org"] },
];

/** 原文里的这些写法也算提到了对应机构。 */
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "nature", pattern: /@NatureMachIntell\b|@NatMentalHealth\b|@NatureHumBehav\b/i },
  { entityId: "psych-science", pattern: /@PsychScience\b|@PsychScienceDir\b/i },
];
