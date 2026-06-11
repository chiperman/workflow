module.exports = {
  types: [
    {
      value: 'feat',
      name: 'feat:     新功能',
      emoji: '✨',
    },
    {
      value: 'fix',
      name: 'fix:      修复 bug',
      emoji: '🐛',
    },
    {
      value: 'docs',
      name: 'docs:     文档更新',
      emoji: '📝',
    },
    {
      value: 'style',
      name: 'style:    代码格式（不影响代码运行）',
      emoji: '💄',
    },
    {
      value: 'refactor',
      name: 'refactor: 重构代码',
      emoji: '♻️',
    },
    {
      value: 'perf',
      name: 'perf:     性能优化',
      emoji: '⚡️',
    },
    {
      value: 'test',
      name: 'test:     添加测试',
      emoji: '✅',
    },
    {
      value: 'chore',
      name: 'chore:    构建或工具变动',
      emoji: '🔧',
    },
    {
      value: 'build',
      name: 'build:    构建系统或依赖',
      emoji: '🏗️',
    },
    {
      value: 'ci',
      name: 'ci:       CI 配置',
      emoji: '⚙️',
    },
    {
      value: 'revert',
      name: 'revert:   回退提交',
      emoji: '⏮️',
    },
  ],

  scopes: [
    { name: 'ui' },
    { name: 'api' },
    { name: 'hooks' },
    { name: 'services' },
    { name: 'utils' },
    { name: 'config' },
    { name: 'types' },
    { name: 'components' },
    { name: '结构' },
    { name: 'deps' },
  ],

  scopeOverrides: {
    fix: [{ name: 'merge conflict resolution' }],
  },

  usePreparedCommit: false,

  allowTicketNumber: false,

  isTicketNumberRequired: false,

  ticketNumberPrefix: 'TICKET-',

  ticketNumberRegExp: '\\d{1,5}',

  // it needs to match the value for field type. Eg.: 'fix'
  /*
  scopeOverrides: {
    fix: [
      {name: 'merge conflict resolution'},
      {name: 'tests'}
    ]
  },
  */
  messages: {
    type: '选择提交类型:',
    scope: '选择影响的范围（可选）:',
    // used if allowCustomScopes is true
    customScope: '输入自定义的范围:',
    subject: '简写提交说明（使用祈使句，不超过 50 个字符）:\n',
    body: '详细说明（可选）。使用 "|" 换行:\n',
    breaking: '破坏性的变动（可选）:\n',
    footer: '相关问题（可选）。例如 #123:\n',
    confirmCommit: '确认提交?',
  },

  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],
  // limit subject length
  subjectLimit: 100,
  breakingPrefix: '破坏性变动: ',
  footerPrefix: '相关问题: ',
};
