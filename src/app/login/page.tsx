import { LoginForm } from "@/components/LoginForm";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) { const { returnTo } = await searchParams; const safeReturnTo = returnTo?.startsWith("/") ? returnTo : "/today-tarot"; return <LoginForm returnTo={safeReturnTo} />; }
