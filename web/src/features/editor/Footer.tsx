import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faDoorOpen } from "@fortawesome/free-solid-svg-icons";
import type { EditorMode } from "../../../../resource/common/nui";
import { shopChange } from "../../../../resource/common/pricing";
import { Button } from "../../components/ui/button";
import { useLang } from "../../lib/lang";
import { useAppSelector } from "../../store";
import { cancel, save } from "./actions";

const money = (value: number): string => `$${value.toLocaleString("en-US")}`;

/** Price of the visit (same function the server charges with), the error of a failed save, leave and save. */
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
    <footer className="flex flex-col gap-[1.2vh] border-t border-line p-[2vh]">
      {error && (
        <p role="alert" className="flex items-center gap-[0.8vh] text-[1.3vh] text-danger">
          <FontAwesomeIcon icon={faCircleExclamation} aria-hidden />
          {t(error)}
        </p>
      )}
      {mode !== "creator" && (
        <div className="flex items-center justify-between text-[1.4vh]">
          <span className="text-text-3">{t("UI_TOTAL")}</span>
          <span className={`font-semibold tabular-nums ${total > 0 ? "text-accent" : "text-text-2"}`}>{total > 0 ? money(total) : t("UI_FREE")}</span>
        </div>
      )}
      <div className="flex gap-[0.8vh]">
        {mode !== "creator" && (
          <Button variant="secondary" className="flex-1" disabled={busy} onClick={cancel}>
            <FontAwesomeIcon icon={faDoorOpen} data-icon="inline-start" aria-hidden />
            {t("UI_CANCEL")}
          </Button>
        )}
        <Button variant="filled" className="flex-[2]" busy={busy} onClick={() => void save()}>
          {label}
        </Button>
      </div>
    </footer>
  );
}
