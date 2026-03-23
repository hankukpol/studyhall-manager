import { redirect } from "next/navigation";

type AssistantPhonesPageProps = {
  params: {
    division: string;
  };
};

export default function AssistantPhonesPage({ params }: AssistantPhonesPageProps) {
  redirect(`/${params.division}/admin/phone-submissions`);
}
