import { redirect } from "next/navigation";


type NewStudentPageProps = {
  params: {
    division: string;
  };
};

export default async function NewStudentPage({ params }: NewStudentPageProps) {
  redirect(`/${params.division}/admin/students?panel=create`);
}
