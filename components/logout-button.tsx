import { logoutAction } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="ghost-button">
        Sign out
      </button>
    </form>
  );
}
