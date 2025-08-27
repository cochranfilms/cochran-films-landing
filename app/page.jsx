import { redirect } from 'next/navigation'

export default function Page(){
  redirect('/home')
}
export const metadata = { robots: { index: false, follow: false } }