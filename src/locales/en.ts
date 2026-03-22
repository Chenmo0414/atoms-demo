import { Translations } from "./zh";

export const en: Translations = {
  // Common
  signIn: "Sign in",
  getStartedFree: "Get started free",
  cancel: "Cancel",
  email: "Email",
  password: "Password",
  somethingWentWrong: "Something went wrong",

  // Landing page
  badge: "AI agent-powered app generation",
  heroTitle: "Build Your Ideas",
  heroTitleHighlight: "with Agents",
  heroDesc:
    "Describe what you want to build. Atoms AI agents write the code, generate your app, and let you preview it live — all in minutes.",
  startBuildingFree: "Start building for free",
  featuresTitle: "Everything you need to build faster",
  ctaTitle: "Ready to build?",
  ctaDesc: "Join thousands of builders creating apps with AI agents.",
  startFree: "Start for free",
  footer: "Atoms Demo — Built with Claude AI",
  demoBuild: "Build a todo app with dark mode",
  demoGenerated: "✓ App generated — see preview",
  demoIterate: "make the button red",

  // Features
  engineerMode: "Engineer Mode",
  engineerModeDesc:
    "AI agents break down your request, write code, and iterate until your app is perfect.",
  raceMode: "Race Mode",
  raceModeDesc:
    "Two agents compete simultaneously with different approaches. You pick the winner.",
  versionHistoryFeature: "Version History",
  versionHistoryDesc:
    "Every generation is saved. Browse your history and restore any previous version instantly.",
  remix: "Clone",
  remixDesc:
    "Fork any app and start iterating from a working foundation instead of scratch.",
  publish: "Publish",
  publishDesc:
    "Share your app with the world via a permanent public link in one click.",
  codeView: "Code View",
  codeViewDesc:
    "Inspect, copy, or download the generated HTML/CSS/JS with syntax highlighting.",

  // Dashboard
  newProject: "New Project",
  myProjects: "My Projects",
  projectCount: (n: number) => `${n} projects`,
  signOut: "Sign out",
  noProjectsYet: "No projects yet",
  noProjectsDesc:
    "Create your first project and let AI agents build your idea in seconds.",
  createFirstApp: "Create your first app",
  deleteProject: "Delete project",
  versions: (n: number) => `${n} versions`,
  failedToCreate: "Failed to create project",
  projectNamePlaceholder: "Project name (e.g. Todo App, Dashboard...)",
  creating: "Creating...",
  createProject: "Create Project",
  deleteConfirm: "Delete this project?",
  projectDeleted: "Project deleted",

  // Workspace
  engineer: "Engineer",
  race: "Race",
  history: "History",
  published: "Published",
  publishing: "Publishing...",
  vGenerated: (v: number) => `v${v} generated`,
  winnerSaved: "Winner saved!",
  publishedMsg: "Published!",
  copyLink: "Copy link",
  publishFailed: "Publish failed",
  remixedMsg: "Cloned! Working on a new copy.",
  remixFailed: "Clone failed",
  preview: "Preview",
  code: "Code",

  // ChatPanel
  whatToBuild: "What do you want to build?",
  describeApp: "Describe your app and Atoms will build it",
  suggestionTodo: "Build a todo app with dark mode",
  suggestionWeather: "Create a weather dashboard",
  suggestionPomodoro: "Make a Pomodoro timer",
  appGenerated: "✓ App generated — see preview on the right",
  raceModeBadge: "⚡ Race Mode — two agents will compete",
  iteratePlaceholder:
    'Iterate: "make the button blue", "add a dark mode toggle"...',
  describeAppPlaceholder: "Describe your app...",
  sendTitle: "Send (Enter)",
  cancelTitle: "Cancel",

  // AppViewer
  appWillAppear: "Your app will appear here",
  generating: "Generating...",

  // CodeViewer
  generateToViewCode: "Generate an app to view its code",
  download: "Download",
  copy: "Copy",
  copied: "Copied!",
  copiedToClipboard: "Copied to clipboard",
  applyToPreview: "Apply to Preview",
  saveAsVersion: "Save as new version",
  versionSaved: (v: number) => `Saved as v${v}`,
  saveFailed: "Save failed",

  // VersionHistory
  versionHistory: "Version History",
  noVersionsYet: "No versions yet",
  active: "active",
  restoreVersion: "Restore this version",
  restoredTo: (v: number) => `Restored to v${v}`,
  failedToRestore: "Failed to restore version",

  // RaceMode
  raceModeTitle: "Race Mode",
  agentA: "Agent A",
  agentB: "Agent B",
  twoAgentsCompeting: "— two agents competing simultaneously",
  pickWinner: "Pick Winner",
  pickTheWinner: "— pick the winner!",

  // Share page
  builtWithAtoms: "Built with Atoms",
  remixThis: "Clone this",
  buildYourOwn: "Build your own",

  // Login
  welcomeBack: "Welcome back",
  signInToAccount: "Sign in to your account",
  emailPlaceholder: "you@example.com",
  passwordPlaceholder: "Your password",
  signingIn: "Signing in...",
  signInBtn: "Sign in",
  noAccount: "Don't have an account?",
  createOne: "Create one",
  invalidEmail: "Invalid email",
  passwordRequired: "Password required",
  loginFailed: "Login failed",

  // Register
  createAccount: "Create your account",
  startBuilding: "Start building with AI agents",
  aboutToRemix: "You're about to clone an app",
  signUpToRemix: "Sign up to clone and continue building",
  nameOptional: "Name (optional)",
  namePlaceholder: "Your name",
  atLeast8Chars: "At least 8 characters",
  creatingAccount: "Creating account...",
  createAccountBtn: "Create account",
  createAccountRemix: "Create account & clone",
  alreadyHaveAccount: "Already have an account?",
  passwordMin: "Password must be at least 8 characters",
  registrationFailed: "Registration failed",
  accountCreated: "Account created!",

  // Relative time
  justNow: "just now",
  minutesAgo: (m: number) => `${m}m ago`,
  hoursAgo: (h: number) => `${h}h ago`,
  daysAgo: (d: number) => `${d}d ago`,

  // API error translation (pass-through for English)
  apiError: (err: string): string => err,

  // Language toggle
  langToggle: "中文",

  // Theme toggle
  switchToLight: "Switch to light mode",
  switchToDark: "Switch to dark mode",
  themeSystem: "System theme",
  themeLight: "Light mode",
  themeDark: "Dark mode",

  // Generate / Race errors
  generationFailed: "Generation failed",
  connectionError: "Connection error",
  thinkingProcess: "Thinking process",
  generatingWithThinking: "Thinking and generating the app...",
  raceWinnerLabel: (agent: string) => `Race winner (Agent ${agent})`,

  // Settings
  settings: "Settings",
  accountSettings: "Account Settings",
  accountInfo: "Account Info",
  changeName: "Change Name",
  changePassword: "Change Password",
  currentPassword: "Current Password",
  newPassword: "New Password",
  confirmPassword: "Confirm New Password",
  passwordMismatch: "Passwords do not match",
  passwordChanged: "Password changed successfully",
  nameChanged: "Name changed successfully",
  wrongPassword: "Current password is incorrect",
  backToDashboard: "Back to Projects",
  deleteAccount: "Delete Account",
  deleteAccountConfirm: "Are you sure you want to delete your account? This cannot be undone.",
  accountDeleted: "Account deleted",
  saving: "Saving...",
  save: "Save",
  // namePlaceholder already exists above
  currentPasswordPlaceholder: "Enter current password",
  newPasswordPlaceholder: "Enter new password (min 8 chars)",
  confirmPasswordPlaceholder: "Confirm new password",

  // Homepage
  homepagePromptPlaceholder: "Describe the app you want to build...",
  launchingBuilder: "Launching...",
  buildFromPrompt: "Build from Prompt",

  // Stats
  activeUsers: "Active Users",
  appsGenerated: "Apps Generated",
  uptime: "Uptime",
  rating: "Rating",

  // Use cases
  useCasesTitle: "Use Cases",
  useCasesDesc: "Whatever you want to build, Atoms helps you make it happen",
  useCaseLanding: "Landing Pages",
  useCaseLandingDesc: "Create professional product showcase pages quickly",
  useCaseDashboard: "Dashboards",
  useCaseDashboardDesc: "Visualize data and monitor metrics in real-time",
  useCaseEcommerce: "E-commerce",
  useCaseEcommerceDesc: "Design product displays and shopping flows",
  useCaseMobile: "Mobile UI",
  useCaseMobileDesc: "Responsive design that works on any device",

  // Testimonials
  whatUsersSay: "What Users Say",
  testimonial1: "Atoms completely changed how I build prototypes. What used to take days now takes minutes.",
  testimonial2: "As a product manager, I can quickly validate ideas with Atoms and communicate better with developers.",
  testimonial3: "Race mode is amazing! Seeing different implementation approaches and picking the best one.",

  // User workspace (dashboard)
  userWorkspace: "My Workspace",
  workspaceMembers: "Team Members",
  inviteMember: "Invite Member",
  inviteByEmail: "Enter email to invite...",
  invite: "Invite",
  inviting: "Inviting...",
  memberInvited: "Member invited",
  memberRemoved: "Member removed",
  inviteFailed: "Invite failed",
  removeMember: "Remove",
  roleOwner: "Owner",
  roleEditor: "Editor",
  roleViewer: "Viewer",
  diskPath: "Disk path",

  // Project workspace (project page)
  workspaceFiles: "Workspace Files",
  noWorkspaceFiles: "No files yet",
  workspaceFilesDesc: "Files will be written to disk after generation",

  // How it works
  howItWorks: "How It Works",
  step1Title: "Describe Your Idea",
  step1Desc: "Use natural language to describe what you want to build",
  step2Title: "AI Generates Code",
  step2Desc: "Agents understand your needs and write code automatically",
  step3Title: "Preview & Iterate",
  step3Desc: "See results in real-time and keep improving",

  // Generation recovery
  recoveringGeneration: "Recovering interrupted generation...",
  generationInterrupted: "Interrupted generation detected",
  restartGeneration: "Restart",
  dismissRecovery: "Dismiss",
};
