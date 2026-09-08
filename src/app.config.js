export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/tools/index',
    'pages/groups/index',
    'pages/approval/index',
    'pages/accounts/index',
    'pages/ledger-report/index',
    'pages/mine/index',
    'pages/history/index',
    'pages/wheel-presets/index',
    'pages/wheel/index',
    'pages/xiaoliuren/index',
    'pages/liuyao/index',
    'pages/tarot/index',
    'pages/approval-create/index',
    'pages/approval-detail/index',
    'pages/approval-review/index',
    'pages/ledger/index',
    'pages/ledger-create/index',
    'pages/profile/index',
    'pages/group-create/index',
    'pages/group/index',
    'pages/group-join/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#f4f4f4',
    navigationBarTitleText: 'Apollo Tools',
    navigationBarTextStyle: 'black'
  }
  // 底部导航按主题动态变化（记账/占卜/审批三套），由 <TabBar /> 组件实现，
  // 不再使用原生 tabBar（原生 tabBar 无法在运行时变更数量与页面）。
})
