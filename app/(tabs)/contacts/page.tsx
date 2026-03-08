import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyContacts } from "@/lib/supabase/contacts";
import { ContactsContent } from "./ContactsContent";

export default async function ContactsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const contacts = await getMyContacts(supabase);

  return <ContactsContent initialContacts={contacts} />;
}
