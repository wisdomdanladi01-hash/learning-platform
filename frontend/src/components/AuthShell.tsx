import type { ReactNode } from 'react';
import { BookOpenCheck, Check, ClipboardList, GraduationCap, LibraryBig } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <section className="relative isolate min-h-[calc(100vh-12rem)] overflow-hidden bg-gradient-to-br from-ink-50 via-white to-teal-50/70 px-4 py-8 sm:px-6 sm:py-12">
      <div className="container-page flex min-h-full items-center justify-center">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-ink-100 bg-white shadow-[0_28px_90px_-40px_rgba(13,36,49,0.28)] lg:min-h-[680px] lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative hidden overflow-hidden bg-ink-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" aria-hidden />
            <div className="absolute -bottom-48 -left-32 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" aria-hidden />
            <div className="relative">
              <div className="inline-flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-300 text-ink-950">
                  <BookOpenCheck className="h-6 w-6" />
                </span>
                <span>
                  <span className="block font-display text-lg font-extrabold tracking-tight">SAZU Study Hub</span>
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-300">Student learning resources</span>
                </span>
              </div>
              <h2 className="mt-16 max-w-md font-display text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-[2.75rem]">
                Your learning journey, in one place.
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-ink-200">
                Find course materials, follow your academic catalogue, and keep your study resources close at hand.
              </p>
            </div>

            <div className="relative space-y-3">
              <Feature icon={<LibraryBig className="h-4 w-4" />} text="Browse materials by course and department" />
              <Feature icon={<GraduationCap className="h-4 w-4" />} text="Keep your academic profile connected" />
              <Feature icon={<ClipboardList className="h-4 w-4" />} text="See new study tools as they become available" />
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-200">Study Hub</p>
                    <p className="mt-1 font-display text-lg font-bold">Start with what you need</p>
                  </div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-300/15 text-teal-200">
                    <Check className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-4 flex gap-2" aria-hidden>
                  <span className="h-1.5 flex-1 rounded-full bg-teal-300" />
                  <span className="h-1.5 flex-1 rounded-full bg-white/20" />
                  <span className="h-1.5 flex-1 rounded-full bg-white/20" />
                </div>
              </div>
            </div>
          </aside>

          <div className="mx-auto flex w-full max-w-md flex-col justify-center p-4 sm:p-8 lg:mx-0 lg:max-w-none lg:p-10 xl:p-14">
            <div className="mb-6 flex justify-center lg:hidden">
              <BrandMark />
            </div>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-ink-100">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-200">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
