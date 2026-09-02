import React from 'react';
import { Link } from 'react-router-dom';
import { CircleHelpIcon, CircleXIcon } from 'lucide-react';

export function NotFound() {
  return (
    <main className="relative -mx-4 -my-8 min-h-[calc(100vh-4rem)] overflow-hidden bg-white px-5 py-8 text-[#15171c] sm:-mx-6 lg:-mx-8 lg:-my-10">
      <div className="absolute right-[7%] top-6 hidden sm:inline-flex items-center gap-2 rounded-full bg-[#f7f7f7] px-3 py-1.5 text-[10px] font-extrabold uppercase text-[#303237] shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b00]" />
        Lost page alert
      </div>

      <div className="pointer-events-none absolute left-[9%] top-[24%] h-4 w-3 rotate-[-25deg] rounded-full border border-orange-200 opacity-60" />
      <div className="pointer-events-none absolute right-[22%] top-[15%] h-5 w-4 rotate-[20deg] rounded-full border border-[#ececec] opacity-70" />
      <div className="pointer-events-none absolute right-[17%] top-[25%] h-4 w-5 rotate-[12deg] rounded-full border border-[#ececec] opacity-70" />

      <section className="relative mx-auto grid min-h-[32rem] max-w-5xl items-center gap-9 pt-16 lg:grid-cols-[21rem_minmax(0,1fr)] lg:gap-14 lg:pt-20">
        <div className="relative mx-auto h-[22rem] w-full max-w-[21rem]">
          <div className="absolute left-0 top-10 rotate-[-13deg] font-sans text-[6.5rem] font-black leading-none tracking-normal text-[#15171c]">
            4
          </div>
          <div className="absolute right-1 top-5 rotate-[-21deg] font-sans text-[6.5rem] font-black leading-none tracking-normal text-[#15171c]">
            4
          </div>

          <div className="absolute bottom-2 left-1/2 z-10 h-[13.7rem] w-[13.7rem] -translate-x-1/2 rounded-full border-2 border-dashed border-orange-200 p-3">
            <div
              role="img"
              aria-label="A black retriever resting with a chew bone"
              className="h-full w-full rounded-full bg-cover bg-center shadow-[0_10px_24px_rgba(17,24,39,0.16)]"
              style={{ backgroundImage: 'url(/not-found-dog.png)' }}
            />
          </div>
        </div>

        <div className="relative z-10 max-w-[34rem] text-center lg:text-left">
          <h1 className="font-sans text-[2.35rem] font-black leading-[1.08] tracking-normal text-[#15171c] sm:text-[3rem]">
            Looks like this page ran away... and so did our dog!
          </h1>
          <p className="mt-4 max-w-[31rem] text-sm font-medium leading-6 text-[#73757c]">
            Our energetic retriever spotted a squirrel (or maybe a rogue line of code) and bolted right off the map, taking your requested link with him. Don&apos;t worry, we&apos;re tracking his treats back to safety.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-5 lg:justify-start">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#ff6b00] px-7 py-3 text-sm font-extrabold text-white shadow-[0_14px_24px_rgba(255,107,0,0.28)] transition-colors hover:bg-[#f45f00]">
              <CircleXIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Take Me Home
            </Link>
            <Link
              to="/documents"
              className="inline-flex items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-extrabold text-[#15171c] transition-colors hover:bg-[#f7f7f7]">
              <CircleHelpIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Whistle for Help
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
