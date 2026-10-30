import { useEffect } from "react";
import { Outlet, useParams } from "@tanstack/react-router";
import { motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComputerMouse } from "@fortawesome/free-solid-svg-icons";
import { useNuiEvent } from "fivem-nui-react";
import { NuiMessage } from "../../../../resource/common/nui";
import { ScrollArea } from "../../components/ui/scroll-area";
import { mockOpenData } from "../../dev/mock";
import { useLang } from "../../lib/lang";
import { useAppSelector } from "../../store";
import { cancel, closeEditor, openEditor, toEditorData } from "./actions";
import { DragSurface } from "./DragSurface";
import { Footer } from "./Footer";
import { TAB_INFO, TabBar } from "./TabBar";
import { isTab } from "./tabs";

const TITLES = {
  creator: ["UI_TITLE_CREATOR", "UI_SUB_CREATOR"],
  clothing: ["UI_TITLE_CLOTHING", "UI_SUB_CLOTHING"],
  barber: ["UI_TITLE_BARBER", "UI_SUB_BARBER"],
} as const;

// One options object: a new one per render would re-subscribe (and re-fire the browser mock) on every render.
const OPEN_OPTIONS = { mockData: mockOpenData(), mockDelay: 200 };

function onOpen(value: unknown): void {
  const data = toEditorData(value);
  if (data) openEditor(data);
}

/** Root of the NUI: listens to the client; while open, the title top left, category column and menu on the right, checkout bottom left, all over the game. */
export function Editor() {
  const t = useLang();
  const open = useAppSelector((state) => state.editor.open);
  const mode = useAppSelector((state) => state.editor.data?.mode);
  const { tab } = useParams({ strict: false });

  useNuiEvent(NuiMessage.open, onOpen, OPEN_OPTIONS);
  useNuiEvent(NuiMessage.close, closeEditor);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && !event.defaultPrevented && cancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || !mode) return null;
  const [title, sub] = TITLES[mode];

  return (
    <div className="absolute inset-0 [box-shadow:inset_-1vh_-1vh_20vh_rgba(0,0,0,0.9)]">
      <DragSurface />
      {/* Scrims as tgiann-clothing: dark on the left behind the title and dock, darker on the right behind the menu. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[60vh] bg-[linear-gradient(90deg,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.35)_60%,rgba(0,0,0,0)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_60%,rgba(0,0,0,0.7)_80%,rgba(0,0,0,1)_100%)]" />

      <motion.header
        initial={{ opacity: 0, x: "-2vh" }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0 }}
        className="pointer-events-none absolute left-[3vh] top-[3vh] flex max-w-[70vh] flex-col gap-[1.2vh] [text-shadow:0.1vh_0.1vh_#000]"
      >
        <h1 className="font-display font-extrabold text-[4.4vh] uppercase leading-none tracking-[-0.01em]">{t(title)}</h1>
        <p className="text-[1.6vh] text-text-2">{t(sub)}</p>
        <span className="mt-[0.8vh] flex items-center gap-[0.8vh] text-[1.4vh] font-medium text-white/85">
          <span className="inline-flex h-[2.2vh] min-w-[2.2vh] items-center justify-center rounded-[0.4vh] bg-white/90 text-[1.1vh] text-black [text-shadow:none]">
            <FontAwesomeIcon icon={faComputerMouse} aria-hidden />
          </span>
          {t("UI_ROTATE_HINT")}
        </span>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, x: "2vh" }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0 }}
        className="absolute inset-y-0 right-[50vh] my-auto h-fit"
      >
        <TabBar mode={mode} />
      </motion.div>

      <motion.aside
        initial={{ opacity: 0, x: "2vh" }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0 }}
        className="absolute bottom-[2vh] right-[2vh] top-[3vh] flex w-[46vh] flex-col gap-[2vh] [text-shadow:0.1vh_0.1vh_#000]"
      >
        <h2 className="truncate font-display font-extrabold text-[2.8vh] uppercase leading-[1.2] tracking-[-0.01em]">{isTab(tab) ? t(TAB_INFO[tab].label) : t(title)}</h2>
        <ScrollArea className="min-h-0 flex-1">
          <Outlet />
        </ScrollArea>
      </motion.aside>

      <Footer mode={mode} />
    </div>
  );
}
