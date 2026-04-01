import { MeFromClient } from "./MeFromClient";

export const dynamic = "force-dynamic";

/** 鉴权由 proxy 负责；资料在客户端拉取并模块缓存，减轻 Tab 切换时的服务端阻塞 */
export default function MePage() {
  return <MeFromClient />;
}
