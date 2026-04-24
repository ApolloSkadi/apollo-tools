export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/tools/index',
    'pages/mine/index',
    'pages/wheel/index',
    'pages/xiaoliuren/index',
    'pages/liuyao/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#f8fafc',
    navigationBarTitleText: 'Apollo Tools',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#6b7280',
    selectedColor: '#111827',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/tools/index',
        text: '工具'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
