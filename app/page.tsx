import { redirect } from "next/navigation";

// Force the root route to serve the static Vite UI.
export default function Home() {
  redirect("/ui/");
}
