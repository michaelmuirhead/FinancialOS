import { createContext, ReactNode, useContext, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { TransactionForm } from "@/components/forms/TransactionForm";
import { BillForm } from "@/components/forms/BillForm";
import { AccountForm } from "@/components/forms/AccountForm";
import { DebtForm } from "@/components/forms/DebtForm";
import { GoalForm } from "@/components/forms/GoalForm";
import { PaycheckForm } from "@/components/forms/PaycheckForm";
import { ScreenshotImportModal } from "@/components/forms/ScreenshotImportModal";

export type QuickAction =
  | "add-transaction"
  | "add-bill"
  | "add-account"
  | "add-debt"
  | "add-goal"
  | "record-paycheck"
  | "import-screenshot";

interface QuickActionsValue {
  open: (action: QuickAction) => void;
}

const QuickActionsContext = createContext<QuickActionsValue>({
  open: () => undefined,
});

const TITLES: Record<QuickAction, string> = {
  "add-transaction": "Add transaction",
  "add-bill": "Add bill",
  "add-account": "Add account",
  "add-debt": "Add debt",
  "add-goal": "Add savings goal",
  "record-paycheck": "Record paycheck",
  "import-screenshot": "Import from screenshot",
};

export function QuickActionsProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<QuickAction | null>(null);
  const close = () => setAction(null);

  return (
    <QuickActionsContext.Provider value={{ open: setAction }}>
      {children}
      {action === "import-screenshot" ? (
        <ScreenshotImportModal onClose={close} />
      ) : (
        action && (
          <Modal title={TITLES[action]} onClose={close}>
            {action === "add-transaction" && <TransactionForm onDone={close} />}
            {action === "add-bill" && <BillForm onDone={close} />}
            {action === "add-account" && <AccountForm onDone={close} />}
            {action === "add-debt" && <DebtForm onDone={close} />}
            {action === "add-goal" && <GoalForm onDone={close} />}
            {action === "record-paycheck" && <PaycheckForm onDone={close} />}
          </Modal>
        )
      )}
    </QuickActionsContext.Provider>
  );
}

export function useQuickActions(): QuickActionsValue {
  return useContext(QuickActionsContext);
}
