import { useEffect } from "react";
import { Outlet } from "@tanstack/react-router";
import { motion } from "motion/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { useNuiEvent } from "fivem-nui-react";
import { NuiMessage } from "../../../../resource/common/nui";
import { ScrollArea } from "../../components/ui/scroll-area";
import { mockOpenData } from "../../dev/mock";
import { useLang } from "../../lib/lang";
import { useAppSelector } from "../../store";
import { cancel, closeEditor, openEditor, toEditorData } from "./actions";
import { DragSurface } from "./DragSurface";
import { Footer } from "./Footer";
import { TabBar } from "./TabBar";

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

/** Root of the NUI: listens to the client, and while open shows the game view controls and the editor panel. */
export function Editor() {
  const t = useLang();
  const open = useAppSelector((state) => state.editor.open);
  const mode = useAppSelector((state) => state.editor.data?.mode);

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
    <div className="absolute inset-0">
      <DragSurface />
      <div className="pointer-events-none absolute bottom-[3vh] left-[52vh] right-0 flex justify-center">
        <span className="flex items-center gap-[0.8vh] rounded-full border border-line bg-[rgba(var(--panel-rgb),0.92)] px-[1.4vh] py-[0.7vh] text-[1.2vh] text-text-3">
          <FontAwesomeIcon icon={faArrowsRotate} aria-hidden />
          {t("UI_ROTATE_HINT")}
        </span>
      </div>

      <motion.aside
        initial={{ opacity: 0, x: "-2vh" }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0 }}
        className="absolute bottom-[3vh] left-[3vh] top-[3vh] flex w-[46vh] flex-col overflow-hidden rounded-[1vh] border border-line bg-[rgba(var(--panel-rgb),0.96)] [box-shadow:inset_0_0.1vh_0_rgba(255,255,255,0.04),0_2.4vh_6.4vh_rgba(0,0,0,0.6)]"
      >
        <header className="flex flex-col gap-[0.6vh] px-[2.4vh] pb-[1.6vh] pt-[2.4vh]">
          <h1 className="text-[2.2vh] font-semibold leading-[1.2] tracking-[-0.01em]">{t(title)}</h1>
          <p className="text-[1.3vh] leading-[1.4] text-text-3">{t(sub)}</p>
        </header>
        <TabBar mode={mode} />
        <ScrollArea className="min-h-0 flex-1">
          <Outlet />
        </ScrollArea>
        <Footer mode={mode} />
      </motion.aside>
    </div>
  );
}
