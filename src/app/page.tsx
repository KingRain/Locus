import { Banner, Logo } from "@/components/brand";
import { Button } from "@/components/locus-ui";
import { LayoutGrid, PenLine, Users, Wifi } from "@/components/icons";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/motion/fade-in";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Banner />
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5">
        <Logo />
        <Button href="/login" variant="ghost" className="py-2">Log in</Button>
      </header>
      <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
        <FadeIn className="mx-auto max-w-[820px] text-center">
          <p className="mb-4 text-[14px] font-medium uppercase tracking-[0.2em] text-slate">
            Real-time visual workspace
          </p>
          <h1 className="font-display text-[48px] leading-[1.15] text-inkwell-navy md:text-[56px]">
            Draw diagrams your team can <span className="text-coral-emphasis">actually share</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[560px] text-[18px] leading-[1.5] text-slate">
            Locus is a browser whiteboard for students and small teams — shapes, comments, live cursors, and version history without the enterprise fog.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/register">Get started</Button>
            <Button href="/login" variant="ghost">I already have a board</Button>
          </div>
        </FadeIn>

        <StaggerGrid className="mx-auto mt-16 grid max-w-[720px] gap-4 sm:grid-cols-3">
          {[
            { icon: PenLine, title: "Freehand + shapes", body: "Pen, arrows, boxes, and connectors on a dotted whiteboard." },
            { icon: Users, title: "Live presence", body: "See who is in the room and watch cursors move in real time." },
            { icon: Wifi, title: "Two-layer sync", body: "HTTPS for boards and sharing, WebSocket for live edits." },
          ].map(({ icon: Icon, title, body }) => (
            <StaggerItem key={title}>
              <Card className="h-full ring-1 ring-foreground/8 transition hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="pb-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint-pulse/25 text-inkwell-navy">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <CardTitle className="text-[16px]">{title}</CardTitle>
                  <CardDescription className="text-[14px] leading-relaxed">{body}</CardDescription>
                </CardHeader>
              </Card>
            </StaggerItem>
          ))}
        </StaggerGrid>

        <FadeIn delay={0.2} className="mx-auto mt-10 flex max-w-[720px] items-center justify-center gap-2 text-[14px] text-slate">
          <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
          UML, flowchart, ER, and architecture templates included
        </FadeIn>
      </main>
    </div>
  );
}
