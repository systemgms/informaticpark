import { redirect } from 'next/navigation';

export default function PublicHomePage(): never {
  redirect('/');
}
