export const zh = {
  // Common
  signIn: "登录",
  getStartedFree: "免费开始",
  cancel: "取消",
  email: "邮箱",
  password: "密码",
  somethingWentWrong: "出了点问题",

  // Landing page
  badge: "AI 智能体驱动的应用生成",
  heroTitle: "用 AI 智能体构建",
  heroTitleHighlight: "你的想法",
  heroDesc:
    "描述你想构建的内容。Atoms AI 智能体编写代码、生成应用，并让你实时预览——全程仅需几分钟。",
  startBuildingFree: "免费开始构建",
  featuresTitle: "构建更快所需的一切",
  ctaTitle: "准备好构建了吗？",
  ctaDesc: "加入数千名使用 AI 智能体创建应用的构建者。",
  startFree: "免费开始",
  footer: "Atoms Demo — 由 Claude AI 构建",
  demoBuild: "构建一个深色模式的待办事项应用",
  demoGenerated: "✓ 应用已生成 — 查看预览",
  demoIterate: "将按钮改为红色",

  // Features
  engineerMode: "工程师模式",
  engineerModeDesc: "AI 智能体分解你的需求，编写代码，反复迭代直到应用完美。",
  raceMode: "竞速模式",
  raceModeDesc: "两个智能体同时以不同方案竞争，由你选出获胜者。",
  versionHistoryFeature: "版本历史",
  versionHistoryDesc: "每次生成都会保存。浏览历史记录，随时恢复任意版本。",
  remix: "克隆",
  remixDesc: "分叉任意应用，从可运行的基础开始迭代，而非从零开始。",
  publish: "发布",
  publishDesc: "一键通过永久公开链接与全球分享你的应用。",
  codeView: "代码视图",
  codeViewDesc: "检查、复制或下载生成的 HTML/CSS/JS，支持语法高亮。",

  // Dashboard
  newProject: "新建项目",
  myProjects: "我的项目",
  projectCount: (n: number) => `${n} 个项目`,
  signOut: "退出登录",
  noProjectsYet: "暂无项目",
  noProjectsDesc: "创建你的第一个项目，让 AI 智能体在几秒内构建你的想法。",
  createFirstApp: "创建第一个应用",
  deleteProject: "删除项目",
  versions: (n: number) => `${n} 个版本`,
  failedToCreate: "创建项目失败",
  projectNamePlaceholder: "项目名称（例如：待办应用、仪表板...）",
  creating: "创建中...",
  createProject: "创建项目",
  deleteConfirm: "删除此项目？",
  projectDeleted: "项目已删除",

  // Workspace
  engineer: "工程师",
  race: "竞速",
  history: "历史",
  published: "已发布",
  publishing: "发布中...",
  vGenerated: (v: number) => `v${v} 已生成`,
  winnerSaved: "获胜者已保存！",
  publishedMsg: "已发布！",
  copyLink: "复制链接",
  publishFailed: "发布失败",
  remixedMsg: "已克隆！正在新副本上工作。",
  remixFailed: "克隆失败",
  preview: "预览",
  code: "代码",

  // ChatPanel
  whatToBuild: "你想构建什么？",
  describeApp: "描述你的应用，Atoms 将为你构建",
  suggestionTodo: "构建一个深色模式的待办事项应用",
  suggestionWeather: "创建天气仪表板",
  suggestionPomodoro: "制作番茄钟计时器",
  appGenerated: "✓ 应用已生成 — 查看右侧预览",
  raceModeBadge: "⚡ 竞速模式 — 两个智能体将竞争",
  iteratePlaceholder: "迭代：\"将按钮改为蓝色\"，\"添加深色模式切换\"...",
  describeAppPlaceholder: "描述你的应用...",
  sendTitle: "发送 (Enter)",
  cancelTitle: "取消",

  // AppViewer
  appWillAppear: "你的应用将出现在这里",
  generating: "生成中...",

  // CodeViewer
  generateToViewCode: "生成应用以查看其代码",
  download: "下载",
  copy: "复制",
  copied: "已复制！",
  copiedToClipboard: "已复制到剪贴板",
  applyToPreview: "应用到预览",
  saveAsVersion: "保存为新版本",
  versionSaved: (v: number) => `已保存为 v${v}`,
  saveFailed: "保存失败",

  // VersionHistory
  versionHistory: "版本历史",
  noVersionsYet: "暂无版本",
  active: "当前",
  restoreVersion: "恢复此版本",
  restoredTo: (v: number) => `已恢复到 v${v}`,
  failedToRestore: "恢复版本失败",

  // RaceMode
  raceModeTitle: "竞速模式",
  agentA: "智能体 A",
  agentB: "智能体 B",
  twoAgentsCompeting: "— 两个智能体正在同时竞争",
  pickWinner: "选择获胜者",
  pickTheWinner: "— 选出获胜者！",

  // Share page
  builtWithAtoms: "由 Atoms 构建",
  remixThis: "克隆此应用",
  buildYourOwn: "构建你自己的",

  // Login
  welcomeBack: "欢迎回来",
  signInToAccount: "登录到你的账户",
  emailPlaceholder: "you@example.com",
  passwordPlaceholder: "你的密码",
  signingIn: "登录中...",
  signInBtn: "登录",
  noAccount: "没有账户？",
  createOne: "创建一个",
  invalidEmail: "邮箱格式无效",
  passwordRequired: "密码不能为空",
  loginFailed: "登录失败",

  // Register
  createAccount: "创建你的账户",
  startBuilding: "开始使用 AI 智能体构建",
  aboutToRemix: "你即将克隆一个应用",
  signUpToRemix: "注册以克隆并继续构建",
  nameOptional: "名称（可选）",
  namePlaceholder: "你的名字",
  atLeast8Chars: "至少 8 个字符",
  creatingAccount: "创建账户中...",
  createAccountBtn: "创建账户",
  createAccountRemix: "创建账户并克隆",
  alreadyHaveAccount: "已有账户？",
  passwordMin: "密码至少需要 8 个字符",
  registrationFailed: "注册失败",
  accountCreated: "账户已创建！",

  // Relative time
  justNow: "刚刚",
  minutesAgo: (m: number) => `${m} 分钟前`,
  hoursAgo: (h: number) => `${h} 小时前`,
  daysAgo: (d: number) => `${d} 天前`,

  // API error translation
  apiError: (err: string): string => {
    const map: Record<string, string> = {
      "Unauthorized": "未授权，请重新登录",
      "Not found": "资源不存在",
      "Invalid credentials": "邮箱或密码错误",
      "Email already in use": "该邮箱已被注册",
      "Missing projectId or prompt": "缺少必要参数",
      "No version to remix": "没有可克隆的版本",
      "Server error": "服务器错误",
    };
    return map[err] ?? err;
  },

  // Language toggle
  langToggle: "EN",

  // Theme toggle
  switchToLight: "切换到浅色模式",
  switchToDark: "切换到深色模式",
  themeSystem: "跟随系统",
  themeLight: "浅色模式",
  themeDark: "深色模式",

  // Generate / Race errors
  generationFailed: "生成失败",
  connectionError: "连接错误",
  raceWinnerLabel: (agent: string) => `竞速获胜者（${agent}）`,
  thinkingProcess: "思考过程",
  generatingWithThinking: "正在思考并生成应用...",

  // Settings
  settings: "设置",
  accountSettings: "账户设置",
  accountInfo: "账户信息",
  changeName: "修改名称",
  changePassword: "修改密码",
  currentPassword: "当前密码",
  newPassword: "新密码",
  confirmPassword: "确认新密码",
  passwordMismatch: "两次密码不一致",
  passwordChanged: "密码修改成功",
  nameChanged: "名称修改成功",
  wrongPassword: "当前密码错误",
  backToDashboard: "返回项目列表",
  deleteAccount: "删除账户",
  deleteAccountConfirm: "确定要删除账户吗？此操作不可恢复。",
  accountDeleted: "账户已删除",
  saving: "保存中...",
  save: "保存",
  // namePlaceholder already exists above
  currentPasswordPlaceholder: "输入当前密码",
  newPasswordPlaceholder: "输入新密码（至少 8 位）",
  confirmPasswordPlaceholder: "再次输入新密码",

  // Homepage
  homepagePromptPlaceholder: "描述你想构建的应用...",
  launchingBuilder: "启动中...",
  buildFromPrompt: "开始构建",

  // Stats
  activeUsers: "活跃用户",
  appsGenerated: "应用已生成",
  uptime: "正常运行时间",
  rating: "评分",

  // Use cases
  useCasesTitle: "适用场景",
  useCasesDesc: "无论你想构建什么，Atoms 都能帮助你快速实现",
  useCaseLanding: "落地页",
  useCaseLandingDesc: "快速创建专业的产品展示页面",
  useCaseDashboard: "数据仪表盘",
  useCaseDashboardDesc: "可视化数据，实时监控业务指标",
  useCaseEcommerce: "电商页面",
  useCaseEcommerceDesc: "设计产品展示和购物流程",
  useCaseMobile: "移动端界面",
  useCaseMobileDesc: "响应式设计，适配各种设备",

  // Testimonials
  whatUsersSay: "用户评价",
  testimonial1: "Atoms 彻底改变了我构建原型的方式。以前需要几天的东西，现在几分钟就搞定了。",
  testimonial2: "作为产品经理，我可以用 Atoms 快速验证想法，和开发团队的沟通也变得更容易。",
  testimonial3: "竞速模式太棒了！可以看到不同的实现方案，选择最好的那个。",

  // User workspace (dashboard)
  userWorkspace: "我的工作空间",
  workspaceMembers: "团队成员",
  inviteMember: "邀请成员",
  inviteByEmail: "输入邮箱邀请...",
  invite: "邀请",
  inviting: "邀请中...",
  memberInvited: "成员已邀请",
  memberRemoved: "成员已移除",
  inviteFailed: "邀请失败",
  removeMember: "移除",
  roleOwner: "所有者",
  roleEditor: "编辑者",
  roleViewer: "查看者",
  diskPath: "磁盘路径",

  // Project workspace (project page)
  workspaceFiles: "工作空间文件",
  noWorkspaceFiles: "暂无文件",
  workspaceFilesDesc: "生成应用后文件将写入磁盘",

  // How it works
  howItWorks: "工作流程",
  step1Title: "描述你的想法",
  step1Desc: "用自然语言描述你想构建的应用",
  step2Title: "AI 生成代码",
  step2Desc: "智能体理解需求，自动编写代码",
  step3Title: "预览和迭代",
  step3Desc: "实时预览效果，持续优化完善",

  // Generation recovery
  recoveringGeneration: "正在恢复上次中断的构建...",
  generationInterrupted: "检测到中断的构建任务",
  restartGeneration: "重新构建",
  dismissRecovery: "忽略",
};

export type Translations = typeof zh;
