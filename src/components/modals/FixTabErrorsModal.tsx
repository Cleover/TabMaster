import {
  DialogButton,
  ModalRoot,
  PanelSection,
  PanelSectionRow,
} from "decky-frontend-lib";
import { useState, VFC, useEffect } from "react";
import { PythonInterop } from "../../lib/controllers/PythonInterop";
import { TabMasterContextProvider } from "../../state/TabMasterContext";
import type { TabMasterManager } from "../../state/TabMasterManager";
import { ModalStyles } from "../styles/ModalStyles";
import { TabErrorsPanel } from "../changes-needed/TabErrorsPanel";

type FixTabErrorsModalRootProps = {
  closeModal?: () => void,
  onConfirm: (fixedTabSettings: TabSettingsDictionary) => void,
  tabs: TabSettingsDictionary,
  erroredFiltersMap: Map<string, FilterErrorEntry[]>;
  tabMasterManager: TabMasterManager;
};

/**
 * Modal root for the Changes Needed modal.
 */
export const FixTabErrorsModalRoot: VFC<FixTabErrorsModalRootProps> = ({ closeModal, onConfirm, tabs, erroredFiltersMap, tabMasterManager }) => {
  // ? add these back when working on styling as they make itteration easier, but in the final version we don't want them, will allow users to back out of the modal
  // onCancel={closeModal} onEscKeypress={closeModal}
  return (
    <ModalRoot bAllowFullSize>
      <TabMasterContextProvider tabMasterManager={tabMasterManager}>
        <ModalStyles />
        <FixTabErrorsModal onConfirm={onConfirm} closeModal={closeModal!} tabs={tabs} erroredFiltersMap={erroredFiltersMap} />
      </TabMasterContextProvider>
    </ModalRoot>
  );
};


type FixTabErrorsModalProps = {
  onConfirm: (fixedTabSettings: TabSettingsDictionary) => void,
  closeModal: () => void,
  tabs: TabSettingsDictionary,
  erroredFiltersMap: Map<string, FilterErrorEntry[]>;
};

/**
 * The modal for fixing tabs with filter errors.
 */
const FixTabErrorsModal: VFC<FixTabErrorsModalProps> = ({ onConfirm, closeModal, tabs, erroredFiltersMap }) => {
  const [changedTabs, setChangedTabs] = useState<TabSettingsDictionary>(Object.fromEntries(Object.entries(tabs).filter(([id]) => erroredFiltersMap.has(id))));
  const [isPassingMap, setIsPassingMap] = useState<{ [tabId: string]: boolean; }>(Object.fromEntries(Array.from(erroredFiltersMap.keys(), tabId => [tabId, false])));
  const [canApply, setCanApply] = useState<boolean>(false);

  useEffect(() => {
    setCanApply(Object.values(isPassingMap).every((isPassing) => isPassing));
  }, [isPassingMap]);

  function updateTabStatus(tab: TabSettings, isPassing: boolean) {
    const passingMap = { ...isPassingMap };
    passingMap[tab.id] = isPassing;
    setIsPassingMap(passingMap);

    const fixedTabs = { ...changedTabs };
    fixedTabs[tab.id] = tab;
    setChangedTabs(fixedTabs);
  }

  function onApply() {
    if (canApply) {
      for (const changedTab of Object.values(changedTabs)) {
        tabs[changedTab.id] = changedTab;
      }
      onConfirm(tabs);
      closeModal();
    } else {
      PythonInterop.toast("Error", "Please fix all tabs before saving");
    }
  }

  return (
    <div className="tab-master-modal-scope">
      <PanelSection>
        <h1>Fixes Needed for One or More Tabs</h1>
        <PanelSectionRow>
          TabMaster has found an issue with one or more of your tabs. Please take a moment to review the issue{erroredFiltersMap.size > 1 ? "s" : ""} below, and correct {erroredFiltersMap.size > 1 ? "them" : "it"}.
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title="Tabs With Errors">
        <PanelSectionRow>
          {Object.values(changedTabs).map((tab: TabSettings, idx: number) => {
            return <TabErrorsPanel index={idx} tab={tab} errorEntries={erroredFiltersMap.get(tab.id)!} onTabStatusChange={updateTabStatus} />;
          })}
        </PanelSectionRow>
      </PanelSection>
      <PanelSection>
        <PanelSectionRow>
          <DialogButton
            onOKButton={onApply}
            onOKActionDescription="Apply Your Fixes"
            onClick={onApply}
            disabled={!canApply}
          >
            Apply Fixes
          </DialogButton>
        </PanelSectionRow>
      </PanelSection>
    </div>
  );
};
