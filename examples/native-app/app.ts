/// <reference types="miniprogram-api-typings" />

export interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo;
  };
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback;
}

App<IAppOption>({
  globalData: {},
  onLaunch() {
    console.log(
      "[code-ui] Native TypeScript WeChat MiniProgram launched successfully!",
    );
  },
});
