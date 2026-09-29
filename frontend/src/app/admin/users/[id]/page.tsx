import { UserForm } from '../user-form';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = parseInt(id);
  return <UserForm userId={userId} />;
}
