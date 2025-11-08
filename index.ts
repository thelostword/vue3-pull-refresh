import PullRefresh from './dist';

declare module 'vue' {
  export interface GlobalComponents {
    PullRefresh: typeof PullRefresh;
  }
}
