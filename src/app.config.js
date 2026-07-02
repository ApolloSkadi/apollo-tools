export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/tools/index',
    'pages/history/index',
    'pages/mine/index',
    'pages/wheel-presets/index',
    'pages/wheel/index',
    'pages/xiaoliuren/index',
    'pages/liuyao/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#f4f4f4',
    navigationBarTitleText: 'Apollo Tools',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#707070',
    selectedColor: '#2c2c2c',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'images/home-gray.png',
        selectedIconPath: 'images/home-black.png'
      },
      {
        pagePath: 'pages/tools/index',
        text: '工具',
        iconPath: 'images/tool-gray.png',
        selectedIconPath: 'images/tool-black.png'
      },
      {
        pagePath: 'pages/history/index',
        text: '历史',
        iconPath: 'images/history-gray.png',
        selectedIconPath: 'images/history-black.png'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'images/user-gray.png',
        selectedIconPath: 'images/user-black.png'
      }
    ]
  }
})
