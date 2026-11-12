import { StarGlyph } from "../components/brand";
import { ButtonLink } from "../components/ui";

export function NotFound() {
  return (
    <section className="bg-paper py-28">
      <div className="container-page flex flex-col items-start">
        <StarGlyph className="text-amber size-14" />
        <h1 className="font-display-tight mt-6 text-6xl font-extrabold">This page didn't make the cut.</h1>
        <p className="text-ink-soft mt-4 text-lg">It's not on the board. Let's get you back to the script.</p>
        <ButtonLink to="/" className="mt-8">
          Back to home
        </ButtonLink>
      </div>
    </section>
  );
}
