import { redirect } from "next/navigation";

export default async function PosRedirectPage({
  params,
}: {
  params: Promise<{ enterpriseSlug: string }>;
}) {
  const { enterpriseSlug } = await params;
  redirect(`/pos/${enterpriseSlug}`);
}
