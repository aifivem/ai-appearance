import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faDoorOpen } from "@fortawesome/free-solid-svg-icons";
import { motion } from "motion/react";
import type { EditorMode } from "../../../../resource/common/nui";
import { shopChange } from "../../../../resource/common/pricing";
import { Button } from "../../components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { useLang } from "../../lib/lang";
import { useAppSelector } from "../../store";
import { cancel, save } from "./actions";

const money = (value: number): string => `$${value.toLocaleString("en-US")}`;

/** Checkout dock bottom left (tgiann-clothing): price of the visit (same function the server charges with), the error of a failed save, leave and save. */
export function Footer({ mode }: { mode: EditorMode }) {
  const t = useLang();
  const data = useAppSelector((state) => state.editor.data);
  const appearance = useAppSelector((state) => state.editor.appearance);
  const busy = useAppSelector((state) => state.editor.busy);
  const error = useAppSelector((state) => state.editor.error);
  if (!data || !appearance) return null;

  const changes = mode === "creator" ? 0 : shopChange(mode, data.appearance, appearance).changes;
  const total = mode === "clothing" ? changes * data.price : changes > 0 ? data.price : 0;
  const label = mode === "creator" ? t("UI_FINISH") : total > 0 ? t("UI_PAY", money(total)) : t("UI_SAVE");

  return (
    <motion.footer
      initial={{ opacity: 0, y: "2vh" }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.4, bounce: 0 }}
      className="absolute bottom-[2vh] left-[2vh] flex w-[40vh] flex-col gap-[0.8vh] [text-shadow:0.1vh_0.1vh_#000]"
    >
      {error && (
        <p role="alert" className="flex items-center gap-[0.8vh] rounded-[0.6vh] bg-danger-bg px-[1.6vh] py-[1vh] text-[1.3vh] text-danger">
          <FontAwesomeIcon icon={faCircleExclamation} aria-hidden />
          {t(error)}
        </p>
      )}
      {mode !== "creator" && (
        <div className="flex h-[4.6vh] items-center justify-between gap-[1vh] rounded-[0.6vh] bg-black/55 px-[1.6vh]">
          <span className="font-display font-extrabold text-[1.4vh] uppercase">{t("UI_TOTAL")}</span>
          <span className={total > 0 ? "text-[1.8vh] font-semibold tabular-nums text-tgi-green" : "text-[1.6vh] font-medium text-text-2"}>
            {total > 0 ? money(total) : t("UI_FREE")}
          </span>
        </div>
      )}
      <div className="flex gap-[0.8vh]">
        {mode !== "creator" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" className="w-[4.6vh] px-0" aria-label={t("UI_CANCEL")} disabled={busy} onClick={cancel}>
                <FontAwesomeIcon icon={faDoorOpen} className="text-[1.7vh]" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{t("UI_CANCEL")}</TooltipContent>
          </Tooltip>
        )}
        <Button variant="primary" className="min-w-0 flex-1" busy={busy} onClick={() => void save()}>
          {label}
        </Button>
      </div>
    </motion.footer>
  );
}
