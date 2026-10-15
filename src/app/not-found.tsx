import Link from "next/link";
import { Header } from "@/components/layout/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="section">
        <div className="container-x max-w-xl text-center">
          <h1 className="text-h2">הדף הזה לא נמצא</h1>
          <p className="mt-3 text-lead">אולי הקישור ישן או שהוקלד לא נכון.</p>
          <p className="mt-8">
            <Link href="/" className="btn-primary">
              לדף של יום הקהילה
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
