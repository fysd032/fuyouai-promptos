import type { GetServerSideProps } from "next";

export default function AppPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>App UI Placeholder</h1>
      <p>
        如果你看到这行字，说明 /app 路由已经生效，不再 404。
        下一步我们把真正的前端 UI 搬进来替换这里。
      </p>
    </div>
  );
}

// 可选：避免静态缓存导致你调试时看不到更新
export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
