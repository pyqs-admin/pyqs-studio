import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <main className="auth">
      <div className="card">
        <img className="mascot" src="/theme/assets/mascot/waving.svg" alt="" />
        <img src="/theme/assets/logos/logo.png" alt="pyqs" style={{ height: 34, display: "block", margin: "0 auto 10px" }} />
        <h1>Content Studio</h1>
        <p className="hint">Sign in with the account an admin made for you.</p>
        <SignInForm />
        <p className="small" style={{ textAlign: "center", marginTop: 14 }}>
          pyqs.com · launching soon
        </p>
      </div>
    </main>
  );
}
