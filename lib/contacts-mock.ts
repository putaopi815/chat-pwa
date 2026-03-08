import type { Contact } from "@/types";

export const MOCK_CONTACTS: Contact[] = [
  { id: "demo", nickname: "林晓", accountId: "linxiao_1024", avatarColor: "#C8D4FF" },
  { id: "zhaochen", nickname: "赵晨", accountId: "zhaochen_88", avatarColor: "#FFD9C5" },
  { id: "zhouning", nickname: "周宁", accountId: "zhouning_66", avatarColor: "#CFEED8" },
  { id: "wangyu", nickname: "王宇", accountId: "wangyu_99", avatarColor: "#E8D5F2" },
  { id: "lixiao", nickname: "李潇", accountId: "lixiao_01", avatarColor: "#D4E4FF" },
  { id: "sunmin", nickname: "孙敏", accountId: "sunmin_77", avatarColor: "#FFE5C8" },
];

export function getContactById(id: string): Contact | undefined {
  return MOCK_CONTACTS.find((c) => c.id === id);
}
