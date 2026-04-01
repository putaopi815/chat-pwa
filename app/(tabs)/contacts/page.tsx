import { ContactsFromClient } from "./ContactsFromClient";

export const dynamic = "force-dynamic";

/** 鉴权由 proxy 负责；数据在客户端拉取并模块缓存，减轻 Tab 切换时的服务端阻塞 */
export default function ContactsPage() {
  return <ContactsFromClient />;
}
